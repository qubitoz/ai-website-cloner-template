"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createDesignToken, deleteDesignToken } from "@/lib/supabase"
import type { DesignToken, DesignTokenCategory } from "@/types"

interface DesignTokensPanelProps {
  projectId: string
  tokens: DesignToken[]
  onTokensChange: (tokens: DesignToken[]) => void
}

const CATEGORIES: DesignTokenCategory[] = [
  "color",
  "typography",
  "spacing",
  "radius",
  "shadow",
  "other",
]

const categoryColors: Record<DesignTokenCategory, string> = {
  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  typography: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  spacing: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  radius: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  shadow: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  other: "bg-muted text-muted-foreground",
}

export function DesignTokensPanel({
  projectId,
  tokens,
  onTokensChange,
}: DesignTokensPanelProps) {
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [category, setCategory] = useState<DesignTokenCategory>("color")
  const [loading, setLoading] = useState(false)

  const grouped = CATEGORIES.reduce<Record<DesignTokenCategory, DesignToken[]>>(
    (acc, cat) => {
      acc[cat] = tokens.filter((t) => t.category === cat)
      return acc
    },
    { color: [], typography: [], spacing: [], radius: [], shadow: [], other: [] }
  )

  async function handleAdd() {
    if (!name.trim() || !value.trim()) return
    setLoading(true)
    try {
      const token = await createDesignToken({
        project_id: projectId,
        category,
        name: name.trim(),
        value: value.trim(),
      })
      onTokensChange([...tokens, token])
      setName("")
      setValue("")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteDesignToken(id)
    onTokensChange(tokens.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Add Token</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="sm:col-span-1">
            <Label htmlFor="cat" className="sr-only">Category</Label>
            <select
              id="cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as DesignTokenCategory)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="tok-name" className="sr-only">Name</Label>
            <Input
              id="tok-name"
              placeholder="Name (e.g. primary-bg)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="tok-val" className="sr-only">Value</Label>
            <Input
              id="tok-val"
              placeholder="Value (e.g. #1a1a2e)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={loading || !name.trim() || !value.trim()} size="sm" className="h-9">
            <Plus className="size-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No design tokens yet. Add your first one above.
        </p>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const items = grouped[cat]
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${categoryColors[cat]}`}>
                    {cat}
                  </span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {items.map((token) => (
                    <div key={token.id} className="flex items-center gap-3 px-4 py-2.5 bg-card group">
                      <span className="text-sm font-mono text-muted-foreground flex-1 truncate">{token.name}</span>
                      <div className="flex items-center gap-2">
                        {token.category === "color" && /^#[0-9a-fA-F]{3,8}$|^oklch|^rgb|^hsl/.test(token.value) && (
                          <span
                            className="size-4 rounded-sm border border-border shrink-0"
                            style={{ background: token.value }}
                          />
                        )}
                        <span className="text-sm font-mono">{token.value}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(token.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
