-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations (workspaces)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Organization members
create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'viewer', -- admin | editor | viewer
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- Projects (one org can have many projects)
create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Pages (smart links)
create table pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  slug text not null, -- e.g. "ganamosmedia"
  whatsapp_message text default 'Hola! Quiero más info',
  auto_redirect boolean default true,
  html_content text, -- custom HTML if using HTML editor
  builder_data jsonb, -- visual builder JSON
  meta_pixel_id text,
  meta_access_token text,
  tiktok_pixel_id text,
  tiktok_access_token text,
  is_published boolean default false,
  created_at timestamptz default now(),
  unique(project_id, slug)
);

-- WhatsApp Lines
create table lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null default 'Nueva línea',
  phone_number text,
  session_data jsonb, -- Baileys session
  status text default 'disconnected', -- connected | disconnected
  is_active boolean default false, -- paid/active
  is_incognito boolean default false,
  days_remaining integer default 0,
  created_at timestamptz default now()
);

-- Events / Analytics
create table events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  page_id uuid references pages(id) on delete set null,
  line_id uuid references lines(id) on delete set null,
  event_type text not null, -- page_view | button_click | conversation_start | purchase
  session_id text,
  phone text,
  ip text,
  user_agent text,
  ref_code text,
  meta_event_id text, -- for deduplication
  created_at timestamptz default now()
);

-- Contacts (CRM)
create table contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text,
  phone text not null,
  email text,
  total_purchases numeric default 0,
  purchase_count integer default 0,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  unique(project_id, phone)
);

-- Sales (comprobantes procesados)
create table sales (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  line_id uuid references lines(id) on delete set null,
  amount numeric,
  currency text default 'ARS',
  reference text,
  concept text,
  image_url text, -- comprobante image
  raw_text text, -- OCR output
  status text default 'pending', -- pending | confirmed | rejected
  meta_event_sent boolean default false,
  created_at timestamptz default now()
);

-- Credits (billing)
create table credits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  balance integer default 0,
  updated_at timestamptz default now()
);

-- Credit transactions
create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  amount integer not null, -- positive = add, negative = use
  description text,
  stripe_payment_id text,
  created_at timestamptz default now()
);

-- Notification subscriptions
create table notification_subs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  event_type text not null, -- qr_ready | low_days_3 | low_days_1
  email text not null,
  created_at timestamptz default now(),
  unique(project_id, event_type, email)
);

-- RLS Policies
alter table organizations enable row level security;
alter table org_members enable row level security;
alter table projects enable row level security;
alter table pages enable row level security;
alter table lines enable row level security;
alter table events enable row level security;
alter table contacts enable row level security;
alter table sales enable row level security;
alter table credits enable row level security;
alter table credit_transactions enable row level security;
alter table notification_subs enable row level security;

-- Org members can read/manage their own membership rows
create policy "members can view own membership" on org_members
  for select using (user_id = auth.uid());

create policy "members manage own membership" on org_members
  for all using (user_id = auth.uid());

-- Users can see orgs they belong to
create policy "org members can view" on organizations
  for select using (
    id in (select org_id from org_members where user_id = auth.uid())
  );

create policy "org members manage" on organizations
  for all using (
    id in (select org_id from org_members where user_id = auth.uid() and role = 'admin')
  );

-- Projects visible to org members
create policy "project members view" on projects
  for select using (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );

create policy "project members manage" on projects
  for all using (
    org_id in (select org_id from org_members where user_id = auth.uid() and role in ('admin','editor'))
  );

-- Pages
create policy "pages select" on pages
  for select using (
    project_id in (
      select p.id from projects p
      join org_members om on om.org_id = p.org_id
      where om.user_id = auth.uid()
    )
  );

create policy "pages manage" on pages
  for all using (
    project_id in (
      select p.id from projects p
      join org_members om on om.org_id = p.org_id
      where om.user_id = auth.uid() and om.role in ('admin','editor')
    )
  );

-- Events (public insert for tracking, restricted read)
create policy "events public insert" on events
  for insert with check (true);

create policy "events org read" on events
  for select using (
    project_id in (
      select p.id from projects p
      join org_members om on om.org_id = p.org_id
      where om.user_id = auth.uid()
    )
  );

-- Lines
create policy "lines select" on lines
  for select using (
    project_id in (
      select p.id from projects p
      join org_members om on om.org_id = p.org_id
      where om.user_id = auth.uid()
    )
  );

create policy "lines manage" on lines
  for all using (
    project_id in (
      select p.id from projects p
      join org_members om on om.org_id = p.org_id
      where om.user_id = auth.uid() and om.role in ('admin','editor')
    )
  );

-- Contacts
create policy "contacts select" on contacts
  for select using (
    project_id in (
      select p.id from projects p
      join org_members om on om.org_id = p.org_id
      where om.user_id = auth.uid()
    )
  );

create policy "contacts manage" on contacts
  for all using (
    project_id in (
      select p.id from projects p
      join org_members om on om.org_id = p.org_id
      where om.user_id = auth.uid() and om.role in ('admin','editor')
    )
  );

-- Sales
create policy "sales select" on sales
  for select using (
    project_id in (
      select p.id from projects p
      join org_members om on om.org_id = p.org_id
      where om.user_id = auth.uid()
    )
  );

create policy "sales insert public" on sales
  for insert with check (true);

-- Credits
create policy "credits view" on credits
  for select using (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );

create policy "org admins manage credits" on credits
  for all using (
    org_id in (select org_id from org_members where user_id = auth.uid() and role = 'admin')
  );

-- Function: auto-create org + credits on signup
create or replace function handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
  new_slug text;
begin
  new_slug := lower(replace(split_part(new.email, '@', 1), '.', '-')) || '-' || substring(new.id::text, 1, 6);
  insert into public.organizations (name, slug, owner_id)
    values (split_part(new.email, '@', 1), new_slug, new.id)
    returning id into new_org_id;
  insert into public.org_members (org_id, user_id, role) values (new_org_id, new.id, 'admin');
  insert into public.credits (org_id, balance) values (new_org_id, 0);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
