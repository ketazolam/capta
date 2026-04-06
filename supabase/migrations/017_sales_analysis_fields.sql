-- Store full Claude Vision analysis on sales for auditing and debugging
ALTER TABLE sales ADD COLUMN IF NOT EXISTS bank text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS confidence text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transaction_date text;
