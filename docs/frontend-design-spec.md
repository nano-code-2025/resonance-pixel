# Resonance (共振) — Frontend Design Specification

> **Purpose**: This document describes every page, component, interaction, and visual detail of the Resonance dating app frontend. It is designed to be self-sufficient input for a frontend builder (v0.dev, Vercel, or any AI code generator).

---

## 1. Product Summary

Resonance is a structured dating app where an AI agent (not a swipe algorithm) curates matches and guides two people through Arthur Aron's 36 Progressive Questions. The metaphor is "headhunter, not Tinder" — the app arranges meetings, presents curated questions, and tracks relationship growth.

**Platform**: Mobile-first H5 web app (React + TypeScript + Tailwind)
**Baseline viewport**: 390px wide (iPhone 14). Single column only. No desktop layout.

---

## 2. Design Language — Pixel Aesthetic

### 2.1 Philosophy

The visual identity is **pixel art** — retro, honest, anti-glamour. This is the opposite of glossy dating apps. It signals:
- **Mystery**: Pixel avatars instead of real photos (until Round 1 completes)
- **Trust**: Engineering aesthetic, no manipulation tricks
- **Romance through restraint**: Less decoration = more focus on conversation

### 2.2 Color Palette

```
Background:         #0D0D1A  (near-black navy)
Card background:    #14142A  (slightly lighter)
Primary text:       #F0EDE8  (warm off-white)
Muted text:         #A09CA0  (gray)
Accent:             #C4956A  (warm amber/tan) — CTAs, active states, progress
Accent hover:       #D4A57A
Border:             #2A2A4A  (dark gray-purple)
Grid overlay:       rgba(255,255,255,0.05)  (subtle dot pattern)
Success:            #4CAF82  (green)
Warning:            #E8A87C  (warm orange)
Error:              #EF4444  (red-500)
Link:               #4A8A8A  (teal)
```

### 2.3 Typography

- **Font**: `IBM Plex Mono` — monospace, loaded from Google Fonts (400, 500, 600 weights)
- **All text is monospace** — headings, body, buttons, everything
- **Sizes**:
  - Page title: `text-base` (16px)
  - Section header: `text-sm` (14px)
  - Body: `text-xs` (12px)
  - Micro: `text-[10px]` (10px) — hints, timestamps
  - Tiny: `text-[9px]` (9px) — labels under avatars

### 2.4 UI Primitives

**pixel-grid**: Background with subtle dot-grid pattern (radial-gradient, 24px spacing). Used on all full-page backgrounds.

**pixel-border**: 1px solid #2A2A4A border. On hover: border turns accent (#C4956A). No border-radius (or 0px). Sharp edges everywhere.

**pixel-btn**: Accent background (#C4956A), dark text (#0D0D1A). On `:active`: translateY(1px) for press effect. Monospace text.

**Cards**: Dark card bg (#14142A), pixel-border. Internal padding: p-3 to p-6 depending on content density.

### 2.5 Animation Rules

- **Typewriter**: AI-generated text reveals character by character (40ms per char)
- **Transitions**: `transition-all duration-300` for opacity/translate changes between questions
- **Pulse**: `animate-pulse` for loading indicators and "waiting" states
- **NO**: bounce, confetti, particle effects, heart rain, slide-up sheets, spring physics

### 2.6 What This Design AVOIDS

- Stock photo illustrations of happy couples
- Pink/purple gradient backgrounds
- Rounded "bubble" UI components
- Confetti, heart rain, match animations
- Glossy "tech startup" aesthetic
- Anything that feels like a swipe app

---

## 3. Navigation Structure

**Bottom tab bar** (fixed, always visible except during Session):

```
┌────────────┬────────────┬────────────┐
│   发现     │    收到    │    管道    │
│   (Pool)   │  (Inbox)   │ (Pipeline) │
└────────────┴────────────┴────────────┘
```

- Active tab: accent text (#C4956A)
- Inactive tab: muted text (#A09CA0)
- Font: monospace, text-xs
- Background: #0D0D1A with top border (#2A2A4A)
- **Inbox badge**: Red circle (bg-red-500), white text, 9px font, positioned top-right of "收到" label. Shows count (max "9+")
- **Hidden during Session page** (immersive mode)

**App-level routing** (state-based, not URL-based):
```
No token  → Auth page
Token + incomplete profile → Onboarding page
Token + complete profile → Tab pages (Pool / Inbox / Pipeline)
Active session → Session page (full screen, no tabs)
```

---

## 4. Page Specifications

### 4.1 Auth Page — Login

**Route condition**: No token in localStorage

**Layout**: Full screen, pixel-grid background, vertically centered content

**Content**:
```
[top half: empty dark space with pixel-grid]

RESONANCE              ← text-[#C4956A], font-mono, text-lg, bold
找到同频的人            ← text-[#A09CA0], font-mono, text-xs

┌─────────────────────────┐
│ 手机号                  │  ← label, text-[#A09CA0], text-xs
│ [13800000000          ] │  ← input, bg transparent, border-bottom accent
│                         │
│ [    获取验证码        ] │  ← pixel-btn, full width
└─────────────────────────┘

[after OTP sent:]
┌─────────────────────────┐
│ 验证码                  │
│ [______              ]  │  ← 6-digit input
│                         │
│ [    验证登录          ] │  ← pixel-btn
└─────────────────────────┘
```

**Behavior**:
- Phone input: 11+ digits enables button
- Send OTP → POST `/api/auth/send-otp`
- Verify → POST `/api/auth/verify` → returns `{token, user_id, is_new}`
- If `is_new`: route to Onboarding
- Error: red text below input

---

### 4.2 Onboarding Page — Profile Wizard

**Route condition**: Token exists, profile.is_complete === false

**Layout**: Full screen, pixel-grid background

**Structure**: 4-step wizard with progress bar at top

**Progress bar**:
```
[████████░░░░░░░░░░░░░░░░]  步骤 2/4
```
4 segments, filled segments = accent (#C4956A), unfilled = #2A2A4A

**Step 1: 上传头像 (Upload Selfie)**
```
┌─────────────────────────┐
│                         │
│    [Click to upload]    │  ← Dashed border box, 120x120
│    or drag & drop       │
│                         │
│  可以之后再上传          │  ← text-[#2A2A4A], optional hint
│                         │
│ [跳过]        [下一步→] │
└─────────────────────────┘
```
- File input accepts image/*
- Preview shows after selection
- Upload via FormData POST to `/api/profile/selfie`
- Can skip (not required)

**Step 2: 基本信息 (Demographics)**
```
┌─────────────────────────┐
│ 年龄 *                  │  [number input]
│ 城市 *                  │  [text input]
│ 性别 *                  │  [男 / 女 / 其他] toggle buttons
│ 学历                    │  [text input]
│ 工作                    │  [text input]
│                         │
│ [←返回]       [下一步→] │
└─────────────────────────┘
```
- Required fields marked with *
- Gender: 3 toggle buttons, pixel-border, accent when selected
- Validation: age, city, gender required

**Step 3: 我的性格 (Personality)**
```
┌─────────────────────────┐
│ 人生目标                │
│ [textarea, 3 lines]     │
│                         │
│ 性格标签 (最多5个)      │
│ [温柔体贴] [理性冷静]   │  ← Toggle tags, pixel-border
│ [爱好运动] [文艺青年]   │     Selected: accent bg
│ [事业心强] [居家型]     │     Max 5
│ [幽默风趣] [独立自主]   │
│ [善于倾听] [热爱旅行]   │
│ [创意思维] [注重健康]   │
│                         │
│ [←返回]       [下一步→] │
└─────────────────────────┘
```

**Step 4: 期望对象 (Requirements)**
```
┌─────────────────────────┐
│ 期望性别 *              │  [男 / 女 / 不限] toggle
│ 年龄范围                │  [min] — [max]
│ 期望城市                │  [text input]
│ 其他要求                │
│ [textarea, 3 lines]     │
│                         │
│ [←返回]    [完成档案 ✓] │
└─────────────────────────┘
```
- On submit: PUT `/api/profile` with all data
- On complete: route to Pool page

---

### 4.3 Pool Page — Candidate Discovery (发现)

**Route condition**: Authenticated, active tab = "发现"

**Header**: `候选人池` (text-[#C4956A], text-base)

**Content**: Grid of candidate cards, fetched from GET `/api/pool`

**Candidate Card**:
```
┌─────────────────────────┐
│ [PixelAvatar]  城市 · 25岁│
│  (48x48)       ♂         │
│                          │
│ ████████░░  85           │  ← Fit score bar (accent fill) + number
│                          │
│ • 你们都喜欢旅行          │  ← Highlights (max 3)
│ • 对生活节奏想法相似       │
│ • 价值观接近              │
│                          │
│ [    联系TA    ]          │  ← pixel-btn, text-xs
└─────────────────────────┘
```

**Approach Modal** (triggered by "联系TA"):
```
┌─────────────────────────────┐
│ 选择联系方式                 │
│                             │
│ [标准 ¥19] [个性化 ¥39] [深度 ¥69] │  ← 3 tier buttons
│                             │
│ AI为你写的开场白:            │
│ ┌───────────────────────┐   │
│ │ (AI-generated message) │   │  ← textarea, editable, max 150 chars
│ │ 你好，我看到你喜欢...  │   │
│ └───────────────────────┘   │
│                             │
│ [取消]         [确认发送]    │
└─────────────────────────────┘
```

- Select tier → POST `/api/approaches/draft` → populates AI message
- Confirm → POST `/api/approaches/send`

**Empty state**: "暂无候选人，完善档案后重试" (centered, muted text)

---

### 4.4 Inbox Page — Received Approaches (收到)

**Header**: `收到的心意` (text-[#C4956A], text-base)

**Approach Card** (collapsed):
```
┌─────────────────────────────┐
│ [PixelAvatar]  城市 · 28岁   [▼] │
│  (40x40)       标准           │
│                              │
│ [温柔体贴] [爱好运动]         │  ← personality tags (max 3)
└─────────────────────────────┘
```

**Approach Card** (expanded):
```
┌─────────────────────────────┐
│ [PixelAvatar]  城市 · 28岁   [▲] │
│  (40x40)       标准              │
│                                 │
│ [温柔体贴] [爱好运动]            │
│                                 │
│ ┌───────────────────────┐       │
│ │ "你好，我看到你也喜欢  │       │  ← AI message, dark bg box
│ │  爬山，想认识你。"     │       │
│ └───────────────────────┘       │
│                                 │
│ [婉拒]          [接受约会]       │
└─────────────────────────────────┘
```

- Decline → PATCH `/api/approaches/{id}/respond` body: `{response: "declined"}`
- Accept → body: `{response: "accepted"}` → Creates Match, appears in Pipeline

**Empty state**: "暂无待回复的心意"

---

### 4.5 Pipeline Page — My Connections (管道)

**Header**: `我的缘分` (text-[#C4956A], text-base)

**Match Card**:
```
┌─────────────────────────────────┐
│ [RelationshipBloom]  城市       │
│  (100x100)           [TA发起]   │
│                                 │
│  [温柔体贴] [善于倾听]          │  ← personality tags
│                                 │
│ ──✓──────🌿──────────🌸────     │  ← RoundProgress (3 milestones)
│  初见     深聊    见见我的圈子    │
│  ████░░░░  本轮进度  3/5        │
│                                 │
│ ┌─ Match Setup ──────────────┐  │
│ │ 选择见面方式                │  │
│ │ [视频通话] [线下见面] [都可以]│ │  ← Format vote buttons
│ └────────────────────────────┘  │
└─────────────────────────────────┘
```

**Match Setup states** (inline within the card):

State 1 — Vote (no vote yet):
```
选择见面方式
[视频通话] [线下见面] [都可以]
```

State 2 — Waiting (I voted, other hasn't):
```
你选了「视频通话」
● 等待对方选择...        ← pulsing dot
```

State 3 — Ready (both voted, format resolved):
```
飞书视频  6月5日 14:00    ← resolved format + scheduled time
[      开始对话      ]    ← accent pixel-btn, full width
```

**Empty state**:
```
暂无进行中的连接
去「发现」页面找到你的第一段缘分   ← text-[#2A2A4A]
```

---

### 4.6 Session Page — Live Question Guide (Full Screen)

**Route condition**: Active session ID set. Bottom nav bar HIDDEN.

**This is the emotional core of the product.** Two people (on video call or sitting together) are guided through 5 AI-curated questions. The experience is intimate, warm, unhurried.

**Layout**:
```
┌──────────────────────────────────┐
│ [Background: RelationshipBloom   │  ← Large (320px), opacity 15%
│  centered, translucent]          │     Grows with each completed question
│                                  │
│ ┌─ Header ─────────────────────┐ │
│ │ 初见                 37:24   │ │  ← Round name + Timer (monospace)
│ │ 第1轮 · 视频 · AI精选5题     │ │     Timer turns warm when <5min
│ │                   [Bloom56]  │ │  ← Small bloom top-right
│ │ ████░░░░░░                   │ │  ← 5 progress segments (thicker)
│ └──────────────────────────────┘ │
│                                  │
│         Q4 · 2/5                 │  ← Question number + position
│       [换一题 (2)]               │  ← Swap button with remaining count
│                                  │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │ 对你来说，一个完美的          │ │  ← Typewriter reveal, large text
│ │ 一天是什么样的？▌             │ │     text-lg, centered, monospace
│ │                              │ │     Click to skip typewriter
│ └──────────────────────────────┘ │
│                                  │
│    记录你的想法（仅自己可见）      │  ← Tap to expand answer input
│                                  │
│  [Expanded answer area:]         │
│  ┌──────────────────────────┐    │
│  │ (textarea, max 500 chars) │    │
│  │ 写下你的感受...           │    │
│  │                  128/500  │    │  ← Char count
│  │              [保存] / 已保存│   │
│  └──────────────────────────┘    │
│                                  │
│ ┌─ Footer ─────────────────────┐ │
│ │ [跳过]      [  下一题 →  ]   │ │  ← Host only
│ │                              │ │
│ │ [打开飞书视频 →]              │ │  ← If video session (teal link)
│ │ [       结束今天       ]     │ │  ← Always visible, muted border
│ └──────────────────────────────┘ │
│                                  │
│ (Non-host sees instead:)         │
│ │  ● 等待对方切换题目           │ │  ← Pulsing dot
└──────────────────────────────────┘
```

**Timer prompt** (overlay, when timer reaches 0):
```
┌─────────────────────────┐
│ 时间到了                │
│ 今天聊到这里？           │
│ 还是再继续一会儿？       │
│                         │
│ [结束]    [再聊一会儿]   │
└─────────────────────────┘
```

**All questions done** (replaces question card):
```
[RelationshipBloom, 180px, centered]

本轮问题已全部聊完
你们一起走过了 5 个问题
```

---

### 4.7 Rating Modal — Post-Session

**Triggered by**: "结束今天" button in Session page

**Overlay**: Fixed, bg-black/70, centered modal

```
┌─────────────────────────┐
│ [RelationshipBloom 100] │  ← bloom in modal
│                         │
│ 今天聊得怎么样？         │  ← text-[#C4956A]
│ 你的评分对方不会看到     │  ← text-[#2A2A4A], 10px
│                         │
│ [1] [2] [3] [★] [★]    │  ← 5 buttons, filled=accent+star
│                         │     4 stars selected in this example
│ 想继续了解TA吗？         │
│                         │
│ [暂时到这里] [继续深聊→] │  ← disabled if rating=0 (opacity 30%)
└─────────────────────────┘
```

- Rating: tap 1-5, filled buttons show ★ with accent bg + scale-110
- "暂时到这里" → end session with advance=false
- "继续深聊 →" → end session with advance=true
- POST `/api/sessions/{id}/end` body: `{rating, advance}`

---

## 5. Shared Components

### 5.1 PixelAvatar

**Purpose**: Deterministic 8-bit portrait generated from userId string. No real photos in Pool/Pipeline.

**Props**: `userId: string`, `pixelSize: number` (default 8)

**Visual**: 8x8 pixel grid. 4 color palettes (warm amber, cool lavender, rose pink, golden). 2 face templates. Palette + template selected by hash of userId. CSS grid of colored divs.

**Size**: ~64x64 default (8 pixels x 8px each). Used at various sizes via pixelSize prop.

### 5.2 RelationshipBloom

**Purpose**: Canvas-based pixel-art plant that grows with each round of the relationship. Each match_id generates a unique flower (different colors, shape variations via seeded PRNG).

**Props**: `matchId: string`, `round: 0-3`, `status: "active"|"confirmed"|"closed"`, `daysSinceLastActivity?: number`, `size: number`

**Growth stages**:
| Round | Stage | Visual |
|---|---|---|
| 0 | Seed | Glowing seed on soil |
| 1 | Sprout | Short stem, 3 leaves |
| 2 | Growth | Taller stem, 6 leaves, 2 small flowers |
| 3 | Flourishing | Full stem, 8 leaves, 4 flowers, crown flower, glow |
| confirmed | Full bloom | Maximum growth + radiant halo + ambient stars |
| closed | Withered | Grayscale, 40% opacity |

**Decay**: If daysSinceLastActivity > 3, colors gradually desaturate:
- 0-3 days: Full color
- 3-7 days: 65% vitality
- 7-14 days: 35% vitality
- 14+ days: 15% vitality (nearly gray)

**5 color palettes**: Each match_id deterministically selects one:
1. Warm amber (tan/brown/gold)
2. Cool lavender (purple/blue)
3. Rose pink (pink/magenta)
4. Golden (yellow/orange)
5. Teal (green/cyan)

**Canvas**: 20x28 pixel grid, scales to `size` prop. Elements: sky, stars, ground (soil), stem, leaves, flowers (cross-shaped pixel art), crown, glow halo.

### 5.3 RoundProgress

**Purpose**: Horizontal 3-milestone progress bar showing relationship round progression.

**Props**: `currentRound: 1|2|3`, `status`, `questionsCompleted: number`, `questionsTotal: number`

**Visual**:
```
  ✓─────────🌿──────────🌸
 初见       深聊    见见我的圈子
████░░░░  本轮进度  3/5
```

- 3 milestone dots connected by line
- Completed rounds: filled accent circle with checkmark
- Current round: accent border + glow shadow + emoji icon
- Future rounds: gray empty circle + emoji icon
- Below: sub-progress bar for questions within current round
- If status="confirmed": shows "在一起了 ✦" (accent text)

---

## 6. API Endpoints (Frontend consumes)

### Auth
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify` | Verify OTP, get JWT token |

### Profile
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/profile` | Get current user profile |
| PUT | `/api/profile` | Update profile |
| POST | `/api/profile/selfie` | Upload selfie (FormData) |

### Pool
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/pool` | Get ranked candidate list |

### Approaches
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/approaches/draft` | AI-draft approach message |
| POST | `/api/approaches/send` | Send approach (pay + confirm) |
| GET | `/api/approaches/received` | List received approaches |
| GET | `/api/approaches/sent` | List sent approaches |
| PATCH | `/api/approaches/{id}/respond` | Accept/decline approach |

### Match Setup
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/matches/{id}/vote` | Vote format (video/in_person/either) |
| POST | `/api/matches/{id}/availability` | Submit time slots |
| GET | `/api/matches/{id}/setup-status` | Get vote + scheduling status |

### Pipeline
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/pipeline` | Get pursuing + being_found matches |

### Sessions
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/sessions` | Create session (triggers AI question curation) |
| GET | `/api/sessions/{id}/state` | Get live session state (poll every 3s) |
| POST | `/api/sessions/{id}/advance` | Advance to next question (host only) |
| POST | `/api/sessions/{id}/skip` | Skip current question (host only) |
| POST | `/api/sessions/{id}/swap` | Swap current question for another (max 3) |
| POST | `/api/sessions/{id}/answer` | Save user's answer to a question |
| GET | `/api/sessions/{id}/answers` | Get user's own answers |
| POST | `/api/sessions/{id}/end` | End session with rating + advance decision |

### Offers
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/offers` | Send "我想认真了" offer |
| PATCH | `/api/offers/{id}/respond` | Accept/decline/not_yet |

### Meetings
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/meetings/schedule` | Schedule Feishu video meeting |

---

## 7. User Journey — Complete Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────┐
│  Login  │ ──> │  Onboarding  │ ──> │   Pool   │
│  (Auth) │     │  (4 steps)   │     │ (Browse) │
└─────────┘     └──────────────┘     └────┬─────┘
                                          │
                              User taps "联系TA"
                                          │
                                    ┌─────▼─────┐
                                    │ Approach   │ Pay + confirm AI message
                                    │ Modal      │
                                    └─────┬─────┘
                                          │
                              Other person receives in Inbox
                                          │
                                    ┌─────▼─────┐
                                    │  Inbox    │ Accept or decline
                                    │           │
                                    └─────┬─────┘
                                          │ Accept
                                    ┌─────▼─────┐
                                    │ Pipeline  │ Match appears
                                    │           │ Vote on format
                                    └─────┬─────┘
                                          │ Both voted
                                    ┌─────▼──────┐
                                    │ Session    │ 5 AI-curated questions
                                    │ (45 min)   │ Timer, bloom grows
                                    └─────┬──────┘
                                          │
                                    ┌─────▼─────┐
                                    │ Rating    │ 1-5 stars + advance?
                                    │ Modal     │
                                    └─────┬─────┘
                                          │
                              Both advance? → Round 2 unlocked
                              Either declines? → Match closed
                                          │
                                    ┌─────▼──────┐
                                    │ Round 2    │ Questions 13-24
                                    │ (90 min)   │ In-person date
                                    └─────┬──────┘
                                          │
                                    ┌─────▼──────┐
                                    │ Round 3    │ Questions 25-36
                                    │ (optional) │ Meet friends/family
                                    └─────┬──────┘
                                          │
                                    ┌─────▼──────┐
                                    │  Offer     │ "我想认真了"
                                    │  Stage     │ Accept → 在一起
                                    └────────────┘
```

---

## 8. Key Interaction Details

### 8.1 Session Sync Model
- One phone is "host" (approach initiator). Host taps "下一题" to advance.
- Non-host phone polls GET `/api/sessions/{id}/state` every 3 seconds.
- Both see the same question. Non-host sees "等待对方切换题目" with pulsing dot.

### 8.2 AI Question Curation
- Session creation calls Claude Haiku to select 5 best questions from the round's 12, based on both users' profiles.
- Fallback: random 5 if API unavailable.
- Users can swap the current question up to 3 times per session ("换一题" button).

### 8.3 Answer Recording
- Below each question: collapsible textarea "记录你的想法（仅自己可见）"
- Max 500 chars. Saved via POST. Only the writer can see their own answers.
- Answers persist and can be reviewed later (future feature: in Pipeline match detail).

### 8.4 Photo Reveal Timeline
- Pool: PixelAvatar only (no real photo)
- Approach accepted: Still PixelAvatar
- Round 1 complete (both parties): Real selfie unlocked

### 8.5 Relationship Bloom as Visual Feedback
- Every match has a unique RelationshipBloom (seeded by match_id)
- It grows as rounds progress: seed → sprout → growth → flourish
- It withers (grayscale) if the relationship stagnates (no activity for 7+ days)
- It appears: Session background (large, translucent), Pipeline card (medium), Session header (small)

---

## 9. Empty States & Loading

| Page | Loading | Empty |
|---|---|---|
| Pool | "加载候选人..." | "暂无候选人，完善档案后重试" |
| Inbox | "加载中..." | "暂无待回复的心意" |
| Pipeline | "加载管道..." | "暂无进行中的连接 / 去「发现」页面找到你的第一段缘分" |
| Session | Pulsing bar + "准备中..." | N/A |

All loading states use muted text (#A09CA0), monospace, centered.

---

## 10. Technical Notes

- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS
- **Data fetching**: SWR for list pages (auto-revalidation)
- **State management**: useState/useEffect (no Redux/Zustand needed)
- **Auth**: JWT token in localStorage, sent as `Authorization: Bearer {token}` header
- **API base**: configurable via `VITE_API_URL` env var
- **No SSR**: Pure client-side SPA
- **All text in Chinese** (UI labels, error messages, hints)
