"use client"

import { useState } from "react"
import { Eye, EyeOff, Key, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ApiKeyInputProps {
  value: string
  onChange: (v: string) => void
  onSave: (v: string) => void
  className?: string
}

export function ApiKeyInput({ value, onChange, onSave, className }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false)
  const [editing, setEditing] = useState(!value)
  const [draft, setDraft] = useState(value)

  function handleSave() {
    onSave(draft)
    onChange(draft)
    setEditing(false)
  }

  function handleClear() {
    onSave("")
    onChange("")
    setDraft("")
    setEditing(true)
  }

  if (!editing && value) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Key className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground font-mono">
          {visible ? value : value.slice(0, 8) + "••••••••••••••••••••"}
        </span>
        <button
          onClick={() => setVisible((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
        <button
          onClick={() => { setDraft(value); setEditing(true) }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          change
        </button>
        <button onClick={handleClear} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Key className="size-3.5 text-muted-foreground shrink-0" />
      <Input
        type={visible ? "text" : "password"}
        placeholder="sk-or-v1-..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        className="h-7 text-sm font-mono w-64"
      />
      <button
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
      <Button size="icon-xs" onClick={handleSave} disabled={!draft.trim()} className="size-7">
        <Check className="size-3" />
      </Button>
      {value && (
        <button
          onClick={() => { setDraft(value); setEditing(false) }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
