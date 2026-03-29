"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ChevronLeft, ExternalLink, Clock, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DesignTokensPanel } from "@/components/design-tokens-panel"
import { AssetsPanel } from "@/components/assets-panel"
import { getProject, getDesignTokens, getAssets, updateProjectStatus } from "@/lib/supabase"
import type { Project, DesignToken, Asset } from "@/types"
import { cn } from "@/lib/utils"

const TABS = ["Overview", "Design Tokens", "Assets"] as const
type Tab = typeof TABS[number]

const STATUS_OPTIONS: Project["status"][] = ["idle", "in-progress", "complete"]

const statusLabel: Record<Project["status"], string> = {
  idle: "Idle",
  "in-progress": "In Progress",
  complete: "Complete",
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [project, setProject] = useState<Project | null>(null)
  const [tokens, setTokens] = useState<DesignToken[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("Overview")
  const [editingStatus, setEditingStatus] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [proj, toks, ass] = await Promise.all([
          getProject(id),
          getDesignTokens(id),
          getAssets(id),
        ])
        setProject(proj)
        setTokens(toks)
        setAssets(ass)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleStatusChange(status: Project["status"]) {
    if (!project) return
    setSavingStatus(true)
    try {
      await updateProjectStatus(id, status)
      setProject({ ...project, status })
    } finally {
      setSavingStatus(false)
      setEditingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-4">
        <div className="h-6 w-24 rounded bg-muted animate-pulse" />
        <div className="h-10 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Link href="/">
          <Button variant="outline" size="sm" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-3.5" />
        All Projects
      </Link>

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold truncate">{project.name}</h1>
            <a
              href={project.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              {project.target_url}
              <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="shrink-0">
            {editingStatus ? (
              <div className="flex items-center gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={savingStatus}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                      s === project.status
                        ? "border-foreground/30 bg-muted"
                        : "border-transparent hover:border-border hover:bg-muted/50"
                    )}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
                <button
                  onClick={() => setEditingStatus(false)}
                  className="text-xs text-muted-foreground hover:text-foreground ml-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingStatus(true)}
                className="flex items-center gap-1.5 group"
              >
                <Badge variant={project.status as "idle" | "in-progress" | "complete"}>
                  {statusLabel[project.status]}
                </Badge>
                <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>

        {project.notes && (
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">{project.notes}</p>
        )}

        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <Clock className="size-3" />
          Created {formatDate(project.created_at)}
        </div>
      </div>

      <div className="border-b border-border mb-6">
        <div className="flex gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {tab === "Design Tokens" && tokens.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">{tokens.length}</span>
              )}
              {tab === "Assets" && assets.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">{assets.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant={project.status as "idle" | "in-progress" | "complete"}>
                {statusLabel[project.status]}
              </Badge>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Design Tokens</p>
              <p className="text-2xl font-semibold">{tokens.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Assets Tracked</p>
              <p className="text-2xl font-semibold">{assets.length}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Target URL</p>
            <a
              href={project.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-foreground hover:underline break-all"
            >
              {project.target_url}
            </a>
          </div>

          {project.notes && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm">{formatDate(project.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm">{formatDate(project.updated_at)}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Design Tokens" && (
        <DesignTokensPanel
          projectId={id}
          tokens={tokens}
          onTokensChange={setTokens}
        />
      )}

      {activeTab === "Assets" && (
        <AssetsPanel
          projectId={id}
          assets={assets}
          onAssetsChange={setAssets}
        />
      )}
    </div>
  )
}
