"use client"

import { useMemo } from 'react'

// 4 warm palettes: amber, rose, forest, golden
const PALETTES = [
  ['#C4956A', '#E8D5C0', '#8B6B4A', '#FBF9F6', '#1D1B1B', '#C5C1BB'],
  ['#C45060', '#E0A0A8', '#8B4050', '#FBF9F6', '#1D1B1B', '#DDD9D3'],
  ['#4A7C59', '#A0C8A8', '#3D6B48', '#FBF9F6', '#1D1B1B', '#C5C1BB'],
  ['#D4A040', '#E8C880', '#A07820', '#FBF9F6', '#1D1B1B', '#DDD9D3'],
]

// Deterministic pixel pattern from userId
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

// 8x8 grid — mirror left half for symmetry
function generatePixelGrid(userId: string): number[][] {
  const seed = hashString(userId)
  const grid: number[][] = []
  for (let row = 0; row < 8; row++) {
    const rowData: number[] = []
    for (let col = 0; col < 4; col++) {
      // color index: 0=bg, 1=primary, 2=dark, 3=light, 4=dark(face)
      const rand = seededRand(seed, row * 4 + col)
      // More filled in center
      const distFromCenter = Math.abs(col - 1.5)
      const fillBias = 0.3 + (1 - distFromCenter / 2) * 0.5
      rowData.push(rand < fillBias ? (row < 2 ? 4 : rand < 0.2 ? 2 : 1) : 0)
    }
    // Mirror
    const mirrored = [...rowData, ...rowData.slice().reverse()]
    grid.push(mirrored)
  }
  return grid
}

interface PixelAvatarProps {
  userId: string
  size?: number
  className?: string
}

export function PixelAvatar({ userId, size = 48, className = '' }: PixelAvatarProps) {
  const { grid, palette } = useMemo(() => {
    const seed = hashString(userId)
    const paletteIndex = seed % PALETTES.length
    return {
      grid: generatePixelGrid(userId),
      palette: PALETTES[paletteIndex],
    }
  }, [userId])

  const pixelSize = size / 8

  return (
    <div
      className={`inline-block flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        border: '1px solid #C5C1BB',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(8, ${pixelSize}px)`,
          gridTemplateRows: `repeat(8, ${pixelSize}px)`,
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
