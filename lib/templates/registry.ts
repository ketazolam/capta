import type { TemplateDefinition } from "./types"
import { WhatsAppRedirectDefinition } from "./components/whatsapp-redirect"
import { PalaceCasinoDefinition } from "./components/palace-casino"

// Registry de templates — agregar nuevos templates acá
const templateList: TemplateDefinition[] = [
  WhatsAppRedirectDefinition,
  PalaceCasinoDefinition,
]

const templateMap: Record<string, TemplateDefinition> = Object.fromEntries(
  templateList.map((t) => [t.id, t])
)

export function getTemplate(id: string): TemplateDefinition | null {
  return templateMap[id] ?? null
}

export function getAllTemplates(): TemplateDefinition[] {
  return templateList
}
