const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface ClonePhaseOptions {
  projectId: string
  url: string
  apiKey: string
  phaseIndex: number
  onChunk: (text: string) => void
  onDone: () => void
  onError: (msg: string) => void
  signal?: AbortSignal
}

export async function runClonePhase(opts: ClonePhaseOptions) {
  const { projectId, url, apiKey, phaseIndex, onChunk, onDone, onError, signal } = opts

  const response = await fetch(`${SUPABASE_URL}/functions/v1/clone-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ projectId, url, apiKey, phaseIndex }),
    signal,
  })

  if (!response.ok) {
    const text = await response.text()
    onError(`Request failed (${response.status}): ${text}`)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onError("No response stream")
    return
  }

  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) onChunk(parsed.content)
            if (parsed.error) {
              onError(parsed.error)
              return
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    }
    onDone()
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      onError(String(err))
    }
  } finally {
    reader.releaseLock()
  }
}
