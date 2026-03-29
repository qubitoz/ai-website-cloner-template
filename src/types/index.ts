export type ProjectStatus = "idle" | "in-progress" | "complete"

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
