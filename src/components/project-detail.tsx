"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ExternalLink, Play, Square, RotateCcw, Check, Loader as Loader2, Circle, CircleAlert as AlertCircle, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getProject, updateProjectProgress } from "@/lib/supabase"
import { runClonePhase } from "@/lib/openrouter"
import { useApiKey } from "@/hooks/use-api-key"
import { CLONE_PHASES, type Project } from "@/types"
import { cn } from "@/lib/utils"

type PhaseStatus = "pending" | "running" | "complete" | "error"

interface PhaseState {
  status: PhaseStatus
  output: string
}

const STATUS_LABEL: Record<Project["status"], string> = {
  idle: "Idle",
  "in-progress": "In Progress",
  complete: "Complete",
  error: "Error",
}

function StepIndicator({ status }: { status: PhaseStatus }) {
  if (status === "complete") return <Check className="size-3.5 text-green-600 dark:text-green-400" />
  if (status === "running") return <Loader2 className="size-3.5 animate-spin text-blue-500" />
  if (status === "error") return <AlertCircle className="size-3.5 text-destructive" />
  return <Circle className="size-3.5 text-muted-foreground/40" />
}

export function ProjectDetail({ id }: { id: string }) {
  const { apiKey, loaded: keyLoaded } = useApiKey()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [activePhase, setActivePhase] = useState<number | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)
  const [phases, setPhases] = useState<PhaseState[]>(
    CLONE_PHASES.map(() => ({ status: "pending", output: "" }))
  )
  const abortRef = useRef<AbortController | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const loadProject = useCallback(async () => {
    const proj = await getProject(id)
    setProject(proj)
    if (proj) {
      const savedStep = proj.current_step ?? 0
      const savedLog = proj.ai_log ?? ""

      if (savedLog) {
        const sections = savedLog.split(/\n\n--- .+ ---\n/)

        setPhases((prev) =>
          prev.map((p, i) => {
            const phaseLog = sections[i + 1] ?? ""
            const status: PhaseStatus =
              i < savedStep ? "complete" :
              i === savedStep && proj.status === "in-progress" ? "running" :
              "pending"
            return { ...p, status, output: phaseLog }
          })
        )
        setExpandedPhase(savedStep < CLONE_PHASES.length ? savedStep : savedStep - 1)
      } else if (savedStep > 0) {
        setPhases((prev) =>
          prev.map((p, i) => ({
            ...p,
            status: i < savedStep ? "complete" : "pending",
          }))
        )
        setExpandedPhase(savedStep < CLONE_PHASES.length ? savedStep : savedStep - 1)
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [phases, activePhase])

  async function runFromPhase(startIndex: number) {
    if (!project || !apiKey) return
    setRunning(true)

    setPhases((prev) =>
      prev.map((p, i) =>
        i < startIndex ? p :
        i === startIndex ? { status: "running", output: "" } :
        { status: "pending", output: "" }
      )
    )
    setExpandedPhase(startIndex)

    await updateProjectProgress(id, { status: "in-progress", current_step: startIndex, ai_log: "" })
    setProject((p) => p ? { ...p, status: "in-progress", current_step: startIndex } : p)

    for (let i = startIndex; i < CLONE_PHASES.length; i++) {
      setActivePhase(i)
      setExpandedPhase(i)
      setPhases((prev) =>
        prev.map((p, idx) => idx === i ? { ...p, status: "running", output: "" } : p)
      )

      abortRef.current = new AbortController()
      let phaseOutput = ""
      let hadError = false

      await new Promise<void>((resolve) => {
        runClonePhase({
          projectId: id,
          url: project.target_url,
          apiKey,
          phaseIndex: i,
          signal: abortRef.current!.signal,
          onChunk: (text) => {
            phaseOutput += text
            setPhases((prev) =>
              prev.map((p, idx) => idx === i ? { ...p, output: phaseOutput } : p)
            )
          },
          onDone: () => {
            setPhases((prev) =>
              prev.map((p, idx) => idx === i ? { ...p, status: "complete", output: phaseOutput } : p)
            )
            resolve()
          },
          onError: (msg) => {
            hadError = true
            setPhases((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, status: "error", output: phaseOutput + `\n\nError: ${msg}` } : p
              )
            )
            resolve()
          },
        })
      })

      if (hadError || abortRef.current.signal.aborted) {
        await updateProjectProgress(id, {
          status: "error",
          current_step: i,
          error_message: hadError ? "Phase failed" : "Stopped by user",
          ai_log: phases.slice(0, i).map((p) => p.output).join("\n\n") + phaseOutput,
        })
        setProject((p) => p ? { ...p, status: "error" } : p)
        setRunning(false)
        setActivePhase(null)
        return
      }

      await updateProjectProgress(id, { current_step: i + 1 })
    }

    await updateProjectProgress(id, { status: "complete", current_step: CLONE_PHASES.length })
    setProject((p) => p ? { ...p, status: "complete" } : p)
    setRunning(false)
    setActivePhase(null)
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleRestart() {
    setPhases(CLONE_PHASES.map(() => ({ status: "pending", output: "" })))
    setExpandedPhase(null)
    setActivePhase(null)
    runFromPhase(0)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-4">
        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        <div className="h-8 w-72 rounded bg-muted animate-pulse" />
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Link href="/"><Button variant="outline" size="sm" className="mt-4">Back</Button></Link>
      </div>
    )
  }

  const completedCount = phases.filter((p) => p.status === "complete").length
  const progress = Math.round((completedCount / CLONE_PHASES.length) * 100)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-3.5" />
        All Projects
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{project.name}</h1>
          <a
            href={project.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            <span className="truncate max-w-sm">{project.target_url}</span>
            <ExternalLink className="size-3 shrink-0" />
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={project.status as "idle" | "in-progress" | "complete"}>
            {STATUS_LABEL[project.status]}
          </Badge>
          {!running && (
            <Button
              size="sm"
              onClick={() => runFromPhase(0)}
              disabled={!keyLoaded || !apiKey}
              className="gap-1.5"
              title={!apiKey ? "Add your OpenRouter API key on the home page first" : undefined}
            >
              <Play className="size-3.5" />
              {project.status === "complete" ? "Re-run" : project.current_step > 0 ? "Continue" : "Run AI Analysis"}
            </Button>
          )}
          {running && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleStop} className="gap-1.5">
                <Square className="size-3.5" />
                Stop
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRestart} className="gap-1.5">
                <RotateCcw className="size-3.5" />
                Restart
              </Button>
            </div>
          )}
        </div>
      </div>

      {!apiKey && keyLoaded && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Add your OpenRouter API key on the{" "}
          <Link href="/" className="underline font-medium">home page</Link>{" "}
          to run the AI analysis.
        </div>
      )}

      {completedCount > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{completedCount} of {CLONE_PHASES.length} phases complete</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {CLONE_PHASES.map((phase) => {
          const phaseState = phases[phase.index]
          const isExpanded = expandedPhase === phase.index
          const hasOutput = phaseState.output.length > 0

          return (
            <div
              key={phase.index}
              className={cn(
                "rounded-xl border transition-colors",
                phaseState.status === "running" ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" :
                phaseState.status === "complete" ? "border-green-200/70 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10" :
                phaseState.status === "error" ? "border-destructive/30 bg-destructive/5" :
                "border-border bg-card"
              )}
            >
              <button
                onClick={() => setExpandedPhase(isExpanded ? null : phase.index)}
                disabled={!hasOutput && phaseState.status === "pending"}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  phaseState.status === "complete" ? "border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30" :
                  phaseState.status === "running" ? "border-blue-300 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30" :
                  phaseState.status === "error" ? "border-destructive/40 bg-destructive/10" :
                  "border-border bg-muted/50"
                )}>
                  <StepIndicator status={phaseState.status} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      phaseState.status === "pending" ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {phase.name}
                    </span>
                    {phaseState.status === "running" && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">Analyzing\u2026</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
                </div>

                {hasOutput && (
                  <ChevronRight className={cn(
                    "size-4 text-muted-foreground transition-transform shrink-0",
                    isExpanded && "rotate-90"
                  )} />
                )}
              </button>

              {isExpanded && hasOutput && (
                <div className="px-4 pb-4">
                  <div
                    ref={phaseState.status === "running" ? logRef : undefined}
                    className="rounded-lg bg-muted/60 border border-border/50 px-4 py-3 font-mono text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto"
                  >
                    {phaseState.output}
                    {phaseState.status === "running" && (
                      <span className="inline-block w-1.5 h-3.5 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {project.error_message && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {project.error_message}
        </div>
      )}
    </div>
  )
}
