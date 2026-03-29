import { createClient } from "@supabase/supabase-js"
import type { Project, DesignToken, Asset, NewProjectInput } from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createProject(input: NewProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      target_url: input.target_url,
      notes: input.notes ?? "",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProjectStatus(
  id: string,
  status: Project["status"]
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id)

  if (error) throw error
}

export async function updateProjectProgress(
  id: string,
  fields: { status?: Project["status"]; current_step?: number; ai_log?: string; error_message?: string }
): Promise<void> {
  const { error } = await supabase.from("projects").update(fields).eq("id", id)
  if (error) throw error
}

export async function appendProjectLog(id: string, text: string): Promise<void> {
  const { data } = await supabase.from("projects").select("ai_log").eq("id", id).maybeSingle()
  const current = data?.ai_log ?? ""
  const { error } = await supabase.from("projects").update({ ai_log: current + text }).eq("id", id)
  if (error) throw error
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) throw error
}

export async function getDesignTokens(projectId: string): Promise<DesignToken[]> {
  const { data, error } = await supabase
    .from("design_tokens")
    .select("*")
    .eq("project_id", projectId)
    .order("category")

  if (error) throw error
  return data ?? []
}

export async function createDesignToken(
  token: Omit<DesignToken, "id" | "created_at">
): Promise<DesignToken> {
  const { data, error } = await supabase
    .from("design_tokens")
    .insert(token)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDesignToken(id: string): Promise<void> {
  const { error } = await supabase.from("design_tokens").delete().eq("id", id)
  if (error) throw error
}

export async function getAssets(projectId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", projectId)
    .order("asset_type")

  if (error) throw error
  return data ?? []
}

export async function createAsset(
  asset: Omit<Asset, "id" | "created_at">
): Promise<Asset> {
  const { data, error } = await supabase
    .from("assets")
    .insert(asset)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase.from("assets").delete().eq("id", id)
  if (error) throw error
}
