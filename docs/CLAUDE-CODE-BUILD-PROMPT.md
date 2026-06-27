# How to drive Claude Code on this project

Open this folder in Claude Code (`cd` into it, run `claude`). Then paste the prompt below as your **first message**. It tells Claude Code to build the v2 spec **gradually, one phase at a time, compiling and testing after each** — not all at once.

After each phase, Claude Code will stop and explain what it did in plain language and wait for your "go" before the next phase. You stay in control.

---

## PROMPT TO PASTE (copy everything between the lines)

---
You are continuing work on **Chindagram**, an existing Next.js + Prisma + Auth.js app. Before doing anything, read these files in full: `CLAUDE.md`, `docs/FEATURES-SPEC.md`, `README.md`, and `DEPLOY.md`. Then confirm back to me, in plain language, what the app is and the v2 plan.

We are building the v2 feature set in `docs/FEATURES-SPEC.md`. **Build it gradually, one phase at a time, in the "Suggested build order" listed there.** Do not jump ahead.

**Working agreement — follow this for every phase:**
1. Announce the phase and give me a short checklist of the parts in it.
2. Build it **part by part**. After each part, keep the app in a working state.
3. After any database change, run `npx prisma migrate dev --name <short-phase-name>`.
4. When the phase is complete: run `npm run build` and confirm **zero errors**, then run `npm run dev` and smoke-test the new feature in the browser. Fix anything broken before continuing.
5. **Commit** with a clear message (e.g., `feat: phase 1 onboarding + roles`).
6. Summarize what changed **in plain, non-technical language** (I'm not a developer), then **STOP and wait for my OK** before starting the next phase.

**Hard rules:**
- Never leave the app broken between messages. It must always build and run.
- Follow the conventions in `CLAUDE.md`: auth gating via `getSessionUser`, post data via `lib/posts`, uploads via `lib/upload`, and **all authorization checked on the server**.
- Honor the spec's **Confirmed decisions** and **Explicit non-goals**. Do not add features that aren't in the spec.
- This platform has **minors** on it. Build the **safety/moderation and onboarding phases first** as the spec orders, and never weaken a safety check for convenience.
- **Ask me before anything destructive** (deleting data, resetting the database, force-resetting migrations). Never commit secrets (`.env`) or the database file.
- If anything in the spec is ambiguous or risky, **pause and ask me** instead of guessing.
- Keep code simple and readable; explain trade-offs plainly.

Start now: read the files, confirm your understanding and the full phase list, then begin **Phase 1 only**.
---

---

## Tips while it works
- If a phase feels too big, say: "break this phase into smaller steps."
- If something looks wrong in the browser, describe what you see; it can debug live (it runs on your machine, unlike the assistant in the Claude desktop app).
- It will ask before risky actions. When unsure, tell it to explain the change first.
- Roughly after each phase, it's worth you clicking around the new feature yourself for a minute before saying "go."
- Some phases need outside services (live streaming, realtime chat, AI helpers). When Claude Code reaches those, it should tell you what to sign up for; take it slow there.
