# Frontend Visual Core + Robustness Design

> Date: 2026-06-14
> Scope: RelationshipBloom species rendering, PixelAvatar progressive unlock, Toast notifications, loading states

---

## 1. RelationshipBloom — 12 Species Visual Differentiation

### Problem

All 12 plant species currently render identically (one stem + a few leaves + cross-shaped flowers), differentiated only by color palette. Three species (wisteria, lotus, glow_mushroom) have minimal special handling.

### Solution

Add a `SPECIES_SHAPES` configuration object in `RelationshipBloom.tsx`. Each species defines shape parameters that the existing canvas draw loop consumes.

### Species Shape Config

```ts
interface SpeciesShape {
  stemStyle: 'straight' | 'curved' | 'thick' | 'multi'
  leafPattern: 'alternate' | 'cluster' | 'drooping' | 'pad' | 'none'
  flowerShape: 'none' | 'cross' | 'round5' | 'layered' | 'disc' | 'spike' | 'puff' | 'umbrella' | 'triangle'
  flowerCount: { stage3: number; stage4: number }
  specialElement?: 'thorns' | 'water' | 'chains' | 'glow' | 'scatter'
}
```

When `flowerShape` is `'none'` or `flowerCount` is 0 for the current stage, skip flower rendering entirely.

### Per-Species Visual Traits

| Species | stemStyle | leafPattern | flowerShape | flowerCount (s3/s4) | specialElement | Key Visual |
|---------|-----------|-------------|-------------|---------------------|----------------|------------|
| sakura | curved | alternate | round5 | 5/8 | scatter | 5-petal pink flowers scattered across canopy, petal-fall particles |
| rose | straight | alternate | layered | 2/3 | thorns | Layered circular flowers, 1px thorn bumps on stem |
| wisteria | thick | cluster | spike | 3/5 | chains | Hanging flower chains (already partial) |
| peony | curved | cluster | layered | 1/2 | - | Large 3x3 layered ball flowers |
| lotus | straight | pad | round5 | 1/2 | water | Short stem, lily pad leaves, water surface overlay |
| oak | thick | cluster | none | 0/0 | - | 2px wide trunk, large rounded canopy silhouette, no flowers |
| sunflower | straight | alternate | disc | 1/1 | - | Thick straight stem, 3x3 yellow disc with brown center |
| lavender | multi | alternate | spike | 3/5 | - | 3 thin stems, each topped with vertical purple dot sequence |
| dandelion | straight | alternate | puff | 1/1 | scatter | Spherical puff (cross + diagonals), stage 4 scatter particles |
| plumeria | thick | cluster | round5 | 3/5 | - | Thick forking trunk, white 5-petal flowers at branch tips |
| bougainvillea | curved | cluster | triangle | 4/7 | - | Climbing curved stem, triangular bract shapes instead of petals |
| glow_mushroom | straight | none | umbrella | 1/2 | glow | Short thick stem, dome cap, night radial glow (already partial) |

### Rendering Approach

Refactor the `stage >= 1` drawing block into a dispatch based on `SPECIES_SHAPES[bloomType]`:

1. **Stem**: switch on `stemStyle` — `straight` draws single column, `curved` adds sin-wave offset, `thick` draws 2px wide, `multi` draws 3 parallel stems
2. **Leaves**: switch on `leafPattern` — `alternate` (current behavior), `cluster` (grouped at top), `drooping` (hang below branches), `pad` (horizontal ovals at base), `none` (skip)
3. **Flowers**: switch on `flowerShape` — each shape is a small drawing function (5-15 lines) that renders at given positions
4. **Special elements**: applied after flowers — thorns add 1px bumps to stem, water adds blue overlay, etc.

### Files Changed

- `frontend/components/resonance/RelationshipBloom.tsx` — add `SPECIES_SHAPES`, refactor draw logic

---

## 2. PixelAvatar — Progressive Photo Unlock

### Problem

PixelAvatar only renders a fixed 8x8 pixel grid. No 16x16 mode, no real photo display, no transition animation. The "the more you know, the clearer they become" metaphor is not implemented.

### Solution

Add a `level` prop to PixelAvatar with 3 unlock stages, triggered by `questions_completed` (the field available on `PipelineMatch`).

### Unlock Levels

| Level | Trigger | Rendering |
|-------|---------|-----------|
| 1 | questions_completed 0-2 | 8x8 pixel grid (current, unchanged) |
| 2 | questions_completed 3-4 | 16x16 pixel grid (same deterministic algorithm, doubled resolution) |
| 3 | questions_completed 5+ | Real photo from `selfie_url`; fallback to 16x16 if no photo |

### Transition Animation

When `level` changes, apply a CSS blur transition:
- Start with `filter: blur(8px)`, animate to `blur(0)` over 800ms
- Use `useEffect` watching `level` to trigger a `transitioning` state
- CSS transition on the filter property

### Component Interface Change

```ts
interface PixelAvatarProps {
  userId: string
  size?: number
  className?: string
  level?: 1 | 2 | 3       // new — defaults to 1
  selfieUrl?: string | null // new — used when level=3
}
```

### 16x16 Grid Generation

Extend `generatePixelGrid` to accept a `gridSize` parameter (8 or 16). For 16x16:
- Generate left 8 columns, mirror to right 8
- Adjust `fillBias` center: `distFromCenter = Math.abs(col - 3.5)` (half of 8 unique cols)
- Scale row-based logic: "hair" region is `row < 4` (was `row < 2` for 8x8)
- Use different seed offset (`seed + 1000`) so the 16x16 grid is not a scaled copy of 8x8 but a higher-detail version

### Integration Points

| Page | Level Calculation |
|------|-------------------|
| PoolPage | Always level 1 (no conversation yet) |
| InboxPage | Always level 1 (approach stage) |
| PipelinePage MatchCard | `match.questions_completed`: 0-2 -> 1, 3-4 -> 2, 5+ -> 3 |

**Note on selfie_url**: The current `PipelineMatch` API response does not include `selfie_url` for the other user. Until the backend adds this field, level 3 will always fallback to the 16x16 grid. This is acceptable for MVP — the visual progression from 8x8 to 16x16 already delivers the core metaphor. Backend `selfie_url` support is a follow-up task.

### Accessibility

Respect `prefers-reduced-motion`: when enabled, skip the blur transition and switch levels instantly.

### Rendering Notes

- Levels 1-2: render via CSS grid of `<div>` elements (current approach, scaled to grid size)
- Level 3: render via `<img>` tag with `object-fit: cover` when `selfieUrl` is available; otherwise render 16x16 grid
- The blur transition CSS (`filter` property) works on both element types

### Files Changed

- `frontend/components/resonance/PixelAvatar.tsx` — add level prop, 16x16 grid, photo mode, blur transition
- `frontend/components/resonance/PipelinePage.tsx` — compute and pass level to PixelAvatar

---

## 3. Global Toast Notifications

### Problem

API failures are silently swallowed (empty `catch` blocks). Users get no feedback when operations fail.

### Solution

A global Toast component driven by Zustand store state.

### Store Addition

```ts
// In AppStore interface
toastMessage: string | null
toastType: 'error' | 'success'
showToast: (message: string, type?: 'error' | 'success') => void
dismissToast: () => void
```

`showToast` sets the message and auto-clears after 3 seconds via `setTimeout`. Each call clears any existing timeout before setting a new one (store a `toastTimeoutId` to avoid premature dismissal when multiple toasts fire in sequence).

### Toast Component Design

- Position: fixed top center, `z-index: 1000`
- Animation: slide down from `translateY(-100%)` to `translateY(0)`, 300ms ease-out
- Style: `#FBF9F6` background, `1px solid #C5C1BB` border, IBM Plex Mono 12px
- Color coding: 3px left border — `#C75B5B` for error, `#5A9E6F` for success
- Auto-dismiss: 3 seconds, no manual close needed
- Max width: 320px (matches app column width)

### Toast Integration Map

| Page | Catch Location | Message |
|------|---------------|---------|
| PoolPage | getPool() fails | "无法加载候选人，使用离线数据" |
| PoolPage (ApproachModal) | sendApproach() fails | Keep existing inline error display; do NOT add toast (avoid duplicate) |
| InboxPage | getReceivedApproaches() fails | "无法加载收到的心意" |
| PipelinePage | getPipeline() fails | "无法加载连接列表" |
| PipelinePage | voteFormat() fails | "操作失败，请稍后重试" |
| PipelinePage | createSession() fails | "创建会话失败，请重试" |
| SessionPage | saveAnswer() fails | "提交失败，请重试" |
| SessionPage | endSession() fails | "结束会话失败，请重试" |

### Files Changed

- `frontend/lib/store.ts` — add toast state + actions
- `frontend/components/resonance/Toast.tsx` — new file
- `frontend/components/resonance/ResonanceApp.tsx` — render Toast
- `frontend/components/resonance/PoolPage.tsx` — add showToast calls
- `frontend/components/resonance/InboxPage.tsx` — add showToast calls
- `frontend/components/resonance/PipelinePage.tsx` — add showToast calls
- `frontend/components/resonance/SessionPage.tsx` — add showToast calls

---

## 4. Loading State Improvement

### Problem

Loading states show plain text "加载中..." which feels flat.

### Solution

Replace with a pulsing dot animation (3 dots) in all pages.

### CSS Animation

Add to `globals.css`:

```css
@keyframes pulse-dots {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
.loading-dots span {
  animation: pulse-dots 1.4s infinite ease-in-out both;
}
.loading-dots span:nth-child(2) { animation-delay: 0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0.32s; }
```

### Loading Component

Inline JSX pattern (not a separate component — used in 3 places):

```tsx
<div className="loading-dots" style={{ color: '#C4956A', fontSize: 20, letterSpacing: 4 }}>
  <span>.</span><span>.</span><span>.</span>
</div>
```

### Files Changed

- `frontend/app/globals.css` — add pulse-dots keyframes
- `frontend/components/resonance/PoolPage.tsx` — replace loading text
- `frontend/components/resonance/InboxPage.tsx` — replace loading text
- `frontend/components/resonance/PipelinePage.tsx` — replace loading text

---

## 5. Summary of All File Changes

| File | Changes |
|------|---------|
| `RelationshipBloom.tsx` | Add SPECIES_SHAPES config, refactor draw loop for species-specific rendering |
| `PixelAvatar.tsx` | Add level prop, 16x16 grid generation, photo mode, blur transition |
| `Toast.tsx` | New file — global toast notification component |
| `store.ts` | Add toast state/actions |
| `ResonanceApp.tsx` | Render Toast component |
| `globals.css` | Add pulse-dots animation keyframes |
| `PoolPage.tsx` | Loading dots, showToast on API errors |
| `InboxPage.tsx` | Loading dots, showToast on API errors |
| `PipelinePage.tsx` | Loading dots, showToast, pass level to PixelAvatar |
| `SessionPage.tsx` | showToast on API errors |

Total: 10 files (1 new, 9 modified)
