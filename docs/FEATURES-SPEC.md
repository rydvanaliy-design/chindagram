# Chindagram — Features Build Spec (v2 vision)

This spec turns the owner's interview answers into a buildable plan. It **extends the existing app** (which already has accounts, posts, multi-photo, reels, stories, feed, likes, comments, saves, follow, profiles, DMs with moderation, notifications, search/explore, admin queue, settings). Build on top of that; don't restart.

Audience: a single school community of roughly **80–200 users** (students, teachers, parents, admins), **web only**. Small scale, so favor simple, reliable implementations over heavy infrastructure.

Tone: **fun and playful, family-friendly**. It is a school platform with minors — safety beats features when they conflict.

Product identity (keep these front of mind):
- The school's main **news output** (announcements/news flow from school/teacher/admin accounts).
- A friendly-but-not-informal way for **teachers and students to connect**.
- **"Made by the students, for the students."**

---

## Confirmed decisions (final)
1. **Privacy:** account privacy controls who sees your posts; there is **no per-post audience picker**. **Teacher and Admin accounts are always fully public** and post to everyone. **Student and Parent accounts default to private**, and the user can switch them between private and public.
2. **Pre-moderation scope:** every post and comment runs through an **automated word/image filter**; anything it flags is **held for admin/teacher review** before going public. Hand-approving every post is **off by default** (doesn't scale); a school-wide setting can turn full pre-approval on later.
3. **DM privacy vs moderation:** DMs are private and **only become visible to moderators when a message is reported.** Realtime delivery is included.
4. **Onboarding:** **one school-wide QR/access code** is purely an **entry gate** (proof the person belongs to the school) to reach the join page. After passing it, a person creates their account and joins **as a Student by default**; **admins assign Teacher/Parent/Admin roles afterward** and link parents to their child. (A single shared code can't safely encode roles, so roles are assigned by admins, never self-selected.)
5. **Heavy features phased:** **live streaming** and **realtime voice/typing** need extra services; see Phasing. Everything else is core.

---

## Roles & permissions

Roles: **Student, Teacher, Parent, Admin** (Admin is also a staff member). Everyone is **badged** by role (e.g., "Teacher", "Admin", "Class 6B"); no separate verification flow.

| Capability | Student | Parent | Teacher | Admin |
|---|---|---|---|---|
| Post, comment, react, message | Yes | View-focused (see below) | Yes | Yes |
| Posts boosted to top of feeds | No | No | **Yes** | Yes |
| Post school news/announcements, achievements, timetable, lost-and-found | No | No | **Yes** | Yes |
| Create clubs/classes & events | No | No | **Yes** | Yes |
| Review reported/flagged posts & comments | No | No | **Yes** | Yes |
| Full moderation (remove anything, disable accounts, see reports dashboard, broadcast) | No | No | No | **Yes** |
| Account visibility | Private by default, can change | Private by default, can change (also linked to child) | **Always public** | **Always public** |

**Parent accounts:** linked to one or more student accounts as a lightweight **connection**. A parent can see the child's profile and public posts and that the account is active. A parent **cannot** see DMs or private activity. No screen-time or parental control tools (owner declined).

**Teacher elevation:** teacher (and admin) posts surface at the top of feeds; teachers carry content authority (news, events, clubs, post review) but **not** full moderation, which is admin-only.

---

## Onboarding (one school-wide access code / QR)
- The school has **one shared access code**, shown as a **QR code**, distributed within the school community. It is purely an **authentication gate** proving the person belongs to the school.
- Scanning or entering the code opens `/join` → the person sets display name + email/username + password → account created **as a Student** by default.
- **Roles are assigned by admins afterward:** admins promote accounts to Teacher/Parent/Admin and link parent accounts to their child(ren). A single shared code can't safely carry a role, so self-selecting Teacher/Admin is not allowed.
- Admins can **rotate/disable** the school code from the admin panel. Keep the existing first-account-is-admin bootstrap for initial setup.
- Replaces open email signup (the school-account lockdown flagged earlier as the top pre-launch task).

---

## Profiles & identity
- Fields: name, photo, bio, **role badge, grade/class, pronouns, interests, links, joined date, clubs**.
- **Pinned posts**, **story highlights** (saved to profile), and a **profile "wall"** others can post to (wall posts are moderated like everything else).
- Light **profile themes** (a small set of color accents — playful, still on-brand navy/gold).
- Privacy: **students private by default**, can switch to public; **teachers and admins always public.**

---

## Content types & creation
Support **all** of: single photo, **multi-photo carousel**, **video reels** (exist); plus **long video**, **text-only posts**, **link posts**, **polls**, **Q&A**, **music/audio posts**, **document/file posts**, and **live streams** (phased).
- **Tagging:** people (@), locations, and topics/**hashtags**.
- **School content types** (Teacher/Admin only): **announcements/news, achievements/awards, timetable, lost-and-found.** These can be pinned and are boosted.
- **Creation tools:** **basic editing only** — crop and simple caption text. **No filters, no stickers, no extra effects.**
- **Collaborative posts:** a post can be **co-authored** (invite another student/club; appears on both profiles).

## AI helpers (needs an LLM API key; config + graceful off-switch)
Include **caption suggestions**, **EN↔TH translation** of captions/comments, and **Q&A/writing assist**. **Do NOT build alt-text generation** (owner declined). Gate behind an env key; if absent, hide the AI buttons.

---

## Feeds
- Tabs: **Following** (chronological), **For You** (ranked **blend of recency + engagement**), **My Class**, **Clubs**, **Announcements**.
- **Teacher/admin posts and announcements are pinned/boosted to the top** across feeds.
- No "healthy usage" controls (hide-like-counts, daily limits) — owner declined.

## Social graph
- **Both** models: **follow** (one-way) and **friends** (mutual request/accept).
- **Close friends** list, **friend groups**, and **class-based auto-connections** (students in the same class are grouped to power the "My Class" feed).
- **Blocking and muting** both included. Admins can view block relationships for safety review.

## Engagement
- **Multiple reactions** (e.g. ❤️ 😂 👍 🎉 👏) — keep them wholesome/family-friendly.
- **Comments:** threaded replies, comment likes, **pin a comment**, and **images/GIFs in comments** (GIFs via a provider key or a small built-in set; moderated).
- **Reposting/sharing:** to your feed, to a story, and to DMs. **No external/off-platform share.**
- **Saves** with **collections/folders**.
- **Mentions (@)** and **hashtags (#)**, each with their own page.

## Stories
- Keep 24h stories; add **highlights**, **story replies**, **reactions**, and **interactive stickers (poll / quiz / question)**, plus **close-friends-only** stories.
- **Teachers and clubs** can post stories (e.g., a daily class story).

## Messaging
- **1:1 and group chats**, group size up to **30** (fits a class).
- Features: images/video, **voice notes**, **reactions**, **replies**, **read receipts**, **typing indicators**. **No disappearing messages.**
- **Realtime/instant** delivery (upgrade from the current ~4s polling) — see Phasing for the realtime approach.
- **Anyone can DM anyone.** DMs are private; moderators see a message **only after it is reported.**

## Communities (clubs / classes / teams)
- Dedicated spaces with their **own feed, members, and admins**.
- **Request-to-join**; **created by teachers or admins** only.
- Group features: **announcements, files, events, pinned posts, member roles.**

## Events & calendar
- **Create events, RSVP, reminders, calendar view.** Created by **teachers or admins**.
- Events can be **tied to a club/class.**

## Discovery, search, directory
- **Search** across people, posts, hashtags, clubs, and events.
- **Explore/trending** (trending hashtags, popular posts) and **"people you may know"** (by class/club).
- A **directory** to find classmates and teachers.

## Notifications & presence
- Notify on likes, comments, follows, **mentions**, messages, **club posts, events, announcements**.
- **In-app only.** No push notifications, no email digests.
- **Online/last-seen status is hidden** (not shown to anyone).

---

## Safety & moderation (critical — minors)
- **Automated filters on all posts and comments** (profanity/banned-words list + basic image checks). Flagged content is **held for review** (see Decision #2).
- **Admins and teachers can review posts/comments**; the existing report queue expands to cover posts, comments, messages, wall posts, and stories.
- **DMs:** private; visible to moderators **only when reported.**
- **Blocking and restricting** users, plus a clear **"report to a trusted adult"** path (a prominent report/help action that routes to admins/teachers).
- **Admins** can remove any content and disable accounts (exists; extend to new content types).
- Not included (owner declined): parental controls, screen-time limits, younger-student default lockdowns.

## Privacy & permissions
- **Student and Parent accounts default to private; the user can switch them public. Teacher and Admin accounts are always public.**
- No per-post audience picker (Decision #1).
- **Anyone can comment / anyone can DM** at the user level (no per-user restriction toggles in v2).

## Localization & accessibility
- **Full bilingual UI in Thai and English** (interface text, not just user content) with an easy language switch. Use a clean Thai-capable font (already using Noto Sans Thai).
- **Accessibility:** good color contrast, keyboard navigation, semantic markup, large-text friendliness, screen-reader labels. (No AI alt-text, but allow manual alt-text fields where simple.)

## Admin & insights
- **Dashboard** with usage stats, the **report/review queue**, **content search**, and **broadcast announcements to everyone**.
- **Bulk tools:** disable multiple accounts, post a school-wide announcement, manage clubs/classes, manage invite/QR codes.

## Explicit non-goals (do not build)
- No monetization of any kind.
- No gamification (points/badges-for-activity/streaks/leaderboards) and no house/class competition.
- No parental controls or screen-time limits.
- No disappearing messages.
- No push notifications or email.
- No public/external sharing or search-engine visibility.
- **Web only** (no native app; a polished responsive web app / optional PWA is fine).

---

## Scale & technical notes
- **80–200 users**, possibly the whole school online at once during events. Small enough that simple solutions are fine; index the database and paginate feeds (already done) and you're well within headroom.
- **Realtime messaging:** at this scale, use a lightweight realtime layer (e.g., server-sent events or a hosted realtime service like Pusher/Ably/Supabase Realtime) for instant messages, typing, and read receipts. Polling can remain the fallback.
- **Live streaming** and **long/большой video**: need a video/streaming host (Mux or Cloudflare Stream). Treat live streaming as the last phase.
- **AI features:** require an LLM API key (Anthropic). Make them optional via env.
- **Media at scale/online:** move uploads to a cloud store and DB to Postgres per `DEPLOY.md` before launch.

## Suggested build order for Claude Code
1. **Onboarding rework:** roles (Parent, Teacher refinements), badges, QR/invite-code join, parent-child linking. (Unblocks the safety story.)
2. **Moderation pipeline:** automated filters + review-hold + expanded report queue across content types.
3. **Profiles & content types:** profile fields/themes/pinned/highlights/wall; text/link/poll/Q&A/audio/document posts; tagging + hashtags + mentions pages; collaborative posts.
4. **Feeds & graph:** multi-tab feeds + ranking blend + boosted teacher/announcement posts; friends + close friends + class grouping; blocking/muting.
5. **Engagement:** multiple reactions; threaded comments + pins + GIFs; reposts; save collections.
6. **Communities & events:** clubs/classes/teams; events + calendar + RSVP.
7. **Messaging upgrade:** group chats, voice notes, reactions/replies/read-receipts/typing, realtime.
8. **Discovery & admin:** search-all, explore/trending, directory, people-you-may-know; admin dashboard + bulk tools + broadcast.
9. **Localization & accessibility pass:** full TH/EN UI + a11y.
10. **AI helpers**, then **stories upgrades**, then **live streaming** (last, needs infra).

Each step should keep the app running, follow the conventions in `CLAUDE.md` (auth via `getSessionUser`, media via `lib/posts`, uploads via `lib/upload`, server-side authorization), and after schema changes run `npx prisma migrate dev`.
