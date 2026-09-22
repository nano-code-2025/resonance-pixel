# Resonance UI Optimization & Product Roadmap

> Based on 2026 design trend research. This is an **addendum** to the existing UI spec (`docs/frontend-design-spec.md`), not a replacement. The existing spec remains the source of truth for v0.dev generation; this document defines upgrades, architecture changes, and product opportunities.

**Goal:** Evolve Resonance's visual identity from "simple pixel art app" to "Ghibli warm tactile experience" — leveraging 2026 trends (Tech-Organic fusion, Lo-fi pixel accents, Tactile Design, Post-AI authenticity) while maintaining the parchment warmth that differentiates Resonance from every mainstream dating app.

**Key Decisions:**
- v1 renderer: SVG only, with interface designed for future mosaic/Three.js
- Pixel art repositioned from primary visual to accent/privacy layer
- Tactile paper textures and micro-interactions added throughout
- Product roadmap extends into voice, AI recaps, and relationship timelines

---

## Layer 1: Visual System Upgrade

### 1.1 Renderer Registry Architecture

A pluggable rendering system where the visual engine (SVG, Canvas mosaic, Three.js) is swapped without touching business logic.

#### Core Interface

```typescript
// components/bloom/types.ts

export interface BloomProps {
  species: string       // 'sakura' | 'rose' | 'oak' | ...
  stage: number         // 0-4
  vitality: number      // 0-1 (decay factor)
  size: number          // px
  interactive?: boolean // tap-to-shake enabled
  onTap?: () => void
}

export interface BloomRenderer {
  render(container: HTMLElement, props: BloomProps): void
  update(props: Partial<BloomProps>): void
  destroy(): void
}

export interface SpeciesDefinition {
  id: string
  name: string
  name_zh: string
  palette: {
    ground: string
    stem: string[]
    leaf: string[]
    flower: string[]
    particle: string
    light: string
  }
  growth: {
    maxHeight: number   // 0-1, relative to canvas
    spread: number      // 0-1, canopy width ratio
    trunkWidth: number  // 0-1
  }
  particles: {
    idle: 'petal_drift' | 'leaf_fall' | 'seed_float' | 'ripple' | 'none'
    night: 'firefly' | 'glow' | 'none'
    bloom: 'burst' | 'rain' | 'none'
  }
  decay_colors?: {
    stage1_leaf: string  // green → yellow
    stage2_leaf: string  // yellow → brown
  }
}
```

#### Registry Pattern

```typescript
// components/bloom/renderers/registry.ts

type RendererFactory = (container: HTMLElement) => BloomRenderer

const renderers = new Map<string, RendererFactory>()

export function registerRenderer(name: string, factory: RendererFactory) {
  renderers.set(name, factory)
}

export function createRenderer(name: string, container: HTMLElement): BloomRenderer {
  const factory = renderers.get(name)
  if (!factory) throw new Error(`Unknown renderer: ${name}`)
  return factory(container)
}
```

#### Unified Entry Component

```tsx
// components/bloom/BloomRenderer.tsx

import { useRef, useEffect } from 'react'
import { createRenderer } from './renderers/registry'
import type { BloomProps } from './types'

interface Props extends BloomProps {
  renderer?: string // 'svg' | 'mosaic' | 'threejs' — default 'svg'
}

export function BloomRenderer({ renderer = 'svg', ...props }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<BloomRenderer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    rendererRef.current = createRenderer(renderer, containerRef.current)
    rendererRef.current.render(containerRef.current, props)
    return () => rendererRef.current?.destroy()
  }, [renderer])

  useEffect(() => {
    rendererRef.current?.update(props)
  }, [props.stage, props.vitality, props.species])

  return <div ref={containerRef} style={{ width: props.size, height: props.size }} />
}
```

#### Species Data (Shared Across All Renderers)

```typescript
// components/bloom/species/sakura.ts
import type { SpeciesDefinition } from '../types'

export const sakura: SpeciesDefinition = {
  id: 'sakura',
  name: 'Cherry Blossom',
  name_zh: '樱花',
  palette: {
    ground: '#8B6B4A',
    stem: ['#6B5038', '#8B6B4A', '#5A4030'],
    leaf: ['#4A7C59', '#6B9E5E', '#3D6B48'],
    flower: ['#E8A0B0', '#D4869A', '#F0C0D0'],
    particle: '#F0C0D0',
    light: '#F0C0D0',
  },
  growth: { maxHeight: 0.75, spread: 0.6, trunkWidth: 0.08 },
  particles: { idle: 'petal_drift', night: 'firefly', bloom: 'burst' },
}
```

All 12 species follow this format. The existing palette table from the UI spec maps directly into `SpeciesDefinition.palette`.

#### Phasing

| Phase | Renderer | Status |
|---|---|---|
| v1 | SVG (`SvgBloomRenderer`) | Implement now |
| v1.1 | Canvas Mosaic (`MosaicRenderer`) | Interface ready, implement later |
| v2 | Three.js (`ThreeRenderer`) | Interface ready, implement later |

v1 hardcodes `renderer='svg'`. The prop exists so Phase 2+ can switch per-user via `User.preferences.renderer`.

### 1.2 Tactile Design System

Adds paper/handcraft textures to the existing parchment theme, making the UI feel like a physical object.

#### New CSS Custom Properties

```css
:root {
  /* Paper texture — SVG noise overlay */
  --paper-texture: url("data:image/svg+xml,..."); /* 4x4 SVG with subtle grain */
  --paper-texture-opacity: 0.15;

  /* Hand-drawn border effect */
  --hand-drawn-filter: url(#hand-drawn); /* SVG feTurbulence filter */

  /* Emboss effect for buttons */
  --emboss-shadow: inset 0 1px 0 rgba(255,255,255,0.4),
                   inset 0 -1px 0 rgba(0,0,0,0.06);

  /* Ink bleed on transitions */
  --ink-transition: filter 300ms ease;
}
```

#### Where Tactile Effects Apply

| Element | Effect | Implementation |
|---|---|---|
| Page background | Paper grain overlay | `::after` pseudo-element with `--paper-texture`, `opacity: 0.15`, `pointer-events: none` |
| Cards | Subtle paper texture + slight uneven border | `--paper-texture` at `opacity: 0.08` + `--hand-drawn-filter` on border |
| Primary buttons | Emboss/letterpress feel | `--emboss-shadow` + `active: translateY(1px)` removes top shadow |
| Section dividers | Hand-drawn line wobble | SVG `feTurbulence` (baseFrequency 0.02) applied to the `<hr>` |
| Input focus | Ink spread animation | Border-bottom color transition with 0.3px blur spreading outward |

#### SVG Filter Definition (Global)

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

This filter is subtle — 1.5px displacement creates a "slightly uneven" edge without looking broken. Applied to card borders and dividers only.

### 1.3 PixelAvatar as Privacy Accent

Pixel art is repositioned from the app's primary visual to a **privacy-protection design language**. It signals "identity hidden" and creates anticipation for photo reveal.

#### Progressive Photo Unlock (3 Stages)

| Stage | Trigger | Visual | Size |
|---|---|---|---|
| Level 1 | Match created | 8x8 PixelAvatar (color silhouette only) | 48px rendered |
| Level 2 | Round 1, 3 questions completed | 16x16 PixelAvatar (recognizable outline) | 48px rendered |
| Level 3 | Round 1 completed | Real selfie photo | 48px |

#### Pixel-to-Photo Transition Animation

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

The transition simulates resolution increasing: pixelated → brief blur → sharp photo. Takes 800ms with ease-out.

#### Where PixelAvatar Appears

- **Pool page** candidate cards: Always Level 1 (8x8)
- **Inbox** approach cards: Level 1 until approach accepted
- **Pipeline** match cards: Level 1 → Level 2 → Level 3 as Round 1 progresses
- **Session** page: Uses Bloom plant, not avatar

### 1.4 Micro-interaction Specification

Warm, natural-feeling animations that reinforce the "slow dating" experience. Every interaction should feel like nature, not gamification.

#### Interaction Catalog

| Trigger | Animation | Duration | Technical |
|---|---|---|---|
| **Match created** | Two seeds slide in from screen edges, merge at center, sprout animation | 800ms | CSS transform + opacity sequence |
| **Approach received** | Envelope slides up from bottom, slight shake, unfolds | 500ms | CSS translateY + rotate keyframes |
| **Question transition** | Old question fades left+down, new slides in from right | 300ms | CSS transform + opacity, staggered 50ms |
| **Star rating tap** | Star scales up 1.3x → bounces back to 1x, selected stars glow | 200ms | CSS scale + box-shadow transition |
| **Offer sent** | Button → loading spinner → petal particles float upward from button position | 400ms + 600ms particles | CSS + JS particle spawn |
| **Bloom tap** | Plant offsets 2px L→R→center, 3-5 leaf particles, haptic vibrate(50) | 400ms | CSS transform + JS particles + Vibration API |
| **Bloom stage up** | Full-screen growth animation: plant builds bottom-to-top, particle burst at completion | 2000ms | Bloom renderer handles internally |
| **Session complete** | Bloom does a "full bloom" burst, rating modal slides up from bottom | 800ms + 300ms | Sequential: bloom first, then modal |

#### Animation Principles

1. All durations ≤ 500ms except Bloom growth (800ms) and stage-up celebration (2000ms)
2. Use CSS `transform` and `opacity` only (GPU composited, no layout thrash)
3. `prefers-reduced-motion: reduce` → all animations degrade to simple 150ms fade
4. Mobile haptic feedback (`navigator.vibrate`) accompanies physical-feeling interactions (tap, match, stage-up)
5. No animation plays more than once per user action (no loops except idle Bloom particles)
6. Spring easing for interactive elements: `cubic-bezier(0.34, 1.56, 0.64, 1)` for bounce feel

---

## Layer 2: Project Architecture Improvements

### 2.1 Frontend Component Structure

```
src/
  components/
    bloom/
      BloomRenderer.tsx          ← Unified entry (see 1.1)
      types.ts                   ← BloomProps, RendererInterface, SpeciesDefinition
      useBloomAnimation.ts       ← Day/night cycle + particle hook
      useDayNight.ts             ← Real-time sky color (recalc every 60s)
      renderers/
        svg/
          SvgBloomRenderer.tsx   ← v1 main renderer
          SvgTree.tsx            ← Trunk + branches SVG paths
          SvgCanopy.tsx          ← Flower cluster circles with watercolor filter
          SvgParticles.tsx       ← Animated SVG particles (petals, fireflies)
          SvgSky.tsx             ← Day/night sky gradient background
        registry.ts              ← Renderer registration
      species/
        index.ts                 ← Re-exports all 12 species
        sakura.ts, rose.ts, wisteria.ts, peony.ts, lotus.ts,
        oak.ts, sunflower.ts, lavender.ts, dandelion.ts,
        plumeria.ts, bougainvillea.ts, glow_mushroom.ts
    avatar/
      PixelAvatar.tsx            ← Deterministic 8x8/16x16 pixel face from userId
      PhotoReveal.tsx            ← Pixel→photo transition component
    ui/
      TactileCard.tsx            ← Card with paper texture overlay
      ParchmentButton.tsx        ← Primary button with emboss shadow
      HandDrawnDivider.tsx       ← Section divider with SVG wobble filter
      PaperBackground.tsx        ← Page-level paper grain background
```

### 2.2 Backend API Changes

#### New Endpoints

| Method | Path | Purpose | Priority |
|---|---|---|---|
| GET | `/api/species` | Return all 12 plant species definitions (palette, growth params). Phase 2: include custom plants. | P2 (v1 uses frontend constants) |
| PUT | `/api/profile/preferences` | Store user preferences (renderer choice, theme). Body: `{"renderer": "svg", "theme": "parchment"}` | P2 |
| GET | `/api/sessions/{id}/recap` | Return AI-generated session recap summary. Generated on session end, stored in existing `ai_recap` field. | P1 |

#### Existing Endpoint Modifications

| Endpoint | Change | Priority |
|---|---|---|
| `GET /api/pipeline` | Add `bloom_stage` (int 0-4) to each match entry. Computed: `min(current_round, 4)` adjusted by session completion. | P0 |
| `GET /api/pool` | Add `compatibility_bucket` (string) to each candidate. Values: `romantic`, `warm`, `elegant`, `tropical`, `whimsical`. Used by frontend to preview potential bloom species. | P1 |
| `GET /api/sessions/{id}/state` | Add `questions_answered_count` (int) for current user. Needed for progressive photo unlock (Level 2 triggers at 3 answers). | P0 |

#### Bloom Stage Calculation Logic

```python
def compute_bloom_stage(match, current_session) -> int:
    """Compute bloom growth stage from match state.

    Maps to UI spec Section 5.2.3:
      stage 0 = seed (just matched, no session yet)
      stage 1 = sprout (round 1 in progress)
      stage 2 = growth (round 1 completed)
      stage 3 = bloom (round 2 completed)
      stage 4 = full bloom (round 3 completed or confirmed)
    """
    if match.status == 'confirmed':
        return 4
    # Base: number of completed rounds (current_round - 1)
    completed_rounds = match.current_round - 1  # 0, 1, or 2
    # If current round's session is completed, count it too
    if current_session and current_session.completed_at:
        completed_rounds += 1
    # stage 0 = no completed rounds & no active session
    if completed_rounds == 0 and not current_session:
        return 0
    # stage maps: 0 completed -> 1 (sprout), 1 -> 2 (growth), 2 -> 3 (bloom), 3 -> 4
    return min(completed_rounds + 1, 4) if current_session else min(completed_rounds + 1, 4)
```

### 2.3 Data Model Changes

```python
# User table — add preferences column
preferences: Mapped[Optional[dict]] = mapped_column(JSON, default=None)
# Example: {"renderer": "svg", "theme": "parchment", "haptic": true}

# No new tables needed.
# Match.bloom_stage can be computed from current_round + session state (no column needed).
# Session.ai_recap column already exists — needs generation logic implementation.
```

#### AI Recap Generation (Session End Hook)

When both users have rated a session (`session.advance_a is not None and session.advance_b is not None`), trigger recap generation:

```python
async def generate_session_recap(session_id: str, db: AsyncSession):
    """Generate AI recap from both users' answers."""
    answers = await db.execute(
        select(QuestionAnswer)
        .where(QuestionAnswer.session_id == session_id)
        .order_by(QuestionAnswer.question_id)
    )
    all_answers = answers.scalars().all()
    if not all_answers:
        return

    # Group by question, format for Claude
    prompt = build_recap_prompt(all_answers)
    recap = await call_claude_haiku(prompt)

    session = await db.get(Session, session_id)
    session.ai_recap = recap[:2000]
    await db.commit()
```

---

## Layer 3: Product Roadmap

### P0 — v1 Must-Have

#### Progressive Photo Unlock

Enhance the existing "photo reveals after Round 1" with 3-level progressive unlock:

- **Level 1** (match created): 8x8 PixelAvatar — color silhouette only
- **Level 2** (Round 1, 3 questions answered): 16x16 PixelAvatar — recognizable outline
- **Level 3** (Round 1 complete): Real selfie with pixel→photo transition animation (800ms)

Frontend logic: check `questions_answered_count` from session state to determine current reveal level. No backend changes beyond adding the count to the session state endpoint.

### P1 — v1.1 Fast Follow

#### Session AI Recap

After each round completes, Claude Haiku generates a warm recap visible only to the writer:
- Based on both users' answers to the round's questions
- Tone: warm, observational, encouraging — like a friend summarizing what happened
- Stored in existing `Session.ai_recap` field (max 2000 chars)
- Displayed in Pipeline card with typewriter animation
- Endpoint: `GET /api/sessions/{id}/recap`

#### Bloom Interaction Enhancement

- **Watering reminder**: Push notification after 3 days of inactivity — "你的樱花有点渴了"
- **Stage-up celebration**: Full-screen Bloom growth animation (2s) when stage transitions
- **Bloom screenshot sharing**: User can share their plant image to social media (no partner info)
- **Seasonal decoration**: Bloom background changes with real-world season (spring flowers, summer green, autumn gold, winter snow) — CSS variables toggled by `new Date().getMonth()`

### P2 — v2 Planning

#### Voice Elements

- **Voice answer**: Optional 60s voice recording for session questions (self-replay only)
- **Voice icebreaker**: Premium approach tier includes 15s voice intro
- Implementation: `MediaRecorder` API + COS storage
- New model: `VoiceClip(id, session_id, user_id, question_id, cos_url, duration_seconds)`

#### Relationship Timeline

- Visual timeline in Pipeline showing the full journey with a match
- Nodes: match created → each session → ratings → offer
- Each node shows: Bloom snapshot at that stage + AI recap excerpt
- Optional private notes at each node ("今天聊完感觉很安心")
- After relationship confirmed, full timeline becomes a shared keepsake

### P3 — Future

#### Theme System

CSS variable-based theme switching:
- **Parchment** (default): Current warm `#F3F1ED` palette
- **Deep Forest**: Dark green `#1A2F1A` + warm brown accents — night-reading mode
- **Paper White**: Clean `#FFFFFF` + gray accents — minimalist mode
- Theme only affects UI chrome, not Bloom rendering (Bloom always uses its own sky/palette)
- Stored in `User.preferences.theme`, applied via `data-theme` attribute on `<html>`

---

## Design Trend Justification

Each design decision maps to a verified 2026 trend:

| Decision | Trend | Source |
|---|---|---|
| Parchment warm palette | Ghibli aesthetic (50M+ images generated by Feb 2026) | BestPhoto AI Trends Report |
| Paper texture overlay | Tactile Design — "paper-like textures making designs feel warm and tangible" | Illustration Trends 2026 |
| SVG illustration primary | Neo-Traditionalism — "hybrid ink/watercolor with digital finishes" | GetIllustrations 2026 |
| Pixel art as accent | Lo-fi Pixel Aesthetics — "pixelated fonts and chunky graphics paired with contemporary layouts" | AI Aesthetics 2026 |
| Monospace headings | Technical Mono / Code Brutalism — "monospaced typography for headings" | AI Aesthetics 2026 |
| Micro-interactions | "Microinteractions designed to feel supportive, not distracting, enhancing emotional comfort" | Dating App UX 2026 |
| Progressive photo unlock | Slow dating — "photos remain blurred until users exchange interactions" | Jeter AI Dating Trends |
| Voice elements (P2) | "Voice-based matching apps matching on vocal warmth and sincerity" | Jeter AI Dating Trends |
| Renderer plug-in architecture | "3D Meets Flat Design — blending 3D with flat vectors" as emerging pattern | Illustration Trends 2026 |

---

## Migration Strategy

The existing UI spec (`docs/frontend-design-spec.md`) remains unchanged and is used for v0.dev generation. This optimization document defines incremental upgrades applied **after** the base frontend is generated.

**Order of implementation:**
1. Generate base frontend from existing UI spec via v0.dev
2. Add tactile design system (CSS variables + paper texture)
3. Implement BloomRenderer with SVG renderer
4. Add micro-interactions
5. Implement PixelAvatar progressive unlock
6. Backend: add bloom_stage, questions_answered_count, recap generation
7. Product features (P1/P2/P3) as separate sprints
