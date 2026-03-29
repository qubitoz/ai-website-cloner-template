"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Globe as Globe2, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiKeyInput } from "@/components/api-key-input"
import { Badge } from "@/components/ui/badge"
import { useApiKey } from "@/hooks/use-api-key"
import { getProjects, createProject, deleteProject } from "@/lib/supabase"
import type { Project } from "@/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Trash2 } from "lucide-react"

const STATUS_LABEL: Record<Project["status"], string> = {
  idle: "Idle",
  "in-progress": "In Progress",
  complete: "Complete",
  error: "Error",
}

function formatRelativeDate(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(dateString))
}

export default function HomePage() {
  const router = useRouter()
  const { apiKey, setApiKey, loaded } = useApiKey()
  const [url, setUrl] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [creating, setCreating] = useState(false)
  const [urlError, setUrlError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  function validateUrl(raw: string): string | null {
    const trimmed = raw.trim()
    if (!trimmed) return "Enter a URL to clone"
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : "https://" + trimmed)
      return parsed.href
    } catch {
      return null
    }
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    setUrlError("")

    const validated = validateUrl(url)
    if (!validated) {
      setUrlError("Please enter a valid URL (e.g. https://example.com)")
      inputRef.current?.focus()
      return
    }

    if (!apiKey) {
      setUrlError("Add your OpenRouter API key below before cloning")
      return
    }

    setCreating(true)
    try {
      const hostname = new URL(validated).hostname.replace("www.", "")
      const project = await createProject({
        name: hostname,
        target_url: validated,
      })
      router.push(`/projects/${project.id}`)
    } catch {
      setUrlError("Failed to create project. Please try again.")
      setCreating(false)
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault()
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-muted border border-border mb-4">
              <Globe2 className="size-6 text-foreground" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Clone any website with AI</h1>
            <p className="text-muted-foreground">
              Paste a URL, let the AI analyze the site step by step, and rebuild it pixel-perfect.
            </p>
          </div>

          <form onSubmit={handleStart} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setUrlError("") }}
                  placeholder="https://example.com"
                  disabled={creating}
                  autoFocus
                  className={cn(
                    "flex h-11 w-full rounded-xl border bg-background pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50",
                    urlError ? "border-destructive focus-visible:ring-destructive/30" : "border-input"
                  )}
                />
              </div>
              <Button type="submit" size="lg" disabled={creating || !url.trim()} className="h-11 px-5 gap-1.5 rounded-xl">
                {creating ? "Creating…" : "Start Clone"}
                {!creating && <ArrowRight className="size-4" />}
              </Button>
            </div>

            {urlError && (
              <p className="text-sm text-destructive px-1">{urlError}</p>
            )}

            <div className="flex items-center gap-2 px-1 pt-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">OpenRouter API key:</span>
              {loaded && (
                <ApiKeyInput
                  value={apiKey}
                  onChange={() => {}}
                  onSave={setApiKey}
                />
              )}
              {!loaded && (
                <div className="h-4 w-48 rounded bg-muted/50 animate-pulse" />
              )}
            </div>
          </form>
        </div>
      </div>

      {(loadingProjects || projects.length > 0) && (
        <div className="border-t border-border bg-muted/20 px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Recent Projects</h2>

            {loadingProjects ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {projects.slice(0, 8).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Globe2 className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 font-medium truncate">{project.name}</span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:block">{project.target_url}</span>
                    <Badge
                      variant={project.status as "idle" | "in-progress" | "complete"}
                      className="shrink-0"
                    >
                      {STATUS_LABEL[project.status]}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="size-3" />
                      {formatRelativeDate(project.created_at)}
                    </span>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
