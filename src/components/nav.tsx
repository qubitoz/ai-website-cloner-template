"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Globe className="size-4.5" />
            <span>Clone Manager</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                pathname === "/"
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <LayoutDashboard className="size-3.5" />
              Projects
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
