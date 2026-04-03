import type { ComponentType } from "react"

export interface TemplateProps {
  pageId: string
  projectId: string
  sessionId: string
  waPhone: string | null
  waMessage: string
  lineId: string | null
  autoRedirect: boolean
  config: Record<string, unknown>
}

export interface ConfigField {
  key: string
  label: string
  type: "text" | "textarea" | "color" | "image-url" | "boolean" | "select"
  default?: unknown
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
}

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  thumbnail?: string
  configSchema: ConfigField[]
  component: ComponentType<TemplateProps>
}
