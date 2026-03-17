# LEGAL — lool-ai

### Applicable regulations
- **LFPDPPP** (Ley Federal de Protección de Datos Personales en Posesión de los Particulares) — facial image data is sensitive personal data under Mexican law
- **INAI** guidelines on biometric and image data
- Standard commercial terms for SaaS subscription in Mexico

### Requirements checklist

| Requirement | Status | Notes |
|---|---|---|
| Privacy notice (Aviso de Privacidad) — LFPDPPP compliant | ⬜ | Must be shown to end users before face scan |
| Explicit consent flow before any facial image is captured | ⬜ | Cannot be implicit or bundled |
| Data retention policy — how long facial images are stored | ⬜ | Recommend: session-only, never persisted |
| Data deletion mechanism for users | ⬜ | Required under LFPDPPP |
| Store-side DPA (Data Processing Agreement) | ⬜ | Defines lool-ai as data processor, store as controller |
| Terms of Service for stores | ⬜ | Subscription terms, usage limits, IP ownership |

### Blockers
- **CRITICAL:** No real user facial data can be collected until privacy notice and consent flow are live.
- DPA with stores must be signed before onboarding any paying store.

### Templates needed
- Aviso de Privacidad (bilingual ES/EN)
- Data Processing Agreement (store ↔ lool-ai)
- Store Terms of Service
- User-facing consent modal copy

### Legal log
2026-03-17 — Legal module initialized. LFPDPPP flag carried over from validation phase.
