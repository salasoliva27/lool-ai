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

**Full credential registry, status check, and "where to find" guide → [`venture-os/CREDENTIALS.md`](../venture-os/CREDENTIALS.md)**

Never store secrets in this repo. Never ask Jano for a key in conversation.

Which tools this project needs → [`TOOLS.md`](./TOOLS.md)

---

## CONTEXT MANAGEMENT — MANDATORY

**Never ask Jano to open a new conversation. Always use `/compact` instead.**

When context reaches ~85% (system warning appears), STOP what you're doing and:
1. Save session memory via `mcp__janus-memory__remember` (or Write to memory files if MCP unavailable) — do this BEFORE compacting
2. Ask: *"Context is getting full. Should I `/compact` now and keep going in this same conversation?"*
3. Wait for confirmation — then run `/compact`
4. After compacting, read memory before resuming any work

This applies in ALL repos and ALL Codespaces. The goal is zero conversation restarts — everything happens in one continuous session per working block.

---

## SESSION BEHAVIOR — READ THIS FIRST

**This workspace is: `lool-ai`**

Every time a chat opens — regardless of what the user says first — you MUST do the following before composing any response:

### STEP 0 — PERMISSION MODE (ask this before anything else, every single session)

Before recalling memory, ask Jano:

---
**🔐 Permission mode for this session?**
**🟢 Full Auto** — everything without interruptions | **🟡 Smart** *(default)* — safe ops auto, confirm before push/delete/destructive | **🔴 Manual** — ask before each action

---

Wait for answer, then proceed. Full permission mode definitions → `venture-os/CLAUDE.md`

### STEP 1 — AUTOMATIC SESSION START (do this right after getting permission mode)
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

Declared tool list and storage routing → [`TOOLS.md`](./TOOLS.md)

UI: shadcn/ui + Tailwind (`npx shadcn@latest add [component]`)
Design direction: `uipro init --ai claude` before any UI work
Browser automation: `playwright-cli` (more token-efficient than MCP Playwright)
Memory: `mcp-servers/memory/` — Supabase + pgvector, cross-workspace
