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
