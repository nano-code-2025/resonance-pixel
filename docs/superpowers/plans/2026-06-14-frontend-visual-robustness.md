# Frontend Visual Core + Robustness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 12 RelationshipBloom plant species visually distinct, add progressive photo unlock to PixelAvatar, and add global Toast + loading animations.

**Architecture:** Extend existing canvas renderer with per-species shape configs (no rewrite). Add level-based rendering to PixelAvatar with CSS blur transitions. Add Zustand-driven Toast component mounted in app shell.

**Tech Stack:** React 19, TypeScript, Canvas API, Zustand, CSS animations, Next.js 16

**Spec:** `docs/superpowers/specs/2026-06-14-frontend-visual-robustness-design.md`

---

### Task 1: Add SPECIES_SHAPES config to RelationshipBloom

**Files:**
- Modify: `frontend/components/resonance/RelationshipBloom.tsx:1-5`

- [ ] **Step 1: Add the SpeciesShape interface and SPECIES_SHAPES constant**

Insert after the `Particle` interface (line 16), before `RelationshipBloomProps`:

```ts
type StemStyle = 'straight' | 'curved' | 'thick' | 'multi'
type LeafPattern = 'alternate' | 'cluster' | 'drooping' | 'pad' | 'none'
type FlowerShape = 'none' | 'cross' | 'round5' | 'layered' | 'disc' | 'spike' | 'puff' | 'umbrella' | 'triangle'

interface SpeciesShape {
  stemStyle: StemStyle
  leafPattern: LeafPattern
  flowerShape: FlowerShape
  flowerCount: { stage3: number; stage4: number }
  specialElement?: 'thorns' | 'water' | 'chains' | 'glow' | 'scatter'
}

const SPECIES_SHAPES: Record<BloomType, SpeciesShape> = {
  sakura:        { stemStyle: 'curved',   leafPattern: 'alternate', flowerShape: 'round5',   flowerCount: { stage3: 5, stage4: 8 },  specialElement: 'scatter' },
  rose:          { stemStyle: 'straight', leafPattern: 'alternate', flowerShape: 'layered',  flowerCount: { stage3: 2, stage4: 3 },  specialElement: 'thorns' },
  wisteria:      { stemStyle: 'thick',    leafPattern: 'cluster',   flowerShape: 'spike',    flowerCount: { stage3: 3, stage4: 5 },  specialElement: 'chains' },
  peony:         { stemStyle: 'curved',   leafPattern: 'cluster',   flowerShape: 'layered',  flowerCount: { stage3: 1, stage4: 2 } },
  lotus:         { stemStyle: 'straight', leafPattern: 'pad',       flowerShape: 'round5',   flowerCount: { stage3: 1, stage4: 2 },  specialElement: 'water' },
  oak:           { stemStyle: 'thick',    leafPattern: 'cluster',   flowerShape: 'none',     flowerCount: { stage3: 0, stage4: 0 } },
  sunflower:     { stemStyle: 'straight', leafPattern: 'alternate', flowerShape: 'disc',     flowerCount: { stage3: 1, stage4: 1 } },
  lavender:      { stemStyle: 'multi',    leafPattern: 'alternate', flowerShape: 'spike',    flowerCount: { stage3: 3, stage4: 5 } },
  dandelion:     { stemStyle: 'straight', leafPattern: 'alternate', flowerShape: 'puff',     flowerCount: { stage3: 1, stage4: 1 },  specialElement: 'scatter' },
  plumeria:      { stemStyle: 'thick',    leafPattern: 'cluster',   flowerShape: 'round5',   flowerCount: { stage3: 3, stage4: 5 } },
  bougainvillea: { stemStyle: 'curved',   leafPattern: 'cluster',   flowerShape: 'triangle', flowerCount: { stage3: 4, stage4: 7 } },
  glow_mushroom: { stemStyle: 'straight', leafPattern: 'none',      flowerShape: 'umbrella', flowerCount: { stage3: 1, stage4: 2 },  specialElement: 'glow' },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd D:/software/google_drive_backup/resonance/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors related to SPECIES_SHAPES

- [ ] **Step 3: Commit**

```bash
git add frontend/components/resonance/RelationshipBloom.tsx
git commit -m "feat(bloom): add SPECIES_SHAPES config for 12 plant species"
```

---

### Task 2: Refactor stem drawing to use stemStyle

**Note:** Tasks 2-5 all modify the same `if (stage >= 1) { ... }` block in RelationshipBloom.tsx. All line numbers reference the ORIGINAL file before any task is applied. Use content anchors (comments, code patterns) to locate the replacement points, not line numbers.

**Files:**
- Modify: `frontend/components/resonance/RelationshipBloom.tsx`

- [ ] **Step 1: Replace the stem drawing block**

Find the `if (stage >= 1) {` block. Replace the stem drawing section (from `// Sprout` through the stem `for` loop, ending before `// Leaves`) with:

```ts
    if (stage >= 1) {
      const shape = SPECIES_SHAPES[bloomType]
      const stemHeight = stage === 1 ? 4 : stage === 2 ? 7 : stage >= 3 ? 12 : 4
      const swayX = stage >= 2 ? Math.sin(t * 0.8) * 0.3 : 0

      // Stem
      const drawStem = () => {
        switch (shape.stemStyle) {
          case 'thick':
            for (let y = 0; y < stemHeight; y++) {
              const sx = cx + swayX * (y / stemHeight)
              px(sx - 1, groundY - 1 - y, 2, 1, applyVitality(palette.stem))
            }
            break
          case 'curved':
            for (let y = 0; y < stemHeight; y++) {
              const curveOffset = Math.sin((y / stemHeight) * Math.PI) * 1.5
              const sx = cx + swayX * (y / stemHeight) + curveOffset
              px(sx - 0.5, groundY - 1 - y, 1, 1, applyVitality(palette.stem))
            }
            break
          case 'multi':
            for (let s = -1; s <= 1; s++) {
              for (let y = 0; y < stemHeight; y++) {
                const sx = cx + s * 2 + swayX * (y / stemHeight)
                px(sx - 0.5, groundY - 1 - y, 1, 1, applyVitality(palette.stem))
              }
            }
            break
          default: // straight
            for (let y = 0; y < stemHeight; y++) {
              const sx = cx + swayX * (y / stemHeight)
              px(sx - 0.5, groundY - 1 - y, 1, 1, applyVitality(palette.stem))
            }
        }
      }
      drawStem()
```

- [ ] **Step 2: Verify dev server renders without errors**

Open `http://localhost:3000`, enter demo mode, go to Pipeline tab. Plants should still render (stems may look different).

- [ ] **Step 3: Commit**

```bash
git add frontend/components/resonance/RelationshipBloom.tsx
git commit -m "feat(bloom): refactor stem rendering with stemStyle dispatch"
```

---

### Task 3: Refactor leaf drawing to use leafPattern

**Files:**
- Modify: `frontend/components/resonance/RelationshipBloom.tsx`

- [ ] **Step 1: Replace the leaf drawing block**

Find the `// Leaves` comment block (after `drawStem()` from Task 2). Replace everything from `// Leaves` through the closing of the stage >= 4 canopy block with:

```ts
      // Leaves
      const drawLeaves = () => {
        const leafY = groundY - 2
        if (shape.leafPattern === 'none') return

        if (shape.leafPattern === 'pad') {
          // Lily pad style — horizontal ovals at water level
          if (stage >= 2) {
            px(cx - 4, groundY - 2, 3, 1, applyVitality('#2D8B4E'))
            px(cx + 1, groundY - 2, 3, 1, applyVitality('#2D8B4E'))
          }
          if (stage >= 3) {
            px(cx - 2, groundY - 3, 4, 1, applyVitality(palette.leaf))
          }
          return
        }

        if (shape.leafPattern === 'drooping') {
          // Hanging leaves below branches
          if (stage >= 2) {
            px(cx - 3 + swayX * 0.4, leafY - 2, 1, 2, applyVitality(palette.leaf))
            px(cx + 2 + swayX * 0.5, leafY - 3, 1, 2, applyVitality(palette.leaf))
          }
          if (stage >= 3) {
            px(cx - 4 + swayX * 0.5, leafY - 5, 1, 3, applyVitality(palette.leaf))
            px(cx + 3 + swayX * 0.7, leafY - 6, 1, 3, applyVitality(palette.leaf))
          }
          return
        }

        if (shape.leafPattern === 'cluster') {
          // Grouped at top of stem
          if (stage >= 2) {
            const top = groundY - 1 - (stage === 2 ? 7 : 12)
            px(cx - 3 + swayX * 0.5, top, 2, 1, applyVitality(palette.leaf))
            px(cx + 1 + swayX * 0.5, top, 2, 1, applyVitality(palette.leaf))
            px(cx - 2 + swayX * 0.5, top + 1, 4, 1, applyVitality(palette.leaf))
          }
          if (stage >= 3) {
            const top = groundY - 13
            for (let i = -3; i <= 3; i++) {
              px(cx + i + swayX * 0.6, top + 1 + Math.abs(i) * 0.5, 1, 1, applyVitality(i % 2 === 0 ? palette.leaf : '#6B9E5E'))
            }
          }
          if (stage >= 4) {
            const top = groundY - 14
            for (let i = -4; i <= 4; i++) {
              const ly = top + Math.abs(i) * 0.4
              px(cx + i + swayX * 0.9, ly, 1, 1, applyVitality(i % 2 === 0 ? palette.leaf : '#6B9E5E'))
            }
          }
          return
        }

        // Default: 'alternate' — current behavior
        px(cx - 2 + swayX * 0.3, leafY, 1, 1, applyVitality(palette.leaf))
        if (stage >= 2) {
          px(cx + 1 + swayX * 0.5, leafY - 1, 1, 1, applyVitality(palette.leaf))
          px(cx - 3 + swayX * 0.4, leafY - 3, 2, 1, applyVitality(palette.leaf))
          px(cx + 1 + swayX * 0.6, leafY - 4, 2, 1, applyVitality(palette.leaf))
        }
        if (stage >= 3) {
          px(cx - 4 + swayX * 0.5, leafY - 6, 2, 1, applyVitality(palette.leaf))
          px(cx + 2 + swayX * 0.7, leafY - 7, 2, 1, applyVitality(palette.leaf))
          px(cx - 2 + swayX * 0.6, leafY - 9, 3, 1, applyVitality(palette.leaf))
          px(cx + 0 + swayX * 0.8, leafY - 10, 3, 1, applyVitality(palette.leaf))
        }
        if (stage >= 4) {
          for (let i = -4; i <= 4; i++) {
            const ly = groundY - 11 - Math.abs(i) * 0.5
            px(cx + i + swayX * 0.9, ly, 1, 1, applyVitality(i % 2 === 0 ? palette.leaf : '#6B9E5E'))
          }
        }
      }
      drawLeaves()
```

- [ ] **Step 2: Verify rendering**

Check Pipeline page in demo mode. Oak should show cluster leaves, lotus should show pad leaves, lavender should show alternate thin leaves on 3 stems.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/resonance/RelationshipBloom.tsx
git commit -m "feat(bloom): refactor leaf rendering with leafPattern dispatch"
```

---

### Task 4: Refactor flower drawing with flowerShape dispatch

**Files:**
- Modify: `frontend/components/resonance/RelationshipBloom.tsx`

- [ ] **Step 1: Replace the flower drawing block**

Find the `// Flowers (stage 3+)` comment (after `drawLeaves()` from Task 3). Replace the entire flower block with:

```ts
      // Flowers (stage 3+)
      if (stage >= 3 && shape.flowerShape !== 'none') {
        const count = stage >= 4 ? shape.flowerCount.stage4 : shape.flowerCount.stage3
        // Generate flower positions spread around canopy
        const flowerPositions: { x: number; y: number }[] = []
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + 0.5
          const radius = 2 + (i % 3)
          const fy = groundY - 8 - Math.cos(angle) * radius * 0.6
          const fx = cx + Math.sin(angle) * radius + swayX * 0.6
          flowerPositions.push({ x: fx, y: fy })
        }

        const drawFlower = (x: number, y: number) => {
          switch (shape.flowerShape) {
            case 'round5':
              // 5-petal: center + 4 cardinal pixels
              px(x, y, 1, 1, applyVitality(palette.flower))
              px(x - 1, y, 1, 1, hexToRgba(palette.flower, 0.8))
              px(x + 1, y, 1, 1, hexToRgba(palette.flower, 0.8))
              px(x, y - 1, 1, 1, hexToRgba(palette.flower, 0.8))
              px(x, y + 1, 1, 1, hexToRgba(palette.flower, 0.7))
              break
            case 'layered':
              // Layered ball: 3x3 block for peony/rose
              px(x - 1, y - 1, 3, 3, hexToRgba(palette.flower, 0.5))
              px(x, y - 1, 1, 2, applyVitality(palette.flower))
              px(x - 1, y, 2, 1, applyVitality(palette.flower))
              px(x, y, 1, 1, applyVitality(palette.light))
              break
            case 'disc':
              // Sunflower disc: 3x3 yellow with brown center
              px(x - 1, y - 1, 3, 3, applyVitality(palette.flower))
              px(x, y, 1, 1, applyVitality(palette.stem))
              px(x - 1, y, 1, 1, applyVitality('#A07820'))
              px(x + 1, y, 1, 1, applyVitality('#A07820'))
              break
            case 'spike':
              // Vertical dot sequence for lavender/wisteria
              for (let sy = 0; sy < 3; sy++) {
                px(x, y - sy, 1, 1, hexToRgba(palette.flower, 0.6 + sy * 0.15))
              }
              break
            case 'puff':
              // Dandelion puff: cross + diagonals
              px(x, y, 1, 1, applyVitality(palette.flower))
              px(x - 1, y, 1, 1, hexToRgba(palette.light, 0.7))
              px(x + 1, y, 1, 1, hexToRgba(palette.light, 0.7))
              px(x, y - 1, 1, 1, hexToRgba(palette.light, 0.7))
              px(x, y + 1, 1, 1, hexToRgba(palette.light, 0.7))
              // Diagonals
              px(x - 1, y - 1, 1, 1, hexToRgba(palette.light, 0.4))
              px(x + 1, y - 1, 1, 1, hexToRgba(palette.light, 0.4))
              px(x - 1, y + 1, 1, 1, hexToRgba(palette.light, 0.4))
              px(x + 1, y + 1, 1, 1, hexToRgba(palette.light, 0.4))
              break
            case 'umbrella':
              // Mushroom cap: dome shape
              px(x - 2, y, 5, 1, applyVitality(palette.flower))
              px(x - 1, y - 1, 3, 1, applyVitality(palette.flower))
              px(x, y - 2, 1, 1, applyVitality(palette.light))
              break
            case 'triangle':
              // Bougainvillea bract: triangular
              px(x, y - 1, 1, 1, applyVitality(palette.flower))
              px(x - 1, y, 2, 1, applyVitality(palette.flower))
              px(x, y, 1, 1, hexToRgba(palette.light, 0.6))
              break
            default: // cross
              px(x, y, 1, 1, applyVitality(palette.flower))
              if (stage >= 4) {
                px(x - 1, y, 1, 1, hexToRgba(palette.flower, 0.7))
                px(x + 1, y, 1, 1, hexToRgba(palette.flower, 0.7))
                px(x, y - 1, 1, 1, hexToRgba(palette.flower, 0.7))
                px(x, y + 1, 1, 1, hexToRgba(palette.flower, 0.7))
              }
          }
        }

        flowerPositions.forEach(({ x, y }) => drawFlower(x, y))
      }
```

- [ ] **Step 2: Verify rendering**

Check Pipeline page demo mode. Each bloom type should now show a distinctly shaped flower.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/resonance/RelationshipBloom.tsx
git commit -m "feat(bloom): add flower shape dispatch for all 12 species"
```

---

### Task 5: Refactor special elements (thorns, water, chains, glow, scatter)

**Files:**
- Modify: `frontend/components/resonance/RelationshipBloom.tsx`

- [ ] **Step 1: Replace the special element blocks**

Find the blocks after flowers: `// Wisteria hanging chains`, `// Lotus water base`, `// Glow mushroom glow`, and `// Full bloom halo glow`. Replace ALL of them plus the existing idle leaf spawn (`if (stage >= 4 && vitality >= 0.65 && Math.random() < 0.008)`) with this unified dispatch. The scatter special element replaces the generic idle spawn:

```ts
      // Special elements
      if (shape.specialElement && stage >= 3) {
        switch (shape.specialElement) {
          case 'thorns':
            // 1px bumps on stem every 3 pixels
            for (let y = 2; y < stemHeight - 1; y += 3) {
              const side = y % 2 === 0 ? -1 : 1
              const sx = cx + swayX * (y / stemHeight)
              px(sx - 0.5 + side * 1.5, groundY - 1 - y, 1, 1, applyVitality(palette.stem))
            }
            break
          case 'chains':
            // Wisteria hanging chains
            for (let chain = 0; chain < 3; chain++) {
              const startX = cx - 3 + chain * 2.5 + swayX * 0.5
              for (let yy = 0; yy < 3 + chain; yy++) {
                px(startX, groundY - 7 - yy, 1, 1, hexToRgba(palette.flower, 0.6 + yy * 0.1))
              }
            }
            break
          case 'water':
            // Lotus water surface
            ctx.fillStyle = hexToRgba('#5A8AAE', 0.4)
            ctx.fillRect(Math.round(4 * scale), Math.round((groundY - 1) * scale), Math.round(12 * scale), Math.round(2 * scale))
            break
          case 'glow':
            // Mushroom night glow
            if (night) {
              const grad = ctx.createRadialGradient(
                Math.round(cx * scale), Math.round((groundY - 6) * scale), 0,
                Math.round(cx * scale), Math.round((groundY - 6) * scale), Math.round(6 * scale)
              )
              grad.addColorStop(0, hexToRgba(palette.flower, 0.4))
              grad.addColorStop(1, 'transparent')
              ctx.fillStyle = grad
              ctx.fillRect(Math.round((cx - 6) * scale), Math.round((groundY - 12) * scale), Math.round(12 * scale), Math.round(12 * scale))
            }
            break
          case 'scatter':
            // Idle particle spawn (sakura petals, dandelion seeds)
            if (vitality >= 0.65 && Math.random() < 0.015) {
              spawnLeaves(1)
            }
            break
        }
      }

      // Full bloom halo glow
      if (stage >= 4) {
        const alpha = 0.12 + Math.sin(t * 0.5) * 0.04
        const grad = ctx.createRadialGradient(
          Math.round(cx * scale), Math.round((groundY - 8) * scale), 0,
          Math.round(cx * scale), Math.round((groundY - 8) * scale), Math.round(8 * scale)
        )
        grad.addColorStop(0, hexToRgba(palette.light, alpha))
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    } // end stage >= 1
```

- [ ] **Step 2: Verify all species render correctly**

Check Pipeline demo with different bloom types. Verify rose shows thorns, lotus shows water, mushroom shows glow at night.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/resonance/RelationshipBloom.tsx
git commit -m "feat(bloom): add special element rendering (thorns, water, chains, glow, scatter)"
```

---

### Task 6: Add progressive unlock to PixelAvatar

**Files:**
- Modify: `frontend/components/resonance/PixelAvatar.tsx`

- [ ] **Step 1: Add level prop and 16x16 grid generation**

Rewrite `PixelAvatar.tsx` entirely:

```tsx
"use client"

import { useMemo, useState, useEffect } from 'react'

const PALETTES = [
  ['#C4956A', '#E8D5C0', '#8B6B4A', '#FBF9F6', '#1D1B1B', '#C5C1BB'],
  ['#C45060', '#E0A0A8', '#8B4050', '#FBF9F6', '#1D1B1B', '#DDD9D3'],
  ['#4A7C59', '#A0C8A8', '#3D6B48', '#FBF9F6', '#1D1B1B', '#C5C1BB'],
  ['#D4A040', '#E8C880', '#A07820', '#FBF9F6', '#1D1B1B', '#DDD9D3'],
]

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRand(seed: number, index: number): number {
  const x = Math.sin(seed + index) * 10000
  return x - Math.floor(x)
}

function generatePixelGrid(userId: string, gridSize: 8 | 16 = 8): number[][] {
  const seed = hashString(userId) + (gridSize === 16 ? 1000 : 0)
  const halfCols = gridSize / 2
  const grid: number[][] = []
  for (let row = 0; row < gridSize; row++) {
    const rowData: number[] = []
    for (let col = 0; col < halfCols; col++) {
      const rand = seededRand(seed, row * halfCols + col)
      const distFromCenter = Math.abs(col - (halfCols - 1) / 2)
      const fillBias = 0.3 + (1 - distFromCenter / (halfCols / 2)) * 0.5
      const hairRows = gridSize / 4
      rowData.push(rand < fillBias ? (row < hairRows ? 4 : rand < 0.2 ? 2 : 1) : 0)
    }
    const mirrored = [...rowData, ...rowData.slice().reverse()]
    grid.push(mirrored)
  }
  return grid
}

interface PixelAvatarProps {
  userId: string
  size?: number
  className?: string
  level?: 1 | 2 | 3
  selfieUrl?: string | null
}

export function PixelAvatar({ userId, size = 48, className = '', level = 1, selfieUrl }: PixelAvatarProps) {
  const [transitioning, setTransitioning] = useState(false)
  const [prevLevel, setPrevLevel] = useState(level)

  // Trigger blur transition when level changes
  useEffect(() => {
    if (level !== prevLevel) {
      setTransitioning(true)
      setPrevLevel(level)
      const timer = setTimeout(() => setTransitioning(false), 800)
      return () => clearTimeout(timer)
    }
  }, [level, prevLevel])

  const gridSize = level >= 2 ? 16 : 8
  const showPhoto = level >= 3 && selfieUrl

  const { grid, palette } = useMemo(() => {
    const seed = hashString(userId)
    const paletteIndex = seed % PALETTES.length
    return {
      grid: generatePixelGrid(userId, gridSize as 8 | 16),
      palette: PALETTES[paletteIndex],
    }
  }, [userId, gridSize])

  const pixelSize = size / gridSize

  const transitionStyle: React.CSSProperties = {
    filter: transitioning ? 'blur(8px)' : 'blur(0px)',
    transition: 'filter 800ms ease-out',
  }

  // Respect prefers-reduced-motion (use state to avoid SSR mismatch)
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  if (showPhoto) {
    return (
      <div
        className={`inline-block flex-shrink-0 overflow-hidden ${className}`}
        style={{
          width: size,
          height: size,
          border: '1px solid #C5C1BB',
          ...(reducedMotion ? {} : transitionStyle),
        }}
      >
        <img
          src={selfieUrl}
          alt="avatar"
          style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }

  return (
    <div
      className={`inline-block flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        border: '1px solid #C5C1BB',
        ...(reducedMotion ? {} : transitionStyle),
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${pixelSize}px)`,
          width: size,
          height: size,
        }}
      >
        {grid.map((row, rowIdx) =>
          row.map((colorIdx, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              style={{
                backgroundColor: colorIdx === 0 ? palette[3] : palette[colorIdx - 1],
                width: pixelSize,
                height: pixelSize,
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd D:/software/google_drive_backup/resonance/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/components/resonance/PixelAvatar.tsx
git commit -m "feat(avatar): add progressive unlock with 3 levels and blur transition"
```

---

### Task 7: Wire PixelAvatar level in PipelinePage

**Files:**
- Modify: `frontend/components/resonance/PipelinePage.tsx`

**Note:** PixelAvatar is imported but NOT rendered in MatchCard. We need to add it to the card header, next to the city/gender info.

- [ ] **Step 1: Add level calculation and render PixelAvatar in MatchCard**

In the `MatchCard` component, after line `const bloomStage = ...` add:

```ts
const avatarLevel = match.questions_completed >= 5 ? 3 : match.questions_completed >= 3 ? 2 : 1
```

Then in the JSX, find the info `<div>` that shows city/gender (inside `{/* Top row: bloom + info */}`). Add PixelAvatar before the text info. Change this section:

```tsx
<div className="flex-1 flex flex-col justify-between">
  <div>
    <div style={{ fontSize: 13, ...
```

To:

```tsx
<div className="flex-1 flex flex-col justify-between">
  <div>
    <div className="flex items-center gap-2 mb-1">
      <PixelAvatar userId={match.match_id} size={32} level={avatarLevel as 1 | 2 | 3} />
      <div>
        <div style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B' }}>
          {match.other_city ?? '未知'} · {match.other_gender === 'female' ? '女' : match.other_gender === 'male' ? '男' : '其他'}
        </div>
        <div style={{ fontSize: 11, color: '#9E9A94', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 2 }}>
          {stream === 'being_found' ? 'TA发起' : '我发起'}
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Verify in demo mode**

Pipeline page should show: demo-m1 (questions_completed=3) at level 2 (16x16 pixel avatar), demo-m2 (questions_completed=0) at level 1 (8x8 pixel avatar).

- [ ] **Step 3: Commit**

```bash
git add frontend/components/resonance/PipelinePage.tsx
git commit -m "feat(pipeline): wire PixelAvatar progressive unlock level"
```

---

### Task 8: Add Toast state to Zustand store

**Files:**
- Modify: `frontend/lib/store.ts:80-148`

- [ ] **Step 1: Add toast state and actions to store**

Add to `AppStore` interface (after line 90):

```ts
  // Toast
  toastMessage: string | null
  toastType: 'error' | 'success'
  showToast: (message: string, type?: 'error' | 'success') => void
  dismissToast: () => void
```

Add to the store initial state (after line 115):

```ts
  toastMessage: null,
  toastType: 'error' as const,
```

Add outside the store (module-level, before `export const useAppStore`):

```ts
let toastTimeoutId: ReturnType<typeof setTimeout> | null = null
```

Add to store actions (after `setInboxBadge`):

```ts
  showToast: (message, type = 'error') => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    set({ toastMessage: message, toastType: type })
    toastTimeoutId = setTimeout(() => {
      set({ toastMessage: null })
      toastTimeoutId = null
    }, 3000)
  },
  dismissToast: () => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    toastTimeoutId = null
    set({ toastMessage: null })
  },
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd D:/software/google_drive_backup/resonance/frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/store.ts
git commit -m "feat(store): add toast state and showToast/dismissToast actions"
```

---

### Task 9: Create Toast component

**Files:**
- Create: `frontend/components/resonance/Toast.tsx`

- [ ] **Step 1: Create the Toast component**

```tsx
"use client"

import { useAppStore } from '@/lib/store'

export function Toast() {
  const { toastMessage, toastType } = useAppStore()

  if (!toastMessage) return null

  const borderColor = toastType === 'success' ? '#5A9E6F' : '#C75B5B'

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: 320,
        width: 'calc(100% - 32px)',
        background: '#FBF9F6',
        border: '1px solid #C5C1BB',
        borderLeft: `3px solid ${borderColor}`,
        padding: '10px 14px',
        fontSize: 12,
        fontFamily: 'var(--font-ibm-plex-mono)',
        color: '#1D1B1B',
        animation: 'toast-slide-in 300ms ease-out',
      }}
    >
      {toastMessage}
    </div>
  )
}
```

- [ ] **Step 2: Add toast animation keyframes to globals.css**

Append to `frontend/app/globals.css`:

```css
/* Toast slide in */
@keyframes toast-slide-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-100%); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

- [ ] **Step 3: Mount Toast in ResonanceApp**

In `frontend/components/resonance/ResonanceApp.tsx`, add import and render:

```ts
import { Toast } from './Toast'
```

Keep the existing early-return pattern. Add `<Toast />` before each return statement. For the early returns (`auth`, `onboarding`, `session`), wrap in a fragment:

```tsx
if (page === 'auth') {
  return <><Toast /><AuthPage /></>
}

if (page === 'onboarding') {
  return <><Toast /><OnboardingPage /></>
}

if (page === 'session') {
  return <><Toast /><SessionPage /></>
}

return (
  <div style={{ minHeight: '100dvh', background: '#F3F1ED', maxWidth: 390, margin: '0 auto', position: 'relative' }}>
    <Toast />
    {/* ... rest unchanged ... */}
  </div>
)
```

- [ ] **Step 4: Verify Toast renders**

Temporarily add `showToast('测试消息')` in a useEffect in ResonanceApp. Confirm toast slides in from top.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/resonance/Toast.tsx frontend/app/globals.css frontend/components/resonance/ResonanceApp.tsx
git commit -m "feat: add global Toast notification component"
```

---

### Task 10: Add loading dots animation

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/components/resonance/PoolPage.tsx`
- Modify: `frontend/components/resonance/InboxPage.tsx`
- Modify: `frontend/components/resonance/PipelinePage.tsx`

- [ ] **Step 1: Add loading-dots CSS to globals.css**

Append to `frontend/app/globals.css`:

```css
/* Loading dots */
@keyframes pulse-dots {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
.loading-dots span {
  display: inline-block;
  animation: pulse-dots 1.4s infinite ease-in-out both;
}
.loading-dots span:nth-child(2) { animation-delay: 0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0.32s; }
```

- [ ] **Step 2: Replace loading text in all 3 pages**

In each page, find the loading `<p>` element showing "加载中..." and replace with:

```tsx
<div className="loading-dots" style={{ color: '#C4956A', fontSize: 20, letterSpacing: 4, textAlign: 'center' }}>
  <span>.</span><span>.</span><span>.</span>
</div>
```

Files to edit:
- `PoolPage.tsx` — find `加载中...` in the loading branch
- `InboxPage.tsx` — find `加载中...` in the loading branch
- `PipelinePage.tsx` — find `加载中...` in the loading branch

- [ ] **Step 3: Verify animation**

Reload the app — each page should show animated pulsing dots during loading.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/globals.css frontend/components/resonance/PoolPage.tsx frontend/components/resonance/InboxPage.tsx frontend/components/resonance/PipelinePage.tsx
git commit -m "feat: replace loading text with pulsing dots animation"
```

---

### Task 11: Wire showToast into page error handlers

**Files:**
- Modify: `frontend/components/resonance/PoolPage.tsx`
- Modify: `frontend/components/resonance/InboxPage.tsx`
- Modify: `frontend/components/resonance/PipelinePage.tsx`
- Modify: `frontend/components/resonance/SessionPage.tsx`
- Modify: `frontend/components/resonance/RatingModal.tsx`

- [ ] **Step 1: Add showToast import to each page**

In each file, import or destructure `showToast` from the store:

**PoolPage.tsx** — already imports from `@/lib/store`. Add `useAppStore` to the import if not present. Then inside `PoolPage()`:
```ts
const { showToast } = useAppStore()
```

**InboxPage.tsx** — already imports `useAppStore`. Add `showToast` to destructure.

**PipelinePage.tsx** — already imports `useAppStore`. Add `showToast` to the existing destructure in `MatchCard`.

**SessionPage.tsx** — already imports `useAppStore`. Add `showToast` to destructure.

**RatingModal.tsx** — already imports `useAppStore`. Add `showToast` to destructure.

- [ ] **Step 2: Wire error toasts per the integration map**

**PoolPage.tsx** — in the `getPool()` catch:
```ts
.catch(() => {
  setCandidates(MOCK_POOL_CANDIDATES)
  showToast('无法加载候选人，使用离线数据')
})
```

**InboxPage.tsx** — in the `getReceivedApproaches()` catch:
```ts
.catch(() => showToast('无法加载收到的心意'))
```

**PipelinePage.tsx** — in the `getPipeline()` catch:
```ts
.catch(() => showToast('无法加载连接列表'))
```

In `handleVote` catch:
```ts
} catch { showToast('操作失败，请稍后重试') }
```

In `handleStartSession` catch:
```ts
} catch { showToast('创建会话失败，请重试') }
```

**SessionPage.tsx** — in `saveAnswer` catch:
```ts
} catch { showToast('提交失败，请重试') }
```

**RatingModal.tsx** — in `handleDecide` catch (the endSession call):
```ts
} catch { showToast('结束会话失败，请重试') }
```

- [ ] **Step 3: Verify toast appears on error**

In demo mode, the Pool page should show "无法加载候选人，使用离线数据" toast briefly (since demo mode skips API call, this won't fire — but verify with non-demo mode by removing token from localStorage temporarily).

- [ ] **Step 4: Commit**

```bash
git add frontend/components/resonance/PoolPage.tsx frontend/components/resonance/InboxPage.tsx frontend/components/resonance/PipelinePage.tsx frontend/components/resonance/SessionPage.tsx frontend/components/resonance/RatingModal.tsx
git commit -m "feat: wire showToast into all page error handlers"
```

---

### Task 12: Visual verification of all 12 bloom species

**Files:** None (verification only)

- [ ] **Step 1: Update demo mock data to show more bloom types**

In `frontend/components/resonance/PipelinePage.tsx`, update `MOCK_PIPELINE` to include all 12 species for visual testing:

```ts
const MOCK_PIPELINE: { pursuing: ApiMatch[]; being_found: ApiMatch[] } = {
  pursuing: [
    { match_id: 'demo-m1', round: 1, status: 'active', other_city: '上海', other_gender: 'female', other_personality_tags: ['温柔体贴'], bloom_type: 'sakura', days_since_activity: 1, questions_completed: 3, bloom_stage: 3 },
    { match_id: 'demo-m2', round: 1, status: 'active', other_city: '北京', other_gender: 'female', other_personality_tags: ['文艺青年'], bloom_type: 'rose', days_since_activity: 0, questions_completed: 5, bloom_stage: 4 },
    { match_id: 'demo-m3', round: 1, status: 'active', other_city: '杭州', other_gender: 'female', other_personality_tags: ['善于倾听'], bloom_type: 'wisteria', days_since_activity: 2, questions_completed: 2, bloom_stage: 3 },
    { match_id: 'demo-m4', round: 1, status: 'active', other_city: '成都', other_gender: 'female', other_personality_tags: ['独立自主'], bloom_type: 'peony', days_since_activity: 0, questions_completed: 4, bloom_stage: 4 },
    { match_id: 'demo-m5', round: 1, status: 'active', other_city: '广州', other_gender: 'female', other_personality_tags: ['热爱旅行'], bloom_type: 'lotus', days_since_activity: 3, questions_completed: 1, bloom_stage: 3 },
    { match_id: 'demo-m6', round: 1, status: 'active', other_city: '深圳', other_gender: 'male', other_personality_tags: ['理性冷静'], bloom_type: 'oak', days_since_activity: 1, questions_completed: 4, bloom_stage: 4 },
  ],
  being_found: [
    { match_id: 'demo-m7', round: 1, status: 'active', other_city: '武汉', other_gender: 'female', other_personality_tags: ['创意思维'], bloom_type: 'sunflower', days_since_activity: 0, questions_completed: 3, bloom_stage: 3 },
    { match_id: 'demo-m8', round: 1, status: 'active', other_city: '南京', other_gender: 'female', other_personality_tags: ['注重健康'], bloom_type: 'lavender', days_since_activity: 1, questions_completed: 0, bloom_stage: 2 },
    { match_id: 'demo-m9', round: 1, status: 'active', other_city: '西安', other_gender: 'male', other_personality_tags: ['事业心强'], bloom_type: 'dandelion', days_since_activity: 4, questions_completed: 5, bloom_stage: 4 },
    { match_id: 'demo-m10', round: 1, status: 'active', other_city: '厦门', other_gender: 'female', other_personality_tags: ['爱好运动'], bloom_type: 'plumeria', days_since_activity: 0, questions_completed: 2, bloom_stage: 3 },
    { match_id: 'demo-m11', round: 1, status: 'active', other_city: '重庆', other_gender: 'female', other_personality_tags: ['温柔体贴'], bloom_type: 'bougainvillea', days_since_activity: 2, questions_completed: 4, bloom_stage: 4 },
    { match_id: 'demo-m12', round: 1, status: 'active', other_city: '昆明', other_gender: 'male', other_personality_tags: ['善于倾听'], bloom_type: 'glow_mushroom', days_since_activity: 0, questions_completed: 1, bloom_stage: 3 },
  ],
}
```

- [ ] **Step 2: Visual check**

Open demo mode, go to Pipeline. Scroll through and verify:
- Each species has a distinct visual silhouette
- Sakura: curved stem, 5-petal flowers, petal particles
- Rose: straight stem with thorns, layered flowers
- Oak: thick trunk, big canopy, no flowers
- Sunflower: single large disc flower
- Lavender: 3 stems with spike flowers
- Dandelion: puff ball with scatter particles
- Mushroom: umbrella cap, night glow
- PixelAvatar: level 1 (8x8) for low questions, level 2 (16x16) for 3-4 questions, level 3 attempted for 5+

- [ ] **Step 3: Commit verification mock data**

```bash
git add frontend/components/resonance/PipelinePage.tsx
git commit -m "feat(demo): add all 12 bloom species to pipeline mock data"
```

---

### Task 13: Final cleanup and combined commit

- [ ] **Step 1: Run TypeScript check**

Run: `cd D:/software/google_drive_backup/resonance/frontend && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Check dev server**

Verify `http://localhost:3000` loads without console errors. Test all 3 tabs in demo mode.

- [ ] **Step 3: Remove any debug code**

Remove any temporary `showToast` test calls added during development.

- [ ] **Step 4: Final commit if needed**

Stage only the specific files modified during cleanup, then commit:

```bash
git commit -m "chore: final cleanup for visual + robustness improvements"
```
