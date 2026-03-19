# LOOL-AI — WORKSPACE BRAIN
## Workspace: lool-ai | Part of Venture OS

---

## WHO YOU ARE

You are the build agent for lool-ai — a B2B SaaS virtual try-on widget for Mexican optical SMEs. You operate within the Venture OS portfolio managed from `salasoliva27/venture-os`. Read that repo for portfolio-level context.

---

## THIS WORKSPACE

- **Workspace name:** `lool-ai` (use this in all memory calls)
- **Repo:** github.com/salasoliva27/lool-ai
- **Product:** Embeddable virtual glasses try-on widget for independent optical stores in CDMX
- **Target market:** Independent optical stores in Roma, Condesa, Polanco, Lomas
- **Pricing:** ~800–1,500 MXN/month flat fee OR % of attributed sales (TBD)
- **Legal flag:** Handles facial image data → LFPDPPP compliance required before real user data

---

## CODEBASE STRUCTURE

```
src/
  widget.js        ← Embeddable drop-in script (face-api.js, vanilla JS) — THE PRODUCT
  App.jsx          ← React standalone app — demo/testing
  components/
    TryOn.jsx      ← Camera + MediaPipe face mesh + glasses overlay (React)
    CatalogBar.jsx ← Frame selector UI
  data/
    catalog.json   ← Frame catalog (y_offset_ratio, frame_width_mm, etc.)
  hooks/
    useFaceMesh.js ← MediaPipe FaceMesh hook
  utils/
    glassesRenderer.js ← Canvas drawing logic
demo/              ← Static demo for the embeddable widget
vendor/            ← face-api.js + models for widget.js
mcp-servers/       ← Memory MCP server (Supabase + pgvector)
```

---

## CREDENTIALS — NEVER ASK FOR THESE

All keys are in `salasoliva27/dotfiles/.env` and auto-load into every Codespace.

| Key | Env var |
|---|---|
| Anthropic API | `$ANTHROPIC_API_KEY` |
| Brave Search | `$BRAVE_API_KEY` |
| Supabase URL | `$SUPABASE_URL` |
| Supabase service role | `$SUPABASE_SERVICE_ROLE_KEY` |
| Voyage AI embeddings | `$VOYAGE_API_KEY` |

---

## SESSION BEHAVIOR — READ THIS FIRST

**This workspace is: `lool-ai`**

Every time a chat opens — regardless of what the user says first — you MUST do the following before composing any response:

### AUTOMATIC SESSION START (do this before responding to anything)
1. Call `recall("recent lool-ai work and decisions")` — gets this project's memory
2. Call `recall("venture-os portfolio context and other projects")` — loads cross-project context
3. Read this CLAUDE.md build status section — understand current state
4. You now have full context. Respond to whatever the user asked.

### WHEN THE USER ASKS "where did we leave off" / "what's the status" / "catch me up"
Summarize from the recall() results:
- What was last built or decided in lool-ai
- Current build status (what works, what's next)
- Any open decisions (e.g. pricing model)
- Context from venture-os if relevant

### END OF EVERY SESSION
Before the conversation ends, call `remember()` — even if the user doesn't ask:
```
remember(
  content="[summary: what was built, decisions made, open questions, next steps]",
  workspace="lool-ai",
  project="lool-ai",
  type="session"
)
```
For build decisions or learnings, store separately with type="decision" or type="learning".

**Never skip the end-of-session remember(). It is how the next chat will know what happened here.**

---

## BUILD STATUS

- ✅ React demo app — camera, MediaPipe iris tracking, EMA-smoothed overlay, high-DPI canvas
- ✅ Glasses sit correctly on nose (y_offset_ratio=0.2), stable during blinks
- ✅ Catalog bar with 5 demo Zenni frames + "Agregar al carrito" button
- ⬜ UTM attribution on cart clicks (needed for % pricing model)
- ⬜ widget.js — improve to use MediaPipe instead of face-api.js (better accuracy)
- ⬜ Real client catalog upload flow
- ⬜ Embeddable widget format tested in a real store website

---

## TOOLS FOR THIS PROJECT

UI: shadcn/ui + Tailwind (`npx shadcn@latest add [component]`)
Design direction: `uipro init --ai claude` before any UI work
Browser automation: `playwright-cli` (more token-efficient than MCP Playwright)
Memory: `mcp-servers/memory/` — Supabase + pgvector, cross-workspace
