"use client"

import { useState } from "react"
import { Plus, Trash2, Image, Film, Type, Code, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAsset, deleteAsset } from "@/lib/supabase"
import type { Asset, AssetType } from "@/types"

interface AssetsPanelProps {
  projectId: string
  assets: Asset[]
  onAssetsChange: (assets: Asset[]) => void
}

const ASSET_TYPES: AssetType[] = ["image", "video", "font", "svg", "other"]

const assetTypeIcon: Record<AssetType, React.ReactNode> = {
  image: <Image className="size-4 text-blue-500" />,
  video: <Film className="size-4 text-purple-500" />,
  font: <Type className="size-4 text-orange-500" />,
  svg: <Code className="size-4 text-green-500" />,
  other: <File className="size-4 text-muted-foreground" />,
}

export function AssetsPanel({ projectId, assets, onAssetsChange }: AssetsPanelProps) {
  const [name, setName] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [localPath, setLocalPath] = useState("")
  const [assetType, setAssetType] = useState<AssetType>("image")
  const [loading, setLoading] = useState(false)

  const grouped = ASSET_TYPES.reduce<Record<AssetType, Asset[]>>(
    (acc, type) => {
      acc[type] = assets.filter((a) => a.asset_type === type)
      return acc
    },
    { image: [], video: [], font: [], svg: [], other: [] }
  )

  async function handleAdd() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const asset = await createAsset({
        project_id: projectId,
        asset_type: assetType,
        name: name.trim(),
        source_url: sourceUrl.trim(),
        local_path: localPath.trim(),
      })
      onAssetsChange([...assets, asset])
      setName("")
      setSourceUrl("")
      setLocalPath("")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteAsset(id)
    onAssetsChange(assets.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Add Asset</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as AssetType)}
            className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring"
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <Input placeholder="Asset name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Source URL (optional)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          <Input placeholder="Local path (optional)" value={localPath} onChange={(e) => setLocalPath(e.target.value)} />
        </div>
        <Button onClick={handleAdd} disabled={loading || !name.trim()} size="sm">
          <Plus className="size-3.5 mr-1" />
          Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No assets tracked yet. Add your first one above.
        </p>
      ) : (
        <div className="space-y-4">
          {ASSET_TYPES.map((type) => {
            const items = grouped[type]
            if (items.length === 0) return null
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  {assetTypeIcon[type]}
                  <span className="text-sm font-medium capitalize">{type}s</span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {items.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-3 px-4 py-2.5 bg-card group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{asset.name}</p>
                        {asset.source_url && (
                          <p className="text-xs text-muted-foreground truncate">{asset.source_url}</p>
                        )}
                        {asset.local_path && (
                          <p className="text-xs font-mono text-muted-foreground truncate">{asset.local_path}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(asset.id)}
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
