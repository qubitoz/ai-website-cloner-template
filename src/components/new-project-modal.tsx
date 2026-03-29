"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { NewProjectInput } from "@/types"

interface NewProjectModalProps {
  onSubmit: (input: NewProjectInput) => Promise<void>
}

export function NewProjectModal({ onSubmit }: NewProjectModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName("")
    setTargetUrl("")
    setNotes("")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !targetUrl.trim()) {
      setError("Name and target URL are required.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), target_url: targetUrl.trim(), notes: notes.trim() })
      setOpen(false)
      reset()
    } catch {
      setError("Failed to create project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger render={
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          New Project
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Clone Project</DialogTitle>
          <DialogDescription>
            Add a website you want to clone. You can track design tokens and assets once created.
          </DialogDescription>
        </DialogHeader>
        <DialogClose render={
          <button className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <X className="size-4" />
          </button>
        } />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              placeholder="e.g. Linear Dashboard Clone"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">Target URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this project..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <DialogClose render={
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            } />
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
