# Resonance (共振) — Frontend Design Specification

> **Purpose**: This document describes every page, component, interaction, and visual detail of the Resonance dating app frontend. It is designed to be self-sufficient input for a frontend builder (v0.dev, Vercel, or any AI code generator).

---

## 1. Product Summary

Resonance is a structured dating app where an AI agent (not a swipe algorithm) curates matches and guides two people through Arthur Aron's 36 Progressive Questions. The metaphor is "headhunter, not Tinder" — the app arranges meetings, presents curated questions, and tracks relationship growth.

**Platform**: Mobile-first H5 web app (React + TypeScript + Tailwind)
**Baseline viewport**: 390px wide (iPhone 14). Single column only. No desktop layout.

---

## 2. Design Language — Ghibli Pixel Aesthetic

### 2.1 Philosophy

The visual identity combines **pixel art** with **Studio Ghibli's warmth** — like a handwritten letter on parchment paper, illustrated with tiny pixel scenes. Inspired by mmguo.dev's aesthetic: warm, natural, minimal, with pixel-art illustrations that feel like Miyazaki's world rendered in 8-bit.

This is NOT a dark cyberpunk app. It is:
- **Warm and natural**: Parchment/paper background, earth-tone colors, like a cozy cafe
- **Pixel-art romantic**: Pixel illustrations of trees, flowers, stars — Ghibli-style nature scenes
- **Clean and spacious**: Generous whitespace, single column, content breathes
- **Honest and quiet**: Monospace type, no flashy animations, no glossy gradients

### 2.2 Color Palette (Ghibli Parchment Theme)

Extracted from mmguo.dev + adapted for a dating app:

```
Background:         #F3F1ED  (warm parchment / rice paper)
Card background:    #FBF9F6  (slightly lighter cream)
Card background alt:#EDE9E3  (slightly darker, for depth)
Primary text:       #1D1B1B  (deep warm black — NOT pure black)
Secondary text:     #4F4D4A  (warm dark gray — descriptions, body)
Muted text:         #6B6966  (medium warm gray — timestamps, hints)
Faint text:         #9E9A94  (light warm gray — placeholders)
Accent:             #C4956A  (warm amber — CTAs, active states, progress bars)
Accent hover:       #B5845B  (darker amber on hover)
Accent light:       #E8D5C0  (light amber — tag backgrounds, subtle highlights)
Border:             #C5C1BB  (warm gray border — cards, section dividers)
Border light:       #DDD9D3  (lighter border for inner elements)
Link:               #1D1B1B  (same as text, underlined — like mmguo.dev)
Success:            #5A9E6F  (natural green — earthy, not neon)
Warning:            #D4915A  (warm orange)
Error:              #C75B5B  (muted red — not aggressive)
Pixel sky:          #2B3A67  (deep blue — for pixel art night scenes)
Pixel stars:        #F0EDE8  (warm white dots in pixel art sky)
Pixel foliage:      #4A7C59  (natural green for pixel trees/leaves)
Pixel earth:        #8B6B4A  (brown soil in pixel art)
```

**Color temperature**: Everything is WARM. No cold blues, no neon, no pure white backgrounds. Think: aged paper, natural wood, morning sunlight.

### 2.3 Typography

- **Headings & UI labels**: `IBM Plex Mono` (monospace) — 400, 500, 600 weights
- **Body text**: `Inter` (sans-serif) — for longer descriptions, readability
- Both loaded from Google Fonts

**Sizes** (mobile-first):
  - Page title: `17px`, font-weight 500, IBM Plex Mono
  - Section header: `14px`, font-weight 500, uppercase tracking, IBM Plex Mono
  - Body: `14-15px`, font-weight 400, Inter (line-height 1.6)
  - Card title: `14px`, font-weight 600, IBM Plex Mono, underline on hover
  - Micro: `12px` — hints, timestamps, tags
  - Tiny: `11px` — pixel art labels

### 2.4 UI Primitives

**Page background**: Solid `#F3F1ED`. NO grid overlay, NO dot pattern. Clean like paper.

**Card**: Background `#FBF9F6`, border `1px solid #C5C1BB`. NO border-radius (sharp pixel edges) or very minimal (2px max). Subtle hover: border darkens to `#9E9A94`.

**Section divider**: Horizontal rule with text label, like mmguo.dev:
```
── 01 PROJECTS ──────────────────────
```
Text in `#6B6966`, uppercase, letter-spacing 2px, with `#C5C1BB` line extending right.

**Button (primary)**: Background `#C4956A`, text `#FBF9F6`. Sharp edges (no border-radius). On `:active`: translateY(1px). On hover: background darkens to `#B5845B`.

**Button (secondary)**: Background transparent, border `1px solid #C5C1BB`, text `#4F4D4A`. On hover: border `#C4956A`, text `#C4956A`.

**Tag/chip**: Background `#EDE9E3`, text `#4F4D4A`, no border. Selected: background `#E8D5C0`, text `#1D1B1B`, border `1px solid #C4956A`.

**Input**: Background `#FBF9F6`, border-bottom `1px solid #C5C1BB` (only bottom border). Focus: border-bottom `#C4956A`. Placeholder: `#9E9A94`.

### 2.5 Pixel Art Style (Ghibli-inspired)

The app features **pixel-art scene illustrations** at key moments, NOT as background textures but as hero images:

**Style references**: The pixel tree scene from mmguo.dev — a large oak tree with a small character underneath, surrounded by a night-sky circle with stars and fireflies. This exact vibe.

**Where pixel art appears**:
- **Login page**: Hero illustration — a small pixel character sitting under a tree, waiting. Stars twinkling.
- **Onboarding complete**: Pixel character stands up, a seed appears in their hand.
- **Pool page header**: Pixel landscape — a village path with distant houses and trees.
- **Pipeline match card**: Each match has a unique RelationshipBloom (growing pixel plant).
- **Session background**: Large pixel tree with two characters sitting underneath (translucent, 15% opacity).
- **Rating complete**: Pixel flower blooms / withers based on decision.
- **Empty states**: Small pixel character sitting alone, with gentle text.

**Pixel art palette** (for the illustrations):
- Night sky: deep navy `#2B3A67` with warm white stars `#F0EDE8`
- Foliage: natural greens `#4A7C59`, `#6B9E5E`, `#3D6B48`
- Earth/trunk: warm browns `#8B6B4A`, `#6B5038`, `#A0845C`
- Character hair: warm red-brown `#C46B4A` (like mmguo.dev's character)
- Character skin: soft peach `#E8C4A0`
- Flowers: soft pink `#D4869A`, amber `#C4956A`, lavender `#8B7BB0`
- Glow/halo: radial gradient from transparent to `rgba(43,58,103,0.4)` (the night sky circle effect)

**Canvas rendering**: 20-28px pixel grid, rendered on `<canvas>`, scaled to desired size. Each "pixel" is a clear, sharp square — NO anti-aliasing, NO smoothing. `image-rendering: pixelated`.

### 2.6 Animation Rules

- **Typewriter**: Text reveals character by character (40ms per char) — for AI messages and question reveals
- **Fade**: `opacity 0→1, duration 300ms` for page transitions and question changes
- **Star twinkle**: Subtle opacity pulse on pixel stars (CSS animation, very slow — 3-5s cycle)
- **Bloom grow**: When a question is completed, the RelationshipBloom adds a tiny leaf/flower (canvas animation, 500ms)
- **NO**: bounce, confetti, particle effects, slide-up sheets, spring physics, heart rain

### 2.7 What This Design AVOIDS

```
✗  Dark/black backgrounds (we use warm parchment)
✗  Neon colors, cold blues, pure whites
✗  Stock photo illustrations of happy couples
✗  Pink/purple gradient backgrounds
✗  Rounded "bubble" UI (border-radius > 2px)
✗  Confetti, heart rain, match animations
✗  Glossy, high-contrast "tech startup" aesthetic
✗  Dense card grids (we use generous whitespace)
✗  Anything that feels like a swipe app
```

---

## 3. Navigation Structure

**Bottom tab bar** (fixed, visible except during Session):

```
┌────────────┬────────────┬────────────┐
│   发现     │    收到    │    管道    │
│   (Pool)   │  (Inbox)   │ (Pipeline) │
└────────────┴────────────┴────────────┘
```

- Background: `#F3F1ED` with top border `#C5C1BB`
- Active tab: `#C4956A` (accent) text
- Inactive tab: `#6B6966` (muted) text
- Font: IBM Plex Mono, 12px
- **Inbox badge**: `#C75B5B` background, white text, 9px font, top-right of "收到"
- **Hidden during Session page** (immersive full-screen)

**App-level routing** (state-based):
```
No token  → Auth page
Token + incomplete profile → Onboarding page
Token + complete profile → Tab pages (Pool / Inbox / Pipeline)
Active session → Session page (full screen, no tabs)
```

---

## 4. Page Specifications

### 4.1 Auth Page — Login

**Layout**: Full screen, `#F3F1ED` background, content centered vertically

```
[generous whitespace — 40% of screen]

┌─ Pixel Art Hero ─────────────────┐
│  [Canvas: small character sitting │  ← Ghibli pixel scene
│   under a large tree, night sky   │     inside a soft circular glow
│   with stars, warm firefly glow]  │     like mmguo.dev's hero
└──────────────────────────────────┘

"你和我有共同的记忆，               ← italic, #6B6966, Inter
 比前方的路还长。"                    quote from Ghibli

[whitespace]

RESONANCE                           ← #1D1B1B, IBM Plex Mono, 17px, weight 500
找到同频的人                          ← #4F4D4A, Inter, 14px

[whitespace]

手机号                               ← label, #6B6966, 12px
[13800000000                    ]   ← input, bottom-border only, #C5C1BB
                                      focus: bottom-border #C4956A

[      获取验证码      ]             ← pixel-btn, #C4956A bg, #FBF9F6 text

[after OTP sent:]

验证码
[______                         ]
[      验证登录        ]
```

### 4.2 Onboarding Page — Profile Wizard (4 Steps)

**Layout**: `#F3F1ED` background, centered single column, max-width 360px

**Progress**: 4 dots at top, connected by line
```
  ●───────●───────○───────○
 头像    信息    性格    期望
```
Completed: filled `#C4956A`. Current: filled with ring glow. Future: empty `#C5C1BB`.

**Step 1: 上传头像**
```
┌─────────────────────────┐
│  [Dashed border 120x120] │  ← #C5C1BB dashed, bg #FBF9F6
│  点击上传                │
│                         │
│  之后可以修改            │  ← #9E9A94, 12px
│                         │
│ [跳过]       [下一步 →] │
└─────────────────────────┘
```

**Step 2: 基本信息**
```
年龄 *        [number input]     ← bottom-border inputs
城市 *        [text input]
性别 *        [男] [女] [其他]   ← tag-style toggles
学历          [text input]
工作          [text input]

[← 返回]              [下一步 →]
```

**Step 3: 我的性格**
```
人生目标
[textarea, 3 lines, #FBF9F6 bg]

性格标签 (最多5个)
[温柔体贴] [理性冷静] [爱好运动]    ← tag chips
[文艺青年] [事业心强] [居家型]       selected: #E8D5C0 bg, #C4956A border
[幽默风趣] [独立自主] [善于倾听]
[热爱旅行] [创意思维] [注重健康]

[← 返回]              [下一步 →]
```

**Step 4: 期望对象**
```
期望性别 *    [男] [女] [不限]
年龄范围      [min] — [max]
期望城市      [text input]
其他要求      [textarea]

[← 返回]          [完成档案 ✓]
```

### 4.3 Pool Page — Candidate Discovery (发现)

**Header**: Section divider style:
```
── 候选人池 ────────────────────────
```

**Candidate Card** (stacked vertically, generous spacing between cards):
```
┌──────────────────────────────────┐
│ [PixelAvatar]    城市 · 25岁     │  ← avatar 48x48, warm pixel art
│  (48x48)         ♂               │
│                                  │
│ ████████░░  85                   │  ← fit score: #C4956A fill bar
│                                  │
│  · 你们都喜欢旅行                 │  ← #4F4D4A, Inter, 13px
│  · 对生活节奏想法相似              │     bullet: #C4956A dot
│  · 价值观接近                     │
│                                  │
│ [       联系TA       ]           │  ← pixel-btn, accent
└──────────────────────────────────┘

[24px spacing]

┌──────────────────────────────────┐
│ next card...                     │
└──────────────────────────────────┘
```

**Approach Modal** (overlay with `rgba(29,27,27,0.5)` backdrop):
```
┌──────────────────────────────────┐
│ 选择联系方式                      │  bg: #FBF9F6, border: #C5C1BB
│                                  │
│ [标准 ¥19] [个性化 ¥39] [深度 ¥69]│  ← secondary buttons, accent on select
│                                  │
│ AI为你写的开场白:                  │
│ ┌────────────────────────────┐   │
│ │ 你好，我看到你喜欢爬山...   │   │  ← textarea, max 150 chars
│ └────────────────────────────┘   │
│                                  │
│ [取消]              [确认发送]    │
└──────────────────────────────────┘
```

**Empty state**:
```
[Small pixel character sitting alone on a bench]

暂无候选人
完善档案后重试                    ← #9E9A94
```

### 4.4 Inbox Page — Received Approaches (收到)

**Header**: `── 收到的心意 ────────────────`

**Approach Card** (collapsed):
```
┌──────────────────────────────────┐
│ [PixelAvatar]  城市 · 28岁  [▼]  │  bg: #FBF9F6
│               「标准」            │  ← tier label in 「」, #6B6966
│ [温柔体贴] [爱好运动]            │  ← tags, #EDE9E3 bg
└──────────────────────────────────┘
```

**Approach Card** (expanded):
```
┌──────────────────────────────────┐
│ [PixelAvatar]  城市 · 28岁  [▲]  │
│               「标准」            │
│ [温柔体贴] [爱好运动]            │
│                                  │
│ ┌────────────────────────────┐   │
│ │ "你好，我看到你也喜欢       │   │  ← AI message, #EDE9E3 bg
│ │  爬山，想认识你。"          │   │     italic, Inter
│ └────────────────────────────┘   │
│                                  │
│ [婉拒]              [接受约会]   │
└──────────────────────────────────┘
```

**Empty state**: "暂无待回复的心意" + small pixel mailbox illustration

### 4.5 Pipeline Page — My Connections (管道)

**Header**: `── 我的缘分 ────────────────`

**Match Card**:
```
┌──────────────────────────────────┐
│                                  │
│ [RelationshipBloom]   城市       │  ← Bloom 100x100, Ghibli pixel plant
│   (pixel plant)       [TA发起]   │     growing in a small pot/soil scene
│                                  │
│  [温柔体贴] [善于倾听]           │
│                                  │
│  ●─────────◐──────────○          │  ← RoundProgress, warm colors
│  初见      深聊    见见我的圈子   │
│  ████░░░  3/5                    │  ← sub-progress bar
│                                  │
│ ┌─ 安排初见 ─────────────────┐   │
│ │ 选择见面方式                │   │  ← Match setup section
│ │ [视频通话] [线下见面] [都可以]│  │     secondary button style
│ └────────────────────────────┘   │
│                                  │
└──────────────────────────────────┘
```

**Setup states** (within card):

Voted, waiting: `你选了「视频通话」· 等待对方选择...`
Ready: `飞书视频 · 6月5日 14:00` + `[开始对话]` accent button

**Empty state**:
```
[Pixel character looking at the horizon, small path ahead]

暂无进行中的连接
去「发现」页面找到你的第一段缘分
```

### 4.6 Session Page — Live Question Guide (Full Screen, Immersive)

**This is the emotional core of the product.**

**Background**: `#F3F1ED` paper. Large pixel-art tree scene (like mmguo.dev) centered at 15% opacity — two small characters sitting under a tree. This is the RelationshipBloom rendered as a full Ghibli scene.

```
┌──────────────────────────────────┐
│ [Background: Pixel tree scene    │
│  with two characters, 15% opacity│
│  stars twinkling softly]         │
│                                  │
│ ┌─ Header ─────────────────────┐ │
│ │ 初见               37:24     │ │  ← IBM Plex Mono
│ │ 第1轮 · 视频 · AI精选5题     │ │     #6B6966, 12px
│ │                  [Bloom 56]  │ │  ← small bloom top-right
│ │ ████░░░░░░                   │ │  ← 5 thick progress bars
│ │ (completed=#C4956A, empty=#DDD9D3)│
│ └──────────────────────────────┘ │
│                                  │
│                                  │
│         Q4 · 2/5                 │  ← #6B6966, IBM Plex Mono
│       [换一题 (2)]               │  ← small link-style button
│                                  │
│ ┌──────────────────────────────┐ │
│ │                              │ │  ← card: #FBF9F6, border #C5C1BB
│ │ 对你来说，一个完美的          │ │     Inter, 18px, #1D1B1B
│ │ 一天是什么样的？▌             │ │     typewriter reveal
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│  记录你的想法（仅自己可见）       │  ← #9E9A94, 12px, tap to expand
│                                  │
│  [expanded textarea area]        │
│  ┌──────────────────────────┐    │
│  │ 写下你的感受...           │    │  ← #FBF9F6 bg, Inter
│  │                  128/500  │    │
│  │              [保存]       │    │
│  └──────────────────────────┘    │
│                                  │
│ ┌─ Footer ─────────────────────┐ │
│ │ [跳过]      [  下一题 →  ]   │ │
│ │ [打开飞书视频 →]              │ │  ← underline link, #1D1B1B
│ │ [       结束今天       ]     │ │  ← secondary button
│ └──────────────────────────────┘ │
│                                  │
│ Non-host: ● 等待对方切换题目     │  ← pulsing #C4956A dot
└──────────────────────────────────┘
```

**Timer**: IBM Plex Mono, `#4F4D4A`. When <5min remaining: `#D4915A` (warm orange).

**All questions done**:
```
[RelationshipBloom full scene, 180px]
(pixel plant has fully bloomed, flowers open)

本轮问题已全部聊完
你们一起走过了 5 个问题
```

### 4.7 Rating Modal — Post-Session

**Overlay**: `rgba(29,27,27,0.5)` backdrop, centered modal

```
┌──────────────────────────────────┐
│          [Bloom 100px]           │  bg: #FBF9F6, border: #C5C1BB
│                                  │
│    今天聊得怎么样？               │  ← #C4956A, IBM Plex Mono
│    你的评分对方不会看到            │  ← #9E9A94, 11px
│                                  │
│    [1] [2] [3] [★] [★]          │  ← selected: #C4956A bg
│                                  │     unselected: #EDE9E3 bg, #4F4D4A text
│    想继续了解TA吗？               │
│                                  │
│ [暂时到这里]     [继续深聊 →]     │  ← disabled: opacity 30%
└──────────────────────────────────┘
```

---

## 5. Shared Components

### 5.1 PixelAvatar

Deterministic 8-bit portrait from userId. 8x8 pixel grid. 4 warm palettes (amber, rose, forest, golden). Rendered as CSS grid of colored divs or small canvas.

### 5.2 RelationshipBloom

Canvas pixel-art plant in a Ghibli style. Grows from seed → sprout → bush → flowering tree.

**Key change from original**: Instead of abstract pixel shapes, render as a recognizable **small tree/plant scene** — soil at bottom, stem growing up, leaves, flowers, eventually a small tree. Two tiny pixel characters may appear beside it at later stages.

**5 warm palettes**: Amber, Rose, Forest Green, Golden, Lavender — all drawn from the Ghibli-inspired warm color set above.

**Decay**: Colors gradually shift toward gray-brown (like autumn leaves falling) rather than harsh grayscale.

### 5.3 RoundProgress

Horizontal 3-milestone bar:
```
●─────────◐──────────○
初见      深聊    见见我的圈子
```
- Completed: filled `#C4956A` circle + checkmark
- Current: `#C4956A` border + glow ring + emoji
- Future: `#C5C1BB` empty circle
- Line: `#C5C1BB`, filled portion `#C4956A`
- Sub-progress bar: `#C4956A` fill on `#DDD9D3` background

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
| POST | `/api/offers` | Send offer |
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
                                    │ Round 2    │ 5 more questions (from Q13-24)
                                    │ (90 min)   │ In-person date
                                    └─────┬──────┘
                                          │
                                    ┌─────▼──────┐
                                    │ Round 3    │ 5 more questions (from Q25-36)
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
- Session creation triggers Claude Haiku to select 5 best questions from the round's 12, based on both users' profiles.
- Fallback: random 5 if API unavailable.
- Users can swap the current question up to 3 times per session.

### 8.3 Answer Recording
- Below each question: collapsible textarea "记录你的想法（仅自己可见）"
- Max 500 chars. Only the writer can see their own answers.

### 8.4 Photo Reveal Timeline
- Pool: PixelAvatar only
- Approach accepted: Still PixelAvatar
- Round 1 complete: Real selfie unlocked

### 8.5 RelationshipBloom as Visual Metaphor
- Each match has a unique pixel plant (seeded by match_id)
- Grows as rounds progress: seed → sprout → growth → bloom
- Withers (autumn colors, falling leaves) if no activity for 7+ days
- Appears in: Session background, Pipeline card, Session header

---

## 9. Empty States & Loading

| Page | Loading | Empty |
|---|---|---|
| Pool | "正在寻找..." (#6B6966) | Pixel character on bench + "暂无候选人" |
| Inbox | "加载中..." | Pixel mailbox + "暂无待回复的心意" |
| Pipeline | "加载中..." | Pixel character on path + "暂无进行中的连接" |
| Session | Pulsing bar + "准备中..." | N/A |

All loading uses Inter font, muted warm gray, centered.

---

## 10. Technical Notes

- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS
- **Fonts**: IBM Plex Mono (headings/UI) + Inter (body text) — both from Google Fonts
- **Data fetching**: SWR for list pages
- **Auth**: JWT token in localStorage, `Authorization: Bearer {token}` header
- **API base**: `VITE_API_URL` env var
- **Canvas**: Used for RelationshipBloom and pixel-art hero illustrations. Must use `image-rendering: pixelated` for crisp pixels.
- **All UI text in Chinese**
- **No SSR**: Pure client-side SPA
