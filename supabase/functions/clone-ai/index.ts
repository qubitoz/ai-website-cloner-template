import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const CLONE_PHASES = [
  {
    name: "Pre-Flight Check",
    prompt: (url: string) =>
      `You are a website cloning assistant. The user wants to clone: ${url}

Perform a pre-flight analysis:
1. Identify the type of website (SaaS, landing page, e-commerce, portfolio, etc.)
2. Estimate complexity (simple/medium/complex) based on the URL and domain
3. List the likely tech stack of the target site
4. Identify any known challenges for cloning this type of site
5. Suggest which browser MCP tool to use and confirm requirements

Be concise and actionable. Format as a checklist.`,
  },
  {
    name: "Phase 1: Reconnaissance",
    prompt: (url: string) =>
      `You are analyzing ${url} for cloning. This is the Reconnaissance phase.

Describe the exact steps to:
1. Take full-page screenshots at desktop (1440px) and mobile (390px)
2. Extract global design tokens: colors, fonts, spacing scale, border radius values
3. Perform the interaction sweep: scroll behaviors, hover states, click states, animations
4. Map the page topology: list every distinct section from top to bottom with names

Provide the exact browser MCP JavaScript commands to extract computed styles, font stacks, and color values. Be specific about which CSS selectors to target.`,
  },
  {
    name: "Phase 2: Foundation Build",
    prompt: (url: string) =>
      `Building the foundation for cloning ${url}.

Describe the exact implementation steps for:
1. Configuring next/font/google with the target site's fonts (provide the Next.js code)
2. Updating globals.css with the target's color tokens using oklch values
3. Creating TypeScript interfaces for the content data structures
4. Extracting inline SVG icons as React components
5. Writing the asset download script (Node.js script to fetch all images/videos)

Provide actual code snippets where possible.`,
  },
  {
    name: "Phase 3: Component Specification",
    prompt: (url: string) =>
      `Writing component specifications for ${url}.

For each major section identified in reconnaissance, create a specification including:
1. Component name and target file path
2. DOM structure (element hierarchy)
3. Key computed CSS values (padding, colors, typography, layout)
4. Interaction model (static/click-driven/scroll-driven/time-driven)
5. States and transitions
6. Asset dependencies
7. Responsive breakpoints

Follow the spec template format from SKILL.md. Prioritize completeness over speed.`,
  },
  {
    name: "Phase 4: Page Assembly",
    prompt: (url: string) =>
      `Assembling the cloned page for ${url}.

Describe the implementation steps for:
1. Wiring all components together in src/app/page.tsx
2. Implementing page-level scroll behaviors (snap, parallax, sticky headers)
3. Setting up any smooth scroll libraries (Lenis/Locomotive Scroll)
4. Connecting real content data to component props
5. Running npx tsc --noEmit and npm run build to verify compilation

Include the exact imports and page layout code structure.`,
  },
  {
    name: "Phase 5: Visual QA",
    prompt: (url: string) =>
      `Performing Visual QA for the ${url} clone.

Create a QA checklist covering:
1. Side-by-side screenshot comparison at 1440px desktop
2. Side-by-side screenshot comparison at 390px mobile
3. Interactive behavior verification (scroll animations, hover states, tab switching)
4. Font rendering comparison
5. Color accuracy check
6. Spacing and layout accuracy
7. Animation timing verification

For each checklist item, provide the browser MCP command or manual check procedure.`,
  },
]

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { projectId, url, apiKey, phaseIndex } = await req.json()

    if (!url || !apiKey || phaseIndex === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: url, apiKey, phaseIndex" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const phase = CLONE_PHASES[phaseIndex]
    if (!phase) {
      return new Response(
        JSON.stringify({ error: `Invalid phase index: ${phaseIndex}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://clone-manager.app",
        "X-Title": "Clone Manager",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          {
            role: "user",
            content: phase.prompt(url),
          },
        ],
        stream: true,
        max_tokens: 1500,
      }),
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      return new Response(
        JSON.stringify({ error: `OpenRouter API error: ${openRouterResponse.status} ${errorText}` }),
        { status: openRouterResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const encoder = new TextEncoder()
    let fullContent = ""

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openRouterResponse.body?.getReader()
        if (!reader) {
          controller.close()
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
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                  continue
                }
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content ?? ""
                  if (content) {
                    fullContent += content
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch {
                  // skip malformed chunks
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
          controller.close()

          if (projectId && fullContent) {
            const stepHeader = `\n\n--- ${phase.name} ---\n`
            await supabase
              .from("projects")
              .update({
                current_step: phaseIndex,
                ai_log: supabase.rpc ? undefined : undefined,
              })
              .eq("id", projectId)

            await supabase.rpc("append_project_log", {
              p_id: projectId,
              p_text: stepHeader + fullContent,
            }).catch(() => {
              supabase
                .from("projects")
                .select("ai_log")
                .eq("id", projectId)
                .single()
                .then(({ data }) => {
                  supabase.from("projects").update({
                    current_step: phaseIndex,
                    ai_log: (data?.ai_log ?? "") + stepHeader + fullContent,
                  }).eq("id", projectId)
                })
            })
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
