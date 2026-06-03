# Resonance — Product Redesign Spec
**Date:** 2026-06-03
**Status:** Draft v3 (post-technical + PM review)
**Product:** Resonance (共振) — Structured Dating Platform

---

## 1. Product Philosophy

Resonance is a structured dating platform built around one insight: **meaningful relationships require a process, not an algorithm.**

The core mechanic is Arthur Aron's 36 Progressive Questions — a psychology-backed conversation framework that builds genuine intimacy through progressive self-disclosure. The app acts as an **AI agent** (like a headhunter), not a passive swipe interface.

**Internal mental model (not shown to users):**

| Job Search | Resonance |
|---|---|
| Polish your CV | Build your dating profile |
| State job requirements | Describe what you want in a partner |
| Headhunter finds candidates | AI agent curates your match pool |
| Round 1: Online interview | 初见 — Feishu call (optional) |
| Round 2: Onsite interview | 深聊 — In-person date |
| Round 3: Culture fit / references | 见见我的人 — Friends & family |
| Send offer → accept/decline | 我想认真了 → 在一起 |

**External language (what users see):** romantic, warm, never clinical.

**Core principle:** the fee creates intentionality. Swiping is cheap. Paying to approach is a genuine signal of interest.

---

## 2. Who Uses This

**Primary user:** Chinese urban singles, 23–35, who have tried mainstream apps (Soul, Tantan, 珍爱网) and found them either too casual or too transactional.

**Key insight:** these users want structure, not more choice. They are overwhelmed by low-signal matches and want a process that respects their time.

**Platform:** H5 Web App (React, mobile-first). Architecture must be portable to WeChat mini-program in Phase 2.

---

## 3. User Flow

### 3.1 Onboarding — Build Your Profile

1. Phone OTP registration (no email dependency)
2. Selfie upload. **MVP: liveness check is a passthrough (always passes). Phase 2: integrate 腾讯云人脸核身 or equivalent.**
3. Profile facts: age, city, gender, education, work, life goals, personality tags
4. Optional enrichment: Bazi (八字, requires birth date + time), MBTI, zodiac (auto-computed from birthday). Clearly labeled "optional." Never required for matching.
5. Requirements: what you want in a partner (deal-breakers + preferences, free text + structured tags)
6. Visibility setting: `active` (appear in pool) or `passive` (hidden from pool). **Default: `active`.**

---

### 3.2 Free Tier — Browse the Pool

- AI curates a ranked candidate pool of **top 20 candidates** based on the user's requirements. Pool refreshes **daily at midnight CST** or immediately when the user updates their requirements.
- Each candidate shown as a profile card: **pixel avatar** (not real selfie — see Section 9), fit score shown as pixel progress bar (0–100), 3 highlight reasons
- Real selfie is only revealed after Round 1 completes (both parties)
- User can bookmark candidates, no commitment
- Excluded from pool: already approached, declined, previously closed matches, self

**Pool curation logic:**
- **Semantic similarity:** Claude API scores each (requirements, profile) pair with a structured prompt returning a float 0–1. Results cached per user with a **6-hour TTL**, invalidated on profile update.
- Structured tag overlap (city, life goals, dealbreakers)
- Optional boost: Bazi compatibility score if both have Bazi data; MBTI compatibility if both have MBTI. Bazi/MBTI combined max 20% of total score.

---

### 3.3 Two-Stream Pipeline

Every user simultaneously operates in two streams:

```
PURSUING (you initiate)
  Browse pool → select candidate → pay → AI approaches them
  They accept → Round 1 begins

BEING FOUND (others initiate)
  Appear in others' pools automatically (if visibility = active)
  Someone pays to approach you → you are notified
  Accept or decline — always free
```

Both streams managed in a single **Pipeline** view. Once a Round begins, initiator/receiver distinction disappears — both parties are equal.

**Active conversation limits (core product design, not a technical constraint):**

| Tier | Max active matches (across all rounds) |
|---|---|
| Free | 1 at a time |
| Plus (¥98–128/month) | 2–3 at a time |

This limit is non-negotiable. Arthur Aron's mechanism requires dyadic focus — a user simultaneously in Round 2 with three people produces rehearsed answers, not genuine vulnerability. The mechanism fails. Scarcity is the product's value: "I'm focused on you right now."

If a user's active match slot is full and a new approach is accepted by the other party, the new match enters **待激活 (pending)** state — the user must close or complete an existing match first to activate it.

---

### 3.4 Paid Action — AI Approach

- User selects a candidate → taps "让AI联系TA"
- **Rate limits:** max **3 approaches per week** regardless of payment tier. **48-hour cooldown** after each approach sent. These limits enforce thoughtful targeting — not a subscription bypass.
- **Tiered pricing (signals intent level):**
  - ¥19 — Standard: AI-generated opener based on profile overlap
  - ¥39 — Personalized: more tailored opener + user adds a short note
  - ¥69 — Premium: AI optimises timing + message, read receipt, response-likelihood score shown to initiator
- **MVP:** stubbed payment always succeeds. If payment fails (or stub returns failure in testing): no Approach record created, user sees error toast, returns to pool view.
- AI drafts message, shown to initiator for **1-tap confirmation** — not auto-sent.
- Message sent to candidate on initiator's behalf
- Candidate notified (in-app + Web Push): "有人对你感兴趣" + initiator's profile card
- Candidate can accept or decline (always free)
- **Approach expiry: 72 hours.** No response → `expired`, initiator notified, no extra charge.
- **Quality feedback:** recipient can rate approach quality (👍/👎). Three low-rated approaches within 30 days → initiator throttled (max 1/week for 2 weeks).
- **Partial refund on fast decline:** if recipient declines within 24h → initiator receives ¥5–10 credit (encourages precise targeting, not spray-and-pray).
- If accepted: Match created, Round 1 unlocked

**Simultaneous mutual decline:** If both parties decline each other at the same moment, both receive: "你们互相决定不继续了，祝你们都找到合适的人。" No drama, no blame.

**Account deletion:** If a user deletes their account, all their active Approaches with `pending` status are auto-declined, and all active Matches are closed with a graceful notification to the other party: "对方已注销账号，这段缘分暂时止步于此。"

---

### 3.5 Round Structure

**Round advancement rule:** `Match.current_round` increments when `Session.advance_a` and `Session.advance_b` are both `true`. This is checked server-side when the second user submits their post-session rating. If only one advances, the match is closed gracefully.

**Offer and round progression are independent.** An offer can be sent at any round after Round 1. Active round progression continues while an offer is pending — rounds are not paused.

---

#### Round 1: 初见 (First Meeting, 45 min)

**Option A — Feishu video call (optional, user-initiated):**
- App shows 3-slot availability picker for each user
- AI finds first overlapping slot
- `MeetingService.create_room()` calls Feishu Calendar API + VC API:
  - Creates Feishu meeting with **guest link** (no Feishu account required to join). Confirmed: Feishu 飞书视频会议 supports joining via browser link without a Feishu account.
  - Sends meeting link to both users via app notification. Calendar invite sent additionally if user has connected their Feishu account (optional).
- 24h reminder: in-app notification + Web Push
- **Fallback (no slot overlap in 5 days):** app prompts both users to submit 3 new availability slots. If still no overlap after second attempt, users choose to proceed with in-person only.
- **Feishu API failure:** if `MeetingService.create_room()` throws, Match stays `active`, frontend shows retry button with error toast: "视频房间创建失败，请重试或选择线下见面。" Error logged server-side.

**Option B — In-person meeting:**
- Users meet offline. App is the conversation guide on both phones.
- **Sync model:** one user's phone acts as "host" (the initiator's phone by default). Host advances questions; the other user's phone polls for state updates every 3 seconds via REST. This avoids WebSocket complexity for MVP. Redis stores `{match_id: {current_question, questions_completed}}`.
- **Reconnect behavior:** on reconnect or app resume, phone fetches current question index from Redis. If host advanced while phone was offline, the fetched state reflects the current question. No data is lost.

**Both options:**
- App serves Aron Questions 1–12 progressively
- Timer visible (45 min), no alarm — gentle countdown only
- Either party can skip any question; skipped questions tracked server-side but not revealed to other party
- After session: each rates privately (1–5 stars + "advance?" yes/no)
  - Both advance → Round 2 unlocked
  - Either declines → match closed gracefully: "你们都在认真地找，祝好。"
  - Mutual decline: single notification as above

---

#### Round 2: 深聊 (Deep Conversation, 90 min)

- In-person date
- AI suggests venue + activity (see Section 5.6)
- App serves Aron Questions 13–24 (same sync model as Round 1)
- Post-session: AI recap generated and delivered at **9:00 AM CST the following morning** (push notification). If recap generation fails or is delayed, delivery retries at the next available time with no user-facing error.

---

#### Round 3: 见见我的圈子 (Meet My Circle, open-ended)

- Optional, but encouraged after Round 2
- "圈子" = close friends or family — more inclusive than "家人" only. User decides who, user decides when. **AI never prompts this round** — no "你们聊了3周，要不要见家人？" (creates pressure and awkwardness).
- Friends or family join **in person**. No guest login, no guest-facing UI in Phase 1. App serves questions on the host's phone only.
- App serves Aron Questions 25–36 (localized Chinese version — see Section 6)
- This round is a trust signal, not a gate — declining it does not block the offer stage

---

### 3.6 Offer Stage — 在一起

- Either party (at any point after Round 1 completes) can tap "我想认真了"
- Other party sees offer + sender's round progress
- Response options: **接受** / **再想想** / **婉拒**
  - **接受:** relationship confirmed. All other active matches for both users receive graceful close notification: "TA已开始一段新的旅程，感谢你们的相遇。"
    App generates a **Relationship Card**: date confirmed, rounds completed, Aron questions reached (e.g., "你们一起走过了Q1–Q24"). No "key moments" field — session data does not store spoken answers.
  - **再想想:** can request one more round before deciding. Offer remains `pending` while the round proceeds.
  - **婉拒:** both move on; app suggests next candidates from pool.

**Simultaneous offer race condition:** If both parties send an offer simultaneously, the match is auto-confirmed (treat as mutual acceptance). Only one Offer record is created (first writer wins via DB transaction); the second insert is rejected with a conflict, and the backend treats it as an acceptance from that party. Both users see the confirmation screen.

**Sending an offer is always free** — no payment gate at this stage.

---

## 4. Data Model

### User
```
id                    UUID, PK
phone                 string, unique
selfie_url            string
age                   int
city                  string
gender                enum: M | F | other
education             string
work                  string
life_goals            string (free text)
personality_tags      string[]
requirements          { dealbreakers: string[], preferences: string[] }
enrichment            { bazi?: BaziData, mbti?: string, zodiac?: string }
visibility            enum: active | passive   (default: active)
deleted_at            timestamp (nullable; soft delete)
created_at            timestamp
```

### Approach
```
id                    UUID, PK
initiator_id          FK → User
receiver_id           FK → User
status                enum: pending | accepted | declined | expired
ai_message            string (≤150 chars)
payment_id            string (nullable in MVP)
expires_at            timestamp (created_at + 72h)
created_at            timestamp
responded_at          timestamp (nullable)
```

### Match
```
id                    UUID, PK
user_a_id             FK → User
user_b_id             FK → User
approach_id           FK → Approach
current_round         int: 1 | 2 | 3
status                enum: active | offer_pending | confirmed | closed
created_at            timestamp
```

**Round advancement:** `current_round` increments server-side when `Session.advance_a = true AND Session.advance_b = true`. Triggered when the second user submits their rating (whichever user submits last).

### Session
```
id                    UUID, PK
match_id              FK → Match
round_number          int: 1 | 2 | 3
type                  enum: feishu_call | in_person
host_user_id          FK → User  (question advancement host; defaults to approach initiator)
scheduled_at          timestamp
completed_at          timestamp (nullable)
feishu_meeting_url    string (nullable)
questions_completed   int[]  (e.g. [1,2,3,5,7]; shared state stored in Redis during session, persisted here on completion)
rating_a              int 1–5 (nullable, private)
rating_b              int 1–5 (nullable, private)
advance_a             bool (nullable, private)
advance_b             bool (nullable, private)
ai_recap              string (nullable, generated post-session)
```

### Offer
```
id                    UUID, PK
match_id              FK → Match
sender_id             FK → User
status                enum: pending | accepted | not_yet | declined
                      -- not_yet: durable status meaning "one more round requested";
                      -- offer remains active while that round proceeds
sent_at               timestamp
responded_at          timestamp (nullable)
UNIQUE constraint:    (match_id) — only one active offer per match at a time
```

---

## 5. AI Agent — Six Components

Each component has one job and is independently callable.

### 5.1 Pool Curator
- **Trigger:** background ARQ worker (not inline). Triggered by: (a) daily midnight CST batch; (b) user profile/requirements update; (c) user's pool TTL expires (6h). Results are pre-computed and served instantly on pool view open.
- **Input:** requesting user's profile + requirements; all visible users (visibility = active)
- **Output:** top 20 ranked candidates with fit score (0–100) + 3 highlight strings each, stored in PostgreSQL `user_candidates` table
- **Model: claude-haiku-4-5** — high-volume, structured output, cost ≈10x cheaper than Sonnet. Scoring accuracy is sufficient; this is a ranking task, not a writing task.
- **Logic:** Claude API scores (requirements, profile) pairs with a structured prompt returning float 0–1; structured tag overlap; optional Bazi/MBTI boost (max 20% combined). Results cached per user, 6h TTL, invalidated on profile update.
- **Exclusions:** already approached, declined, closed, deleted, self
- **Concurrency guard:** Redis semaphore limits simultaneous pool compute jobs to 10 (prevents Claude API quota exhaustion during peak hours)

### 5.2 Approach Writer
- **Trigger:** user pays and confirms approach (inline — user is waiting)
- **Model: claude-sonnet-4-6** — quality matters here; this is the first impression
- **Input:** initiator profile + candidate profile + tier (standard/personalized/premium)
- **Output:** personalized intro message ≤150 chars shown to initiator for 1-tap confirmation
- **Timeout:** 15s hard timeout. If exceeded → return a fallback template with "try again" option; no charge if fallback triggered.
- **Constraint:** must reference at least one specific profile detail from candidate; Claude instructed to self-moderate; never generic
- **Example:** "你好，我看到你喜欢爬山，我上个月刚去了梅里雪山。我们对生活节奏的想法很像，想认识你。"

### 5.3 Feishu Scheduler (`MeetingService` interface)
- **Trigger:** Round 1 begins + user opts for video call
- **Interface:** `create_room(slot, user_a_id, user_b_id) → MeetingResult{url, calendar_event_id?}`
- **Implementation (Phase 1):** Feishu Open Platform, 飞书视频会议, guest browser link (no Feishu account required)
- **Implementation (Phase 2):** WeChat Work VC — same interface, different credentials
- **Error handling:** if `create_room()` throws → Match stays `active`, frontend shows retry; no match state change
- **Fallback (no slot overlap after two attempts):** prompt to proceed in-person only

### 5.4 Session Guide
- **Trigger:** session start time (or user manually taps "开始")
- **Runtime:** active on both phones; host phone advances, non-host polls REST every 3s
- **State store:** Redis key `session:{session_id}` → `{current_q_index, questions_completed[], started_at}`
- **Reconnect:** on app resume, fetch current state from Redis; session continues from current question
- **Behavior:**
  - One question at a time; host taps "下一题" to advance (non-host sees update within ~3s)
  - Skip always available; skipped questions excluded from `questions_completed`
  - Timer: 45 min Round 1 / 90 min Round 2 / none Round 3
  - Timer expiry: gentle prompt only — "时间到了，今天聊到这里？" — user must confirm end
  - Session ends when both tap "结束今天" or host force-ends after timer prompt

### 5.5 Post-Session Recap Generator
- **Trigger:** session marked complete
- **Scheduled delivery:** 9:00 AM CST next morning via push notification. Retry silently if generation fails; no user-facing error on delay.
- **Input:** `questions_completed` indices + question text (from `aron_questions.py`)
- **Output:** private warm summary per user (~100 words); not shared with match
- **Content:** questions reached, thematic observations from question text, suggested angle for next session
- **Note:** recap is generated from question text only — no spoken answers are recorded or stored

### 5.6 Venue Suggester
- **Trigger:** Round 2 unlocked — fired as ARQ background job (fire-and-forget)
- **Model: claude-haiku-4-5** — simple suggestion task, no nuance required
- **Input:** both users' cities, personality tags, life goals
- **Output:** 2–3 venue/activity suggestions with brief rationale (e.g., "咖啡馆 — 安静，适合深聊")
- **Delivery:** appears in Pipeline match detail view when ready; shows "正在准备建议..." if not yet generated. Users can ignore entirely.
- **Caching:** stored in `Match.venue_suggestions`, never regenerated

---

## 6. Arthur Aron's 36 Questions — Distribution & Localization

| Group | Questions | Round | Theme |
|---|---|---|---|
| Group 1 | Q1–Q12 | Round 1 (初见) | Initial familiarity — safe, curious |
| Group 2 | Q13–Q24 | Round 2 (深聊) | Values and emotional depth |
| Group 3 | Q25–Q36 | Round 3 (见见我的圈子) | Vulnerability and connection |

Questions stored in `backend/core/aron_questions.py` as a list of dicts: `{id, group, zh, en, localized_zh}`. Chinese shown by default.

**Localization requirement (mandatory before launch):**

The original 36 questions were designed for Western, individualist cultural contexts. A localization audit must be conducted before launch:

- Questions that reference death, worst memories, or highly morbid themes (e.g., original Q26: "Complete this sentence: I wish I had someone with whom I could share..."; Q28 about your mother's relationships) need review for cultural resonance and 吉利 (auspiciousness) considerations.
- Replace or adapt questions that feel awkward in Chinese relationship norms around indirect communication.
- Add up to 6 China-specific supplementary questions covering: family expectations, career-life balance trade-offs, relationship with money, attitudes toward housing/marriage timing — topics that are the actual source of most Chinese relationship friction.
- Total question count may expand to 36–42; distribute evenly across the three rounds.
- Both `zh` (direct translation) and `localized_zh` (culturally adapted) stored; product uses `localized_zh` by default.

---

## 7. Monetization

| Action | Who pays | Cost |
|---|---|---|
| Build profile, browse pool | Nobody | Free |
| Receive an approach | Nobody (receiver) | Free |
| Participate in all rounds (as receiver) | Nobody | Free |
| AI approach — Standard | Initiator | ¥19/approach |
| AI approach — Personalized | Initiator | ¥39/approach |
| AI approach — Premium | Initiator | ¥69/approach |
| Partial refund on fast decline (< 24h) | Platform refunds initiator | ¥5–10 credit |
| Send "我想认真了" offer | Nobody | Free |
| Relationship confirmed ("在一起") — **Success Fee** | Both parties | ¥99–199 (split or one party) |
| Resonance Plus subscription | Subscriber | ¥98–128/month |
| All AI features for rounds entered as receiver | Nobody | Free |

**Success Fee rationale:** ¥99–199 charged when both users confirm "在一起" status. This is the product's most important monetisation lever — it directly aligns platform revenue with user outcome. Psychologically acceptable: users are happy to pay when the product worked. Exact split (one party pays, or both pay ¥59–99 each) to be A/B tested.

**Resonance Plus (¥98–128/month) includes:**
- Up to 3 active matches simultaneously (vs. 1 for free)
- 5 approach credits/month (vs. paying per approach)
- AI deeper profile analysis report
- Priority placement in others' curated pools

**Payment failure:** No Approach record created. User returns to pool view with error toast.

**Phase 1 (MVP):** payment stubbed. All AI features and Feishu scheduling work; payment is a placeholder that always succeeds. Goal: validate the full product loop before payment integration.

**Phase 2:** WeChat Pay integration for approaches, Plus subscription, and success fee.

---

## 8. Notifications

**MVP notification strategy:**
- **In-app:** all notifications visible when app is open (always implemented)
- **Web Push (browser permission):** requested after onboarding for these critical events only:
  - Incoming approach ("有人对你感兴趣")
  - Approach accepted/declined
  - Round 2 / Round 3 unlocked
  - Session reminder (24h before scheduled Feishu call)
  - Offer received ("TA想认真了")
  - Morning recap ready (9:00 AM CST)
- **Feishu bot message:** Feishu meeting link sent via Feishu bot in addition to in-app notification (only for users who initiated the Feishu scheduling flow)
- **SMS (Phase 2):** for users who deny Web Push permission

If a user denies Web Push permission, all notifications degrade gracefully to in-app only. No functionality is blocked.

---

## 9. Design Language — Pixel Aesthetic

### Core Philosophy

Resonance's visual identity is **pixel art** — deliberately chosen, not a compromise. The aesthetic communicates three things simultaneously:

```
马赛克的浪漫   Mosaic romance — mystery, intrigue, the face not yet fully seen
理工的严谨     Engineering rigor — this was built seriously, not as a commercial trap
信任感         Trust — anti-glamour design signals honesty over seduction
```

This is the opposite of typical dating apps (glossy photos, pink gradients, confetti animations). Resonance looks like something a thoughtful engineer built for people who are tired of being manipulated.

Reference aesthetic: Claude's interface — functional, pixel mascot, clean grid, no unnecessary decoration.

---

### Pixel Avatar System

**The selfie is for verification only — it is never shown in the pool.**

Instead, each user has a **pixel avatar** — an 8-bit style portrait generated from their profile data (gender, personality tags, a few visual preference inputs). The pixel avatar is:

- Shown in the candidate pool, pipeline view, and session screens
- Unique and recognizable but not photorealistic
- Customizable in limited ways (hair, expression, accessories — all pixel-style)

**Progressive photo reveal:**

```
Pool view          → Pixel avatar only (no real face)
Approach accepted  → Still pixel avatar + name
Round 1 complete   → Real selfie unlocked for both parties
                     (they've now talked for 45 min — appearance is context, not gate)
```

This design:
- Eliminates appearance-based filtering before any conversation happens
- Creates genuine curiosity and intrigue ("I want to see who's behind this pixel")
- Matches the psychological mechanism of Aron's questions — you connect before you judge
- Differentiates radically from every photo-first dating app

Real selfie is stored securely (COS) but served only after Round 1 completion via a time-limited presigned URL.

---

### Visual Design System

**Typography:** Monospace or pixel-adjacent font (e.g., IBM Plex Mono, Courier New, or a custom pixel bitmap font for headings). Body text readable at small sizes.

**Color palette:**
```
Background:    Near-black or deep navy (#0D0D1A or #1A1A2E)
Primary text:  Off-white (#F0EDE8)
Accent:        Single warm color — dusty rose or amber (#C4956A or #E8A87C)
               Used sparingly: CTAs, progress indicators, active states
Grid lines:    Low-opacity white (#FFFFFF18) — pixel grid overlay on backgrounds
```

**UI components:**
- Pixel-bordered cards (1-2px solid borders, no border-radius or very minimal)
- Fit score shown as a pixel progress bar, not a circular gauge
- Aron question cards: large, centered, monospace font — like a terminal prompt
- Timer: digital clock style (7-segment pixel display aesthetic)
- Buttons: pixel-style, slight "press" animation (translate 1px down on click)

**Pixel grid overlay:** Subtle dot-grid or line-grid background on all screens — evokes graph paper, engineering notation, and the "mosaic" texture.

**Animations:** Minimal. When they occur: pixel-by-pixel reveal (avatar building up from blocks), typewriter text for AI-generated content (approach message, recap), dithered fade transitions between screens. No bounce, no confetti, no particle effects.

**Mobile-first layout:** 375px baseline. Single column. Navigation: bottom tab bar (pixel icon style). No floating elements except the "见见我的圈子" round badge.

---

### What This Design Avoids

```
✗  Stock photo illustrations of happy couples
✗  Pink / purple gradient backgrounds
✗  Rounded "bubble" UI components
✗  Confetti, heart rain, match animations
✗  Glossy, high-contrast "tech startup" aesthetic
✗  Any visual language that feels like a swipe app
```

---

## 10. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + TypeScript + Vite + TailwindCSS | H5, mobile-first. Zero business logic in frontend. |
| Backend | FastAPI / Python 3.12 | Exists. Keep skeleton, rewrite routers and models. |
| Database | PostgreSQL + Redis | Postgres: relational data. Redis: live session state. |
| AI | Claude API — two models | Sonnet 4.6: approach writer, recap generator (quality-sensitive). Haiku 4.5: pool curator, venue suggester (high-volume, ~10x cheaper). |
| Task queue | ARQ (async Redis queue) | Background AI jobs: pool scoring, venue suggestion, recap. Integrates natively with FastAPI + existing Redis. |
| Meeting | Feishu Open Platform | `MeetingService` interface; swap to WeChat Work in Phase 2. |
| File storage | 腾讯云 COS (S3-compatible) | Selfie uploads. |
| Auth | Phone OTP + JWT | No email. Standard in China. |
| Payment | Stubbed in MVP; WeChat Pay in Phase 2 | Clean payment service interface; swap without touching product logic. |
| Push | Web Push API (service worker) | HTTPS required. Degrades gracefully if denied. |
| Deployment | Railway (dev/staging) → 腾讯云 (production) | Railway for fast iteration; 腾讯云 required for China production. |

---

## 10. Frontend Page Structure

```
pages/
  Onboarding/        Profile wizard: selfie → facts → enrichment (optional) → requirements
  Pool/              Browse top 20 candidates: fit score, highlights, approach button
  Pipeline/          Two-stream view: pursuing (initiated) + being found (incoming)
  Session/           Live question guide: Aron questions + timer + skip
  Recap/             Morning AI summary (read-only, push notification entry point)
  Profile/           View and edit your own profile + requirements

components/
  PixelAvatar/        Generated 8-bit portrait from profile data; no real photo shown pre-Round 1
  ProfileCard/        PixelAvatar + pixel-bar fit score + 3 highlights
  QuestionCard/       One Aron question, monospace font, centered, typewriter reveal on load
  Timer/              7-segment pixel display countdown
  PipelineItem/       Match card with round badge + pixel avatar + last activity
  AvailabilityPicker/ 3-slot time selector for Feishu scheduling
  OfferButton/        "我想认真了" CTA with pixel-style confirmation modal
  PixelGrid/          Reusable dot-grid background texture
```

All pages mobile-first (375px baseline). No desktop layout in Phase 1.

---

## 11. Codebase Migration Plan

### Keep
- `backend/main.py` — FastAPI app skeleton; update routers only
- `backend/core/bazi_engine/` — used for optional Bazi enrichment scoring in Pool Curator
- `venv/` — Python 3.12 environment

### Rewrite
- `backend/models/schemas.py` — replace with new data model (Section 4)
- `backend/api/profile.py` — new profile structure (onboarding fields)
- `backend/api/match.py` — old algorithm concept replaced entirely

### Add
- `backend/db/models.py` — SQLAlchemy ORM models
- `backend/db/migrations/` — Alembic migrations
- `backend/api/approaches.py`, `pool.py`, `sessions.py`, `offers.py`, `pipeline.py`
- `backend/services/pool_curator.py`, `approach_writer.py`, `feishu_scheduler.py`, `session_guide.py`, `recap_generator.py`, `venue_suggester.py`
- `backend/core/aron_questions.py`, `backend/core/meeting_service.py`
- `frontend/` — full React app (new)

---

## 12. WeChat Mini-Program Portability Checklist

- All business logic in FastAPI — frontend is a stateless render layer
- `MeetingService` interface abstracted — swap Feishu → WeChat Work VC
- Auth by phone OTP — identical in mini-program
- No browser-only APIs in business logic. Exception: Web Push is H5-only; mini-program uses WeChat native push — notification service must be abstracted behind a `NotificationService` interface in Phase 2.
- Payment stubbed cleanly — slot in WeChat Pay natively
- Redis session sync via REST polling (not WebSocket/SSE) — portable to any client

---

## 13. Concurrency & Scaling Architecture

### Session Sync: REST Polling → SSE Migration Path

**MVP:** REST polling every 3s. Host phone POSTs actions; non-host GETs state from Redis. Simple, stateless, Railway-friendly.

**V1.1 (post-MVP):** Migrate to SSE (Server-Sent Events). FastAPI `StreamingResponse` + Redis pub/sub per session channel. 4,000 idle SSE connections consume minimal CPU. Migration changes only the transport layer — business logic unchanged. Design Redis schema for pub/sub from Day 1 even if polling is used initially.

**WebSocket is not needed** — all session events are server-to-client. Bidirectional protocol overhead is unnecessary.

### AI Concurrency: Background Jobs Required

Pool curation **must not** be an inline AI call. At 500 simultaneous pool view opens, inline scoring = 500 concurrent Claude calls = quota exhaustion + visible latency spikes.

```
Correct pattern:
  Pool view open → serve cached scores from PostgreSQL instantly
  Background ARQ job (triggered by TTL or profile change) →
    Claude Haiku batch scoring → write to user_candidates table

Approach writing → inline OK (user waiting, low frequency)
  + 15s timeout + Redis semaphore (max 20 concurrent)

Venue suggestion → ARQ fire-and-forget after match confirmed

Nightly recap → APScheduler at 02:00 CST
  + asyncio.Semaphore(5) to cap concurrent Claude calls
  + Estimated: 30 recaps × 10s = 5 min, ~60k tokens, ~$0.18/night
```

### Database: Critical Indexes (Day 1)

```sql
-- Pool query hot path
CREATE INDEX idx_users_gender_visibility ON users (gender, visibility) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_city_age ON users (city, age);

-- Approach lookups (bidirectional)
CREATE INDEX idx_approaches_initiator ON approaches (initiator_id, created_at DESC);
CREATE INDEX idx_approaches_receiver ON approaches (receiver_id, status, created_at DESC);

-- Match lookups (always bidirectional)
CREATE INDEX idx_matches_user_a ON matches (user_a_id, status);
CREATE INDEX idx_matches_user_b ON matches (user_b_id, status);

-- Nightly recap batch
CREATE INDEX idx_sessions_completed ON sessions (completed_at) WHERE ai_recap IS NULL;
```

Pool "NOT IN already approached" pattern must use `NOT EXISTS` or a join, never `NOT IN (subquery)` — the latter causes full scans at scale.

### Connection Pooling (Mandatory)

```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
)
```

Without this, moderate load exhausts PostgreSQL's default 100-connection limit.

### OTP Provider

Use **腾讯云短信** or **阿里云短信** for phone OTP. Do not use Twilio — delivery rates to Chinese numbers are unreliable.

---

## 14. Go-to-Market Strategy (Phase 1)

**Cold-start sequence (bilateral network problem):**

1. **Female-first onboarding (first 3 months):** Women join by invitation or application only. Men get access when female:male ratio ≥ 1:2. Creates exclusivity and ensures women's experience is exceptional from day one.

2. **Pilot city:** Launch in one city first — **成都 or 杭州**. High young-professional density, strong romantic culture, lower competitive noise than Shanghai/Beijing. Prove unit economics locally before national expansion.

3. **小红书 content seeding:** Partner with relationship counselors, psychology influencers, dating coaches. Document real anonymized 36-question date experiences. This is where the target user discovers products.

4. **Referral flywheel:** A couple with a "we met on Resonance through 36 questions" story is uniquely shareable. Success stories are the primary organic CAC driver. Build referral rewards from launch.

---

## 15. Out of Scope (Phase 1)

- AI digital companion / 数字人 (Phase 2)
- WeChat mini-program (Phase 2)
- WeChat Pay integration (Phase 2) — Phase 1 uses stubbed payment
- Guest/family accounts for Round 3 — guests participate in-person only, no guest login, no guest UI
- Photo gallery beyond single selfie
- In-app video or voice messages
- SMS notifications (Phase 2, fallback for Web Push denials)
- Venue booking or integration with maps/restaurant APIs
- SSE transport for session sync (Phase 1 uses REST polling; SSE is V1.1)
- Success fee payment collection (Phase 1 tracks "在一起" confirmations; charges in Phase 2 with WeChat Pay)
- Plus subscription billing (design the feature access tier in Phase 1; billing in Phase 2)
