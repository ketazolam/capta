import type { TemplateDefinition } from "./types"
import { WhatsAppRedirectDefinition } from "./components/whatsapp-redirect"

// Registry de templates — agregar nuevos templates acá
const templateList: TemplateDefinition[] = [
  WhatsAppRedirectDefinition,
  // TODO: Agregar templates custom acá
  // CasinoPromoDefinition,
  // LeadCaptureDefinition,
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
