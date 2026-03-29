"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "openrouter_api_key"

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? ""
    setApiKeyState(stored)
    setLoaded(true)
  }, [])

  const setApiKey = useCallback((key: string) => {
    const trimmed = key.trim()
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setApiKeyState(trimmed)
  }, [])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKeyState("")
  }, [])

  return { apiKey, setApiKey, clearApiKey, loaded, hasKey: loaded && apiKey.length > 0 }
}
