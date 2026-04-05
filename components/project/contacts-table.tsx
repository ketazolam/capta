"use client"

import { useState } from "react"
import ContactDetailDrawer from "./contact-detail-drawer"

interface Contact {
  id: string
  name: string | null
  phone: string
  total_purchases: number
  purchase_count: number
  last_seen_at: string | null
}

export default function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Contacto</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Teléfono</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Total compras</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Compras</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Visto</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                onClick={() => setSelectedId(contact.id)}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/40 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-white">{contact.name || "Sin nombre"}</td>
                <td className="px-4 py-3 text-zinc-400">{contact.phone}</td>
                <td className="px-4 py-3 text-emerald-400 font-medium">
                  {contact.total_purchases > 0
                    ? `$${Number(contact.total_purchases).toLocaleString("es-AR")}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">{contact.purchase_count}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {contact.last_seen_at ? new Date(contact.last_seen_at).toLocaleDateString("es-AR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ContactDetailDrawer
        contactId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
