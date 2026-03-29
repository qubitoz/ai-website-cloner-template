export type ProjectStatus = "idle" | "in-progress" | "complete" | "error"

export type DesignTokenCategory =
  | "color"
  | "typography"
  | "spacing"
  | "radius"
  | "shadow"
  | "other"

export type AssetType = "image" | "video" | "font" | "svg" | "other"

export interface Project {
  id: string
  name: string
  target_url: string
  status: ProjectStatus
  notes: string
  screenshot_url: string
  current_step: number
  ai_log: string
  error_message: string
  created_at: string
  updated_at: string
}

export interface DesignToken {
  id: string
  project_id: string
  category: DesignTokenCategory
  name: string
  value: string
  created_at: string
}

export interface Asset {
  id: string
  project_id: string
  asset_type: AssetType
  name: string
  source_url: string
  local_path: string
  created_at: string
}

export interface NewProjectInput {
  name: string
  target_url: string
  notes?: string
}

export const CLONE_PHASES = [
  { index: 0, name: "Pre-Flight Check", description: "Verify URL, environment, and requirements" },
  { index: 1, name: "Reconnaissance", description: "Screenshots, design tokens, interaction sweep, page topology" },
  { index: 2, name: "Foundation Build", description: "Fonts, colors, TypeScript types, SVGs, assets" },
  { index: 3, name: "Component Specification", description: "Write specs and dispatch builder agents" },
  { index: 4, name: "Page Assembly", description: "Wire components, implement behaviors, verify build" },
  { index: 5, name: "Visual QA", description: "Side-by-side comparison and interaction verification" },
] as const
