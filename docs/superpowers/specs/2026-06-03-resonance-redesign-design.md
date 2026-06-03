# Resonance — Product Redesign Spec
**Date:** 2026-06-03
**Status:** Draft v2 (post-review)
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
- Each candidate shown as a profile card: selfie, fit score (0–100), 3 highlight reasons
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

A user can have **unlimited active matches** across both streams. Users manage their own pipeline.

---

### 3.4 Paid Action — AI Approach

- User selects a candidate → taps "让AI联系TA"
- **Payment:** ¥19–29 per approach (exact price TBD). **MVP: stubbed payment always succeeds in non-test mode.** If payment fails (or stub returns failure in testing): no Approach record is created, user sees error toast and returns to pool view.
- AI drafts a personalized intro message (≤150 chars) referencing specific profile overlaps. Message shown to initiator for **1-tap confirmation before sending** — not auto-sent.
- Message sent to candidate on initiator's behalf after confirmation
- Candidate notified (in-app + Web Push if browser permission granted): "有人对你感兴趣" + initiator's profile card
- Candidate can accept or decline (always free)
- **Approach expiry: 72 hours.** If no response after 72h, status → `expired`. Initiator notified; no extra charge; can approach someone else.
- If declined: initiator notified, no charge, can approach another candidate
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

#### Round 3: 见见我的人 (Meet My People, open-ended)

- Optional, but encouraged after Round 2
- Friends or family of either/both parties join **in person**. No guest login, no guest-facing UI in Phase 1. App serves questions on the host's phone only.
- App serves Aron Questions 25–36
- This round is a trust signal, not a gate — declining Round 3 does not block the offer stage

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
- **Trigger:** user opens pool view (or daily midnight refresh)
- **Input:** requesting user's profile + requirements; all visible users (visibility = active)
- **Output:** top 20 ranked candidates with fit score (0–100) + 3 highlight strings each
- **Logic:** Claude API scores (requirements, profile) pairs; structured tag overlap; optional Bazi/MBTI boost (max 20% combined). Results cached per user, 6h TTL, invalidated on profile update.
- **Exclusions:** already approached, declined, closed, deleted, self

### 5.2 Approach Writer
- **Trigger:** user pays and confirms approach
- **Input:** initiator profile + candidate profile
- **Output:** personalized intro message ≤150 chars shown to initiator for 1-tap confirmation
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
- **Trigger:** Round 2 unlocked (both advance from Round 1)
- **Input:** both users' cities, personality tags, life goals
- **Output:** 2–3 venue/activity suggestions with brief rationale (e.g., "咖啡馆 — 安静，适合深聊")
- **Delivery:** shown in Pipeline view when Round 2 unlocked; not blocking (users can ignore)
- **Implementation:** Claude API prompt with user profile context; results cached per match, not refreshed

---

## 6. Arthur Aron's 36 Questions — Distribution

| Group | Questions | Round | Theme |
|---|---|---|---|
| Group 1 | Q1–Q12 | Round 1 (初见) | Initial familiarity — safe, curious |
| Group 2 | Q13–Q24 | Round 2 (深聊) | Values and emotional depth |
| Group 3 | Q25–Q36 | Round 3 (见见我的人) | Vulnerability and connection |

Questions stored in `backend/core/aron_questions.py` as a list of dicts: `{id, group, zh, en}`. Chinese shown by default.

---

## 7. Monetization

| Action | Who pays | Cost |
|---|---|---|
| Build profile, browse pool | Nobody | Free |
| Receive an approach | Nobody (receiver) | Free |
| Participate in rounds (as receiver) | Nobody | Free |
| AI approaches a candidate | Initiator | ¥19–29/approach |
| Send "我想认真了" offer | Nobody | Free |
| All AI features (recap, venue suggestion) for rounds entered as receiver | Nobody | Free |

**Payment failure:** No Approach record created. User returns to pool view with error toast.

**Phase 1 (MVP):** payment stubbed. Feishu scheduling and all AI features work; payment flow placeholder always succeeds. Used to validate the product loop before WeChat Pay.

**Phase 2:** WeChat Pay. Subscription option (¥99/month, unlimited approaches) evaluated after conversion data.

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

## 9. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + TypeScript + Vite + TailwindCSS | H5, mobile-first. Zero business logic in frontend. |
| Backend | FastAPI / Python 3.12 | Exists. Keep skeleton, rewrite routers and models. |
| Database | PostgreSQL + Redis | Postgres: relational data. Redis: live session state. |
| AI | Claude API (claude-sonnet-4-6) | Pool curator, approach writer, venue suggester, recap. |
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
  ProfileCard/       Selfie + fit score + 3 highlights
  QuestionCard/      One Aron question, skip button
  Timer/             Session countdown, gentle style
  PipelineItem/      Match card with round badge + last activity
  AvailabilityPicker/ 3-slot time selector for Feishu scheduling
  OfferButton/       "我想认真了" CTA with confirmation modal
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

## 13. Out of Scope (Phase 1)

- AI digital companion / 数字人 (Phase 2)
- WeChat mini-program (Phase 2)
- WeChat Pay integration (Phase 2)
- Guest/family accounts for Round 3 — guests participate in-person only; no guest login, no guest UI
- Photo gallery beyond single selfie
- In-app video or voice messages
- SMS notifications (Phase 2, fallback for Web Push denials)
- Venue booking or integration with maps/restaurant APIs
- Subscription pricing model (evaluate after per-approach data)
