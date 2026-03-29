"use client"

import { useEffect, useState, useCallback } from "react"
import { Globe as Globe2 } from "lucide-react"
import { ProjectCard } from "@/components/project-card"
import { NewProjectModal } from "@/components/new-project-modal"
import { getProjects, createProject, deleteProject } from "@/lib/supabase"
import type { Project, NewProjectInput } from "@/types"

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
        <Globe2 className="size-6 text-muted-foreground" />
      </div>
      <h2 className="text-base font-semibold mb-1.5">No projects yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Create your first clone project to start tracking design tokens, assets, and components.
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch {
      setError("Failed to load projects.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  async function handleCreate(input: NewProjectInput) {
    const project = await createProject(input)
    setProjects((prev) => [project, ...prev])
  }

  async function handleDelete(id: string) {
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects.length > 0
              ? `${projects.length} project${projects.length !== 1 ? "s" : ""}`
              : "Track and manage your website clone projects"}
          </p>
        </div>
        <NewProjectModal onSubmit={handleCreate} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
