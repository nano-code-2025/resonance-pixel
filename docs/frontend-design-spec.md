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

### 2.5 Pixel Art Style (Ghibli + Terraria-inspired)

The app features **pixel-art scene illustrations** at key moments, NOT as background textures but as hero images. The pixel art combines **Studio Ghibli's warmth** with **Terraria's procedural plant growth** — living, growing, interactive pixel plants that respond to relationship progress and real time.

**Style references**:
- mmguo.dev's pixel tree scene — warm circular glow, character under tree, stars/fireflies
- Terraria's biome-specific plant system — each environment has distinct flora types, colors, growth patterns
- Terraria's tile-based aesthetic — 16x16 pixel tiles, clean sharp edges, no anti-aliasing

**Where pixel art appears**:
- **Login page**: Hero illustration — a small pixel character sitting under a tree, waiting. Stars twinkling. Day/night sky matches real time.
- **Onboarding complete**: Pixel character stands up, a seed appears in their hand.
- **Pool page header**: Pixel landscape — a village path with distant houses and trees.
- **Pipeline match card**: Each match has a unique RelationshipBloom — a specific **plant species** (not just color variation) that grows with the relationship.
- **Session background**: Large pixel tree with two characters sitting underneath (translucent, 15% opacity). The tree type matches the match's bloom species.
- **Rating complete**: Pixel flower blooms (petal particle burst) or withers (autumn leaf fall) based on decision.
- **Empty states**: Small pixel character sitting alone, with gentle text.

**Pixel art palette** (for the illustrations):
- Night sky: deep navy `#2B3A67` with warm white stars `#F0EDE8`
- Dawn/dusk sky: warm gradient `#D4915A` → `#2B3A67`
- Day sky: soft blue `#87AECF` with warm white clouds `#F0EDE8`
- Foliage: natural greens `#4A7C59`, `#6B9E5E`, `#3D6B48`
- Tropical foliage: lush greens `#2D8B4E`, `#4AAF6E`, `#1D6B3A`
- Sakura pink: `#E8A0B0`, `#D4869A`, `#F0C0D0`
- Wisteria purple: `#9B7BC0`, `#B090D0`, `#7A5AA0`
- Lavender: `#8B7BB0`, `#A090C8`, `#C4B0E0`
- Rose red: `#C45060`, `#D07080`, `#E0A0A8`
- Sunflower gold: `#D4A040`, `#E4B858`, `#C49030`
- Earth/trunk: warm browns `#8B6B4A`, `#6B5038`, `#A0845C`
- Water: `#5A8AAE`, `#7AAECE`, `#4A7A9E` (for lotus pond)
- Character hair: warm red-brown `#C46B4A` (like mmguo.dev's character)
- Character skin: soft peach `#E8C4A0`
- Glow/halo: radial gradient from transparent to `rgba(43,58,103,0.4)` (the night sky circle effect)
- Particle glow: `#F0EDE8` at low opacity for fireflies, pollen, sparkles

**Canvas rendering**: 20x28 pixel grid, rendered on `<canvas>` via `requestAnimationFrame` loop, scaled to desired size. Each "pixel" is a clear, sharp square — NO anti-aliasing, NO smoothing. `image-rendering: pixelated`. Tile size reference: 1 canvas pixel = 1 grid cell (like Terraria's 16x16 tile system).

### 2.6 Animation Rules (Terraria-inspired)

**Continuous canvas animations** (via `requestAnimationFrame`):
- **Day/night sky cycle**: Background sky color shifts to match real local time. Dawn (5-7am): warm orange gradient. Day (7am-5pm): soft blue. Dusk (5-7pm): amber-purple. Night (7pm-5am): deep navy with twinkling stars. Transition is smooth (CSS-like interpolation over 30 minutes).
- **Star twinkle**: Stars pulse opacity 0.3→0.8 on staggered 3-5s sin-wave cycles. Only visible during night sky.
- **Leaf/petal particles**: Small 1-2px squares that drift downward with slight horizontal sway (sin wave). Spawned on events (question complete, bloom grow, tap interaction). Max 8 particles at once. Colors match the plant species palette.
- **Firefly particles**: 1px warm white dots (`#F0EDE8`) with glow, drifting slowly in random paths. Only visible during night. Max 4 per bloom.
- **Growth animation**: When a stage transition occurs, the plant "builds" upward over 800ms — new pixels appear bottom-to-top with a brief particle burst at completion (6-10 particles).
- **Decay animation**: Leaves slowly change from green → yellow → brown over multiple frames. Occasional leaf pixel detaches and drifts down.

**UI animations** (CSS/React):
- **Typewriter**: Text reveals character by character (40ms per char) — for AI messages and question reveals
- **Fade**: `opacity 0→1, duration 300ms` for page transitions and question changes

**Interactive** (touch/click on RelationshipBloom canvas):
- **Tap to shake**: Plant sways slightly (2px offset oscillation, 400ms), 3-5 leaf particles fall. Cooldown 2s.
- **Water effect on question complete**: Brief blue particle shower from top of canvas (like rain), plant brightens momentarily.

**What this is NOT**: The particle effects are minimal and warm — think fireflies and falling leaves, NOT confetti cannons, heart rain, or flashy game VFX. Everything should feel like watching nature.

### 2.7 Tactile Design System

The UI should feel like a physical, handcrafted object — paper texture, embossed buttons, slightly imperfect borders. This creates warmth and differentiates from slick dating apps.

**CSS Custom Properties:**
```css
:root {
  /* Paper grain overlay on page background */
  --paper-texture: url("data:image/svg+xml,..."); /* 4x4 SVG with subtle grain */
  --paper-texture-opacity: 0.15;

  /* Hand-drawn border effect */
  --hand-drawn-filter: url(#hand-drawn); /* SVG feTurbulence filter */

  /* Emboss effect for primary buttons */
  --emboss-shadow: inset 0 1px 0 rgba(255,255,255,0.4),
                   inset 0 -1px 0 rgba(0,0,0,0.06);

  /* Ink bleed on transitions */
  --ink-transition: filter 300ms ease;
}
```

**Where tactile effects apply:**

| Element | Effect |
|---|---|
| Page background | Paper grain overlay via `::after` pseudo-element, `opacity: 0.15`, `pointer-events: none` |
| Cards | Subtle paper texture at `opacity: 0.08` + slight uneven border via `--hand-drawn-filter` |
| Primary buttons | Emboss/letterpress feel via `--emboss-shadow` + `active: translateY(1px)` removes top shadow |
| Section dividers | Hand-drawn line wobble via SVG `feTurbulence` (baseFrequency 0.02) |
| Input focus | Ink spread animation — border-bottom color transition with 0.3px blur spreading outward |

**Global SVG filter** (add to app shell, hidden):
```html
<svg style="position:absolute;width:0;height:0">
  <defs>
    <filter id="hand-drawn">
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5"/>
    </filter>
  </defs>
</svg>
```

### 2.8 Micro-interaction Catalog

Warm, natural animations reinforcing the "slow dating" experience. Every interaction should feel like nature, not gamification.

| Trigger | Animation | Duration |
|---|---|---|
| Match created | Two seeds slide in from edges, merge at center, sprout | 800ms |
| Approach received | Envelope slides up from bottom, slight shake, unfolds | 500ms |
| Question transition | Old fades left+down, new slides in from right | 300ms |
| Star rating tap | Star scales 1.3x → bounces to 1x, selected stars glow | 200ms |
| Offer sent | Button → spinner → petal particles float upward | 400ms + 600ms |
| Bloom tap | Plant offsets 2px L→R→center, 3-5 leaf particles, haptic vibrate(50) | 400ms |
| Bloom stage up | Full-screen growth: plant builds bottom-to-top, particle burst | 2000ms |
| Session complete | Bloom "full bloom" burst, rating modal slides up | 800ms + 300ms |

**Animation principles:**
1. All durations ≤500ms except Bloom growth (800ms) and stage-up (2000ms)
2. Use CSS `transform` and `opacity` only (GPU composited)
3. `prefers-reduced-motion: reduce` → degrade to 150ms fade
4. Mobile haptic: `navigator.vibrate(50)` on tap/match/stage-up
5. Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for bounce
6. No animation loops except idle Bloom particles

### 2.9 What This Design AVOIDS

```
✗  Dark/black backgrounds (we use warm parchment)
✗  Neon colors, cold blues, pure whites
✗  Stock photo illustrations of happy couples
✗  Pink/purple gradient backgrounds
✗  Rounded "bubble" UI (border-radius > 2px)
✗  Heavy particle effects, confetti, heart rain (we use subtle nature particles only)
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
│ [PixelAvatar 8x8]  城市 · 25岁   │  ← Level 1 avatar (privacy)
│  (48px rendered)   ♂              │
│                                  │
│ ████████░░  85    [🌸 romantic]   │  ← fit score + compatibility_bucket
│                                  │     bucket shown as tiny species icon
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

**Match Card** (bloom_stage from API drives the plant visual):
```
┌──────────────────────────────────┐
│                                  │
│ [RelationshipBloom]   城市       │  ← Bloom 100x100, stage from bloom_stage
│   (pixel plant)       [TA发起]   │     bloom_stage: 0=seed, 1=sprout,
│ [PixelAvatar L1/L2/L3]          │     2=growth, 3=bloom, 4=full bloom
│                                  │
│  [温柔体贴] [善于倾听]           │  ← PixelAvatar level based on round:
│                                  │     L1 (8x8) → L2 (16x16) → L3 (photo)
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

**AI Recap** (shown in card after a round completes, fetched from `GET /sessions/{id}/recap`):
```
┌─ AI 回顾 ───────────────────────┐
│ 你们在第一轮聊了关于完美一天的想象。│  ← typewriter animation on first view
│ 你提到喜欢雨天在家看书，TA说最喜欢│     Inter, 13px, #4F4D4A
│ 清晨的菜市场。你们对「什么是真正的│     bg: #EDE9E3, border-left: 3px
│ 陪伴」有相似的看法。              │     solid #C4956A
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

### 5.1 PixelAvatar — Progressive Photo Unlock

Deterministic pixel portrait from userId. Functions as a **privacy layer** — identity is revealed gradually as the relationship progresses, creating anticipation.

#### 5.1.1 Three-Stage Reveal

| Stage | Trigger | Visual | Size |
|---|---|---|---|
| Level 1 | Match created | 8x8 PixelAvatar (color silhouette only) | 48px rendered |
| Level 2 | Round 1, 3 questions answered (`questions_answered_count >= 3`) | 16x16 PixelAvatar (recognizable outline) | 48px rendered |
| Level 3 | Round 1 completed | Real selfie photo | 48px |

**Where each level appears:**
- **Pool page** candidate cards: Always Level 1 (8x8) — privacy preserved
- **Inbox** approach cards: Level 1 until approach accepted
- **Pipeline** match cards: Level 1 → Level 2 → Level 3 as Round 1 progresses
- **Session** page: Uses Bloom plant, not avatar

#### 5.1.2 Pixel-to-Photo Transition Animation

When transitioning from Level 2 pixel to Level 3 real photo (Round 1 completion):

```css
.photo-reveal {
  image-rendering: pixelated;
  animation: dePixelate 800ms ease-out forwards;
}

@keyframes dePixelate {
  0%   { filter: blur(0); image-rendering: pixelated; }
  30%  { filter: blur(2px); }
  60%  { filter: blur(1px); image-rendering: auto; }
  100% { filter: blur(0); image-rendering: auto; }
}
```

The transition simulates resolution increasing: pixelated → brief blur → sharp photo. 800ms with ease-out.

#### 5.1.3 Rendering

4 warm palettes (amber, rose, forest, golden). Rendered as CSS grid of colored divs or small canvas. `image-rendering: pixelated` for crisp edges.

### 5.2 RelationshipBloom — Pixel Plant Growth Engine

Canvas pixel-art plant inspired by **Terraria's biome-specific procedural flora** + **Ghibli's warmth**. Each relationship is a unique living plant that grows, blooms, responds to touch, and reflects real time.

#### 5.2.1 Plant Species Library (v1: 12 species)

Each match is assigned a species at creation, based on the compatibility profile between two users. The `match_id` seeds deterministic variation within each species (slight branching differences, petal positions).

**Romantic Flowers:**

| ID | Name | Chinese | Growth Form | Key Visual |
|---|---|---|---|---|
| `sakura` | Cherry Blossom | 樱花 | Small tree → spreading branches → pink petal canopy | Pink petals drift down continuously |
| `rose` | Rose Bush | 玫瑰 | Thorny stem → multi-branch → layered red blooms | Deep red cross-shaped pixel flowers |
| `wisteria` | Wisteria | 紫藤 | Vine climbs upward → cascading purple flower chains | Flowers hang downward (unique!) |
| `peony` | Peony | 牡丹 | Short bush → wide layered bloom (China's flower) | Large 5x5px bloom at crown |
| `lotus` | Lotus | 莲花 | Pad on water → stem rises → single majestic bloom | Water base instead of soil, blue tones |

**Warm Nature:**

| ID | Name | Chinese | Growth Form | Key Visual |
|---|---|---|---|---|
| `oak` | Oak Tree | 橡树 | Classic tree: thick trunk → wide canopy → acorns | Widest canopy of all species |
| `sunflower` | Sunflower | 向日葵 | Single tall stem → large golden face at top | Flower "face" tracks day/night direction |
| `lavender` | Lavender Field | 薰衣草 | Multiple thin stems → purple spike clusters | 3 parallel stems, field effect |
| `dandelion` | Dandelion | 蒲公英 | Stem → yellow bloom → white puff → seeds fly away | Stage 4: seed particles drift off |

**Tropical & Whimsical:**

| ID | Name | Chinese | Growth Form | Key Visual |
|---|---|---|---|---|
| `plumeria` | Frangipani | 鸡蛋花 | Tropical tree → thick branches → 5-petal white-yellow blooms | Warm tropical palette |
| `bougainvillea` | Bougainvillea | 三角梅 | Climbing vine → explosive magenta/orange bracts | Most colorful species |
| `glow_mushroom` | Glowing Mushroom | 发光蘑菇 | Small caps → cluster → luminescent glow | Emits pixel glow aura at night (Terraria homage) |

#### 5.2.2 Species Color Palettes

Each species defines its own 5-color set used across all growth stages:

```
sakura:       ground=#8B6B4A  stem=#6B5038  leaf=#4A7C59  flower=#E8A0B0  light=#F0C0D0
rose:         ground=#6B5038  stem=#3D6B48  leaf=#4A7C59  flower=#C45060  light=#E0A0A8
wisteria:     ground=#8B6B4A  stem=#6B5038  leaf=#4A7C59  flower=#9B7BC0  light=#C4B0E0
peony:        ground=#8B6B4A  stem=#4A7C59  leaf=#6B9E5E  flower=#D4869A  light=#F0C0D0
lotus:        ground=#5A8AAE  stem=#4A7C59  leaf=#2D8B4E  flower=#F0C0D0  light=#F0EDE8
oak:          ground=#8B6B4A  stem=#6B5038  leaf=#4A7C59  flower=#C4956A  light=#FFF4E0
sunflower:    ground=#8B6B4A  stem=#4A7C59  leaf=#6B9E5E  flower=#D4A040  light=#FFFBE0
lavender:     ground=#A0845C  stem=#4A7C59  leaf=#6B9E5E  flower=#8B7BB0  light=#C4B0E0
dandelion:    ground=#8B6B4A  stem=#6B9E5E  leaf=#4A7C59  flower=#D4A040  light=#F0EDE8
plumeria:     ground=#A0845C  stem=#6B5038  leaf=#2D8B4E  flower=#F0EDE8  light=#E8D5C0
bougainvillea:ground=#8B6B4A  stem=#3D6B48  leaf=#2D8B4E  flower=#C45060  light=#D4915A
glow_mushroom:ground=#3D6B48  stem=#4A7C59  leaf=#6B9E5E  flower=#7AAECE  light=#F0EDE8
```

#### 5.2.3 Growth Stages (5 stages, same for all species)

| Stage | Name | Round | Visual Description |
|---|---|---|---|
| 0 | Seed (种子) | Just matched | 1-2px seed on soil, faint glow above |
| 1 | Sprout (萌芽) | Round 1 start | Short stem (3-5px tall), 1-2 tiny leaves |
| 2 | Growth (生长) | Round 1 done | Taller stem (7-9px), multiple leaves, species shape forming |
| 3 | Bloom (花开) | Round 2 done | Near full height, flowers appear, species fully recognizable |
| 4 | Full Bloom (繁花) | Round 3 / Confirmed | Maximum size, all flowers open, particle effects active, halo glow |

Stage transitions animate bottom-to-top (800ms) with a leaf/petal particle burst at completion.

#### 5.2.4 Day/Night Sky System

The bloom canvas background reflects **real local time** (Terraria day/night cycle):

```
Time        Sky Color                    Elements
05:00-07:00 Dawn gradient #D4915A→#87AECF  Fading stars, warm glow at horizon
07:00-17:00 Day sky #87AECF               Soft white clouds (1-2 small pixel clusters)
17:00-19:00 Dusk gradient #87AECF→#2B3A67  Orange horizon, first stars appear
19:00-05:00 Night sky #2B3A67              Stars twinkle, firefly particles
```

Transition between phases is smooth (linear interpolation over the boundary hour).

#### 5.2.5 Particle System

Lightweight particle engine running within the bloom canvas (max 12 particles):

| Particle Type | Trigger | Visual | Behavior |
|---|---|---|---|
| Leaf fall | Tap shake, decay | 1-2px in leaf color | Drift down with sin-wave sway, fade out |
| Petal drift | Sakura/rose bloom, rating | 1px in flower color | Float down slowly, slight rotation |
| Growth burst | Stage transition | Mixed leaf+flower 1px | Burst outward from crown, 6-10 particles |
| Firefly | Night time, stage 3+ | 1px warm white, glow | Slow random drift, opacity pulse |
| Dandelion seeds | Dandelion stage 4 only | 1px white with tiny line | Drift upward and outward |
| Water ripple | Lotus only | 1px blue, horizontal | Expand outward from water surface |
| Rain/water | Question complete | 1px blue `#5A8AAE` | Fall straight down from top, 4-6 drops |

#### 5.2.6 Interactive Touch

- **Tap to shake**: Plant offsets 2px left→right→center (400ms). Spawns 3-5 leaf particles. Cooldown 2s.
- **Question complete**: "Watering" animation — rain particles from top, plant brightens briefly (saturation +20% for 500ms).
- **Stage transition**: Growth animation plays, followed by growth burst particles.

#### 5.2.7 Decay System (Terraria "Corruption" inspired)

Instead of harsh grayscale, decay follows an autumn/corruption progression:

| Days Inactive | Vitality | Visual Change |
|---|---|---|
| 0-3 days | 1.0 | Full color, all particles active |
| 4-7 days | 0.65 | Leaves shift green→yellow. No fireflies. |
| 8-14 days | 0.35 | Leaves yellow→brown. Occasional leaf-fall particle (auto). Flowers close. |
| 15+ days | 0.15 | Most leaves gone. Bare branches. Soil darkens. Muted palette. |
| Closed | 0.0 | Grayscale skeleton. Ground cracks. No particles. |

#### 5.2.8 Species Assignment Logic (Backend)

When a Match is created, the backend assigns `bloom_type` based on the compatibility profile:

```
Compatibility Signal        → Species Pool
High personality overlap    → sakura, peony, rose (romantic flowers)
Strong values alignment     → oak, sunflower (warm, grounded)
Complementary traits        → wisteria, lavender (elegant contrast)
Adventurous/creative both   → bougainvillea, plumeria (tropical)
Intellectual/curious both   → glow_mushroom, dandelion (whimsical)
Fallback (no strong signal) → random from full library
```

The exact assignment is deterministic: `hash(user_a_id + user_b_id + compatibility_bucket) % species_in_pool`.

### 5.2b Pixel Plant Conversion Engine (Phase 2)

> **Goal**: Enable expanding the plant library by converting real plant photos or names into pixel-art sprite definitions compatible with the RelationshipBloom renderer.

#### Sprite Definition Format (JSON)

Every plant species is defined as a JSON sprite definition that the canvas renderer interprets:

```json
{
  "id": "sakura",
  "name": "Cherry Blossom",
  "name_zh": "樱花",
  "palette": {
    "ground": "#8B6B4A",
    "stem": "#6B5038",
    "leaf": ["#4A7C59", "#6B9E5E", "#3D6B48"],
    "flower": ["#E8A0B0", "#D4869A", "#F0C0D0"],
    "light": "#F0C0D0"
  },
  "stages": [
    {
      "stage": 0,
      "elements": [
        { "type": "seed", "x": 10, "y": 24, "color": "ground" }
      ]
    },
    {
      "stage": 1,
      "elements": [
        { "type": "stem", "points": [[10,24],[10,21]], "sway": false },
        { "type": "leaf", "anchor": [10,22], "dir": "left", "size": 1 },
        { "type": "leaf", "anchor": [10,21], "dir": "right", "size": 1 }
      ]
    },
    {
      "stage": 2,
      "elements": [
        { "type": "stem", "points": [[10,24],[10,18]], "sway": true, "variance": 1 },
        { "type": "leaf_cluster", "anchor": [10,20], "count": 4, "spread": 2 },
        { "type": "leaf_cluster", "anchor": [10,18], "count": 3, "spread": 2 },
        { "type": "flower", "anchor": [8,19], "shape": "cross", "size": 1 }
      ]
    }
  ],
  "particles": {
    "idle": { "type": "petal_drift", "rate": 0.3, "color": "flower" },
    "night": { "type": "firefly", "count": 2 }
  },
  "decay_override": null
}
```

#### Conversion Pipeline (Phase 2 implementation)

```
Input                    Process                         Output
─────────────────────────────────────────────────────────────────
Plant name (text)   →   Claude API prompt:              → JSON sprite definition
                        "Convert {name} to a 20x28       (above format)
                        pixel grid sprite definition
                        with 5 growth stages in
                        Ghibli pixel art style"

Plant photo (image) →   Claude Vision API:              → JSON sprite definition
                        "Analyze this plant. Extract
                        dominant colors, growth form,
                        leaf/flower shapes. Generate
                        a 20x28 pixel sprite definition
                        with 5 growth stages."

JSON sprite def     →   Frontend renderer validates     → Rendered canvas
                        and renders (same engine as
                        built-in species)
```

#### Admin API Endpoints (Phase 2)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/plants/generate` | Generate sprite JSON from name or image |
| GET | `/api/admin/plants` | List all plant species (built-in + custom) |
| POST | `/api/admin/plants` | Add custom plant species (validated JSON) |
| GET | `/api/admin/plants/{id}/preview` | Render preview of all 5 stages |

**Phase 1 (now)**: 12 built-in species, hardcoded in frontend as constants.
**Phase 2 (later)**: Conversion engine + admin UI + dynamic loading from backend.

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
| GET | `/api/pool` | Get ranked candidate list. Each candidate includes `compatibility_bucket` (romantic/warm/elegant/tropical/whimsical) for species preview |

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
| GET | `/api/pipeline` | Get pursuing + being_found matches (includes `bloom_type`, `bloom_stage` 0-4, `days_since_activity`, `questions_completed`) |

### Sessions
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/sessions` | Create session (triggers AI question curation) |
| GET | `/api/sessions/{id}/state` | Get live session state (poll every 3s). Includes `questions_answered_count` for progressive photo unlock |
| POST | `/api/sessions/{id}/advance` | Advance to next question (host only) |
| POST | `/api/sessions/{id}/skip` | Skip current question (host only) |
| POST | `/api/sessions/{id}/swap` | Swap current question for another (max 3) |
| POST | `/api/sessions/{id}/answer` | Save user's answer to a question |
| GET | `/api/sessions/{id}/answers` | Get user's own answers |
| POST | `/api/sessions/{id}/end` | End session with rating + advance decision. Triggers AI recap generation when both users rate. |
| GET | `/api/sessions/{id}/recap` | Get AI-generated session recap (warm summary of what was discussed). Null if not yet generated |

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

### 8.4 Photo Reveal Timeline (Progressive Unlock)
- **Pool**: 8x8 PixelAvatar only (Level 1) — privacy preserved
- **Approach accepted / Pipeline start**: Still 8x8 PixelAvatar (Level 1)
- **Round 1, 3 questions answered** (`questions_answered_count >= 3`): 16x16 PixelAvatar (Level 2) — recognizable outline
- **Round 1 complete**: Real selfie with pixel→photo dePixelate animation (Level 3, 800ms)

### 8.5 RelationshipBloom as Visual Metaphor
- Each match has a unique **plant species** (12 types: sakura, rose, wisteria, peony, lotus, oak, sunflower, lavender, dandelion, plumeria, bougainvillea, glow_mushroom)
- Species assigned by backend based on compatibility profile; `match_id` seeds deterministic variation within species
- Grows through 5 stages as rounds progress: seed → sprout → growth → bloom → full bloom
- **Day/night sky** background syncs to real local time (Terraria-inspired cycle)
- **Particle effects**: leaf fall, petal drift, fireflies (night), species-specific (dandelion seeds, lotus ripples)
- **Interactive**: tap to shake (leaf particles fall), watering animation on question complete
- **Decay**: autumn progression (green→yellow→brown→bare) instead of harsh grayscale, with auto leaf-fall particles
- Appears in: Session background (large, 15% opacity), Pipeline card (100px), Session header (56px)
- **Phase 2**: Plant Conversion Engine — add new species from photos/names via Claude Vision API

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
- **RelationshipBloom rendering**: `requestAnimationFrame` loop for continuous animation (day/night, particles, star twinkle). Pauses when canvas is off-screen (`IntersectionObserver`). Target 30fps to save battery on mobile.
- **Plant species**: 12 built-in species defined as TypeScript constants (Phase 1). Phase 2: JSON sprite definitions loaded from backend API (`GET /api/species`).
- **Day/night cycle**: Uses `new Date().getHours()` for sky color. Recalculated every 60s (not every frame).
- **Particle system**: Lightweight array of `{x, y, vx, vy, life, color}` objects updated each frame. Max 12 per bloom canvas. No external physics library.
- **Bloom renderer**: Pluggable architecture via registry pattern. v1 uses SVG renderer; interface supports future Canvas mosaic / Three.js. Entry component: `<BloomRenderer species="sakura" stage={2} vitality={0.8} size={100} />`
- **Tactile design**: Paper texture SVG overlay, hand-drawn border SVG filter (`feTurbulence`), emboss shadows on buttons. See Section 2.7.
- **Micro-interactions**: CSS transform + opacity only. `prefers-reduced-motion` respected. See Section 2.8.
- **AI Recap**: Fetched from `GET /sessions/{id}/recap`. Displayed in Pipeline card with typewriter animation.
- **All UI text in Chinese**
- **No SSR**: Pure client-side SPA

### Component Structure (Recommended)

```
src/
  components/
    bloom/
      BloomRenderer.tsx          <- Unified entry, selects renderer by prop
      types.ts                   <- BloomProps, RendererInterface, SpeciesDefinition
      useBloomAnimation.ts       <- Day/night cycle + particle hook
      renderers/
        svg/
          SvgBloomRenderer.tsx   <- v1 main renderer
          SvgTree.tsx            <- Trunk + branches SVG paths
          SvgCanopy.tsx          <- Flower clusters with watercolor filter
          SvgParticles.tsx       <- Animated SVG particles
          SvgSky.tsx             <- Day/night sky gradient
        registry.ts              <- Renderer registration
      species/
        index.ts                 <- Re-exports all 12 species
        sakura.ts, rose.ts ...   <- SpeciesDefinition per species
    avatar/
      PixelAvatar.tsx            <- Deterministic 8x8/16x16 pixel face
      PhotoReveal.tsx            <- Pixel->photo transition (dePixelate)
    ui/
      TactileCard.tsx            <- Card with paper texture overlay
      ParchmentButton.tsx        <- Primary button with emboss shadow
      HandDrawnDivider.tsx       <- Section divider with SVG wobble filter
      PaperBackground.tsx        <- Page-level paper grain background
```
