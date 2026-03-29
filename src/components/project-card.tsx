"use client"

import Link from "next/link"
import { ExternalLink, Trash2, Clock, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Project } from "@/types"

interface ProjectCardProps {
  project: Project
  onDelete: (id: string) => void
}

const statusLabel: Record<Project["status"], string> = {
  idle: "Idle",
  "in-progress": "In Progress",
  complete: "Complete",
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1">{project.name}</CardTitle>
          <Badge variant={project.status as "idle" | "in-progress" | "complete"}>
            {statusLabel[project.status]}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 min-w-0">
          <span className="truncate">{project.target_url}</span>
          <a
            href={project.target_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3" />
          </a>
        </CardDescription>
      </CardHeader>

      {project.notes && (
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{project.notes}</p>
        </CardContent>
      )}

      <CardFooter className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {formatDate(project.created_at)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm" className="gap-1">
              Open
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
