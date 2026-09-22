"use client"

import { useEffect, useRef, useCallback } from 'react'
import { BloomType, BLOOM_PALETTES } from '@/lib/store'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 0-1
  maxLife: number
  color: string
  size: number
  type: 'leaf' | 'petal' | 'firefly' | 'rain' | 'burst'
}

interface RelationshipBloomProps {
  bloomType: BloomType
  stage: 0 | 1 | 2 | 3 | 4
  daysInactive?: number
  size?: number
  className?: string
  interactive?: boolean
  showBackground?: boolean
  opacity?: number
}

function getSkyColor(hour: number): string {
  if (hour >= 5 && hour < 7) return '#D4915A'
  if (hour >= 7 && hour < 17) return '#87AECF'
  if (hour >= 17 && hour < 19) return '#8B6B9A'
  return '#2B3A67'
}

function isNight(hour: number): boolean {
  return hour >= 19 || hour < 5
}

function lerpColor(c1: string, c2: string, t: number): string {
  const parse = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }
  const [r1, g1, b1] = parse(c1)
  const [r2, g2, b2] = parse(c2)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function RelationshipBloom({
  bloomType,
  stage,
  daysInactive = 0,
  size = 100,
  className = '',
  interactive = true,
  showBackground = true,
  opacity = 1,
}: RelationshipBloomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const starsRef = useRef<{ x: number; y: number; phase: number; speed: number }[]>([])
  const shakeRef = useRef(0)
  const shakeTimeRef = useRef(0)
  const lastCooldownRef = useRef(0)
  const W = 20
  const H = 28

  const palette = BLOOM_PALETTES[bloomType]

  // Decay vitality
  const vitality =
    daysInactive <= 3 ? 1.0
    : daysInactive <= 7 ? 0.65
    : daysInactive <= 14 ? 0.35
    : daysInactive < 0 ? 0.15
    : 1.0

  function applyVitality(hex: string): string {
    if (vitality >= 1.0) return hex
    // Shift toward yellow/brown for decay
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const decayR = 0x8B
    const decayG = 0x6B
    const decayB = 0x4A
    const t = 1 - vitality
    return `rgb(${Math.round(r + (decayR - r) * t * 0.7)},${Math.round(g + (decayG - g) * t * 0.7)},${Math.round(b + (decayB - b) * t * 0.7)})`
  }

  // Init stars
  useEffect(() => {
    starsRef.current = Array.from({ length: 20 }, (_, i) => ({
      x: Math.floor(((i * 3 + 7) * 47) % W),
      y: Math.floor(((i * 5 + 3) * 31) % (H * 0.55)),
      phase: (i * 1.3) % (Math.PI * 2),
      speed: 0.3 + (i % 5) * 0.15,
    }))
  }, [])

  function spawnLeaves(count: number) {
    const ps = particlesRef.current
    if (ps.length >= 12) return
    for (let i = 0; i < count && ps.length < 12; i++) {
      ps.push({
        x: W / 2 + (Math.random() - 0.5) * 6,
        y: H * 0.4 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.15 + Math.random() * 0.15,
        life: 1, maxLife: 60 + Math.random() * 40,
        color: Math.random() > 0.5 ? palette.leaf : palette.flower,
        size: 1, type: 'leaf',
      })
    }
  }

  function spawnRain() {
    const ps = particlesRef.current
    for (let i = 0; i < 5 && ps.length < 12; i++) {
      ps.push({
        x: Math.random() * W,
        y: 0,
        vx: 0, vy: 0.5,
        life: 1, maxLife: H / 0.5,
        color: '#5A8AAE',
        size: 1, type: 'rain',
      })
    }
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = false
    const scale = size / W
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    const night = isNight(hour)
    const skyColor = getSkyColor(hour)
    const t = Date.now() / 1000

    const px = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(
        Math.round((x + shakeRef.current) * scale),
        Math.round(y * scale),
        Math.round(w * scale),
        Math.round(h * scale)
      )
    }

    // Background sky
    if (showBackground) {
      ctx.fillStyle = skyColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Stars (night only)
      if (night) {
        starsRef.current.forEach((star) => {
          star.phase += star.speed * 0.02
          const alpha = 0.3 + Math.sin(star.phase) * 0.4
          ctx.fillStyle = hexToRgba('#F0EDE8', alpha)
          ctx.fillRect(
            Math.round(star.x * scale),
            Math.round(star.y * scale),
            Math.round(scale),
            Math.round(scale)
          )
        })
      }

      // Clouds (day only)
      if (!night && hour >= 7 && hour < 17) {
        ctx.fillStyle = 'rgba(240,237,232,0.6)'
        const cloudX = Math.round((Math.sin(t * 0.02) * 2 + 4) * scale)
        ctx.fillRect(cloudX, Math.round(2 * scale), Math.round(4 * scale), Math.round(scale))
        ctx.fillRect(cloudX + Math.round(scale), Math.round(scale), Math.round(3 * scale), Math.round(scale))
        const cloud2X = Math.round((Math.sin(t * 0.015 + 2) * 2 + 12) * scale)
        ctx.fillRect(cloud2X, Math.round(3 * scale), Math.round(3 * scale), Math.round(scale))
      }
    } else {
      ctx.fillStyle = '#F3F1ED'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const groundY = H - 4

    // Ground / soil
    ctx.fillStyle = applyVitality(palette.ground)
    ctx.fillRect(Math.round(5 * scale), Math.round(groundY * scale), Math.round(10 * scale), Math.round(4 * scale))
    // darker soil strip
    ctx.fillStyle = hexToRgba(palette.ground, 0.6)
    ctx.fillRect(Math.round(6 * scale), Math.round((groundY + 1) * scale), Math.round(8 * scale), Math.round(scale))

    const cx = W / 2 // center x = 10

    if (stage === 0) {
      // Seed
      ctx.fillStyle = applyVitality(palette.ground)
      ctx.fillRect(Math.round((cx - 1 + shakeRef.current) * scale), Math.round((groundY - 1) * scale), Math.round(2 * scale), Math.round(scale))
      // Glow
      if (night) {
        const grad = ctx.createRadialGradient(
          Math.round(cx * scale), Math.round((groundY - 1) * scale),
          0,
          Math.round(cx * scale), Math.round((groundY - 1) * scale),
          Math.round(3 * scale)
        )
        grad.addColorStop(0, hexToRgba(palette.light, 0.3 + Math.sin(t * 1.5) * 0.15))
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(Math.round((cx - 3) * scale), Math.round((groundY - 4) * scale), Math.round(6 * scale), Math.round(6 * scale))
      }
    }

    if (stage >= 1) {
      // Sprout — short stem, 1-2 leaves
      const stemHeight = stage === 1 ? 4 : stage === 2 ? 7 : stage >= 3 ? 12 : 4
      const swayX = stage >= 2 ? Math.sin(t * 0.8) * 0.3 : 0

      // Stem
      ctx.fillStyle = applyVitality(palette.stem)
      for (let y = 0; y < stemHeight; y++) {
        const sx = cx + swayX * (y / stemHeight)
        px(sx - 0.5, groundY - 1 - y, 1, 1, applyVitality(palette.stem))
      }

      // Leaves
      if (stage >= 1) {
        const leafY = groundY - 2
        px(cx - 2 + swayX * 0.3, leafY, 1, 1, applyVitality(palette.leaf))
        if (stage >= 2) {
          px(cx + 1 + swayX * 0.5, leafY - 1, 1, 1, applyVitality(palette.leaf))
          px(cx - 3 + swayX * 0.4, leafY - 3, 2, 1, applyVitality(palette.leaf))
          px(cx + 1 + swayX * 0.6, leafY - 4, 2, 1, applyVitality(palette.leaf))
        }
        if (stage >= 3) {
          // More leaf clusters
          px(cx - 4 + swayX * 0.5, leafY - 6, 2, 1, applyVitality(palette.leaf))
          px(cx + 2 + swayX * 0.7, leafY - 7, 2, 1, applyVitality(palette.leaf))
          px(cx - 2 + swayX * 0.6, leafY - 9, 3, 1, applyVitality(palette.leaf))
          px(cx + 0 + swayX * 0.8, leafY - 10, 3, 1, applyVitality(palette.leaf))
        }
        if (stage >= 4) {
          // Full canopy
          for (let i = -4; i <= 4; i++) {
            const ly = groundY - 11 - Math.abs(i) * 0.5
            px(cx + i + swayX * 0.9, ly, 1, 1, applyVitality(i % 2 === 0 ? palette.leaf : '#6B9E5E'))
          }
        }
      }

      // Flowers (stage 3+)
      if (stage >= 3) {
        const flowerPositions = bloomType === 'wisteria'
          ? [{ x: cx - 2, y: groundY - 6 }, { x: cx, y: groundY - 4 }, { x: cx + 2, y: groundY - 6 }]
          : bloomType === 'lotus'
          ? [{ x: cx, y: groundY - 8 }]
          : [
            { x: cx - 3 + swayX * 0.5, y: groundY - 9 },
            { x: cx + 2 + swayX * 0.7, y: groundY - 10 },
            ...(stage >= 4 ? [
              { x: cx - 1 + swayX * 0.6, y: groundY - 12 },
              { x: cx + 3 + swayX * 0.8, y: groundY - 8 },
            ] : []),
          ]

        flowerPositions.forEach(({ x, y }) => {
          // Cross-shaped flower
          px(x, y, 1, 1, applyVitality(palette.flower))
          if (stage >= 4) {
            px(x - 1, y, 1, 1, hexToRgba(palette.flower, 0.7))
            px(x + 1, y, 1, 1, hexToRgba(palette.flower, 0.7))
            px(x, y - 1, 1, 1, hexToRgba(palette.flower, 0.7))
            px(x, y + 1, 1, 1, hexToRgba(palette.flower, 0.7))
          }
        })
      }

      // Wisteria hanging chains
      if (bloomType === 'wisteria' && stage >= 3) {
        for (let chain = 0; chain < 3; chain++) {
          const startX = cx - 3 + chain * 2.5 + swayX * 0.5
          for (let yy = 0; yy < 3 + chain; yy++) {
            px(startX, groundY - 7 - yy, 1, 1, hexToRgba(palette.flower, 0.6 + yy * 0.1))
          }
        }
      }

      // Lotus water base
      if (bloomType === 'lotus') {
        ctx.fillStyle = hexToRgba('#5A8AAE', 0.4)
        ctx.fillRect(Math.round(4 * scale), Math.round((groundY - 1) * scale), Math.round(12 * scale), Math.round(2 * scale))
        // lily pads
        px(cx - 3, groundY - 2, 3, 1, applyVitality('#2D8B4E'))
        px(cx + 1, groundY - 2, 3, 1, applyVitality('#2D8B4E'))
      }

      // Glow mushroom glow
      if (bloomType === 'glow_mushroom' && stage >= 3 && night) {
        const grad = ctx.createRadialGradient(
          Math.round(cx * scale), Math.round((groundY - 6) * scale), 0,
          Math.round(cx * scale), Math.round((groundY - 6) * scale), Math.round(6 * scale)
        )
        grad.addColorStop(0, hexToRgba(palette.flower, 0.4))
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(Math.round((cx - 6) * scale), Math.round((groundY - 12) * scale), Math.round(12 * scale), Math.round(12 * scale))
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
    }

    // Fireflies (night, stage 3+)
    if (night && stage >= 3 && vitality >= 0.65) {
      const ps = particlesRef.current
      if (ps.filter(p => p.type === 'firefly').length < 3) {
        ps.push({
          x: 4 + Math.random() * 12,
          y: H * 0.3 + Math.random() * H * 0.4,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.08,
          life: 1, maxLife: 120 + Math.random() * 80,
          color: '#F0EDE8',
          size: 1,
          type: 'firefly',
        })
      }
    }

    // Update & draw particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0)
    particlesRef.current.forEach(p => {
      p.life -= 1 / p.maxLife

      if (p.type === 'leaf' || p.type === 'petal') {
        p.x += p.vx + Math.sin(t * 2 + p.y) * 0.05
        p.y += p.vy
      } else if (p.type === 'firefly') {
        p.x += p.vx + Math.sin(t * 0.5 + p.y) * 0.05
        p.y += p.vy
        p.vx += (Math.random() - 0.5) * 0.02
        p.vy += (Math.random() - 0.5) * 0.02
        p.vx = Math.max(-0.15, Math.min(0.15, p.vx))
        p.vy = Math.max(-0.1, Math.min(0.1, p.vy))
        if (p.x < 2) p.vx += 0.05
        if (p.x > W - 2) p.vx -= 0.05
        if (p.y < 4) p.vy += 0.05
        if (p.y > H - 6) p.vy -= 0.05
      } else if (p.type === 'rain') {
        p.y += p.vy
      } else if (p.type === 'burst') {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.02
      }

      const alpha = p.type === 'firefly'
        ? 0.4 + Math.sin(t * 3 + p.x) * 0.4
        : p.life * 0.9

      if (p.x >= 0 && p.x < W && p.y >= 0 && p.y < H) {
        ctx.fillStyle = hexToRgba(p.color, Math.max(0, alpha))
        ctx.fillRect(
          Math.round((p.x + (p.type !== 'firefly' ? shakeRef.current : 0)) * scale),
          Math.round(p.y * scale),
          Math.round(p.size * scale),
          Math.round(p.size * scale)
        )
      }
    })

    // Idle leaf spawn for full bloom
    if (stage >= 4 && vitality >= 0.65 && Math.random() < 0.008) {
      spawnLeaves(1)
    }

    // Shake animation
    if (shakeTimeRef.current > 0) {
      const progress = 1 - shakeTimeRef.current / 24
      shakeRef.current = Math.sin(progress * Math.PI * 4) * 1.5 * (1 - progress)
      shakeTimeRef.current--
    } else {
      shakeRef.current = 0
    }

    animFrameRef.current = requestAnimationFrame(draw)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bloomType, stage, daysInactive, size, showBackground])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  const handleTap = useCallback(() => {
    if (!interactive) return
    const now = Date.now()
    if (now - lastCooldownRef.current < 2000) return
    lastCooldownRef.current = now
    shakeTimeRef.current = 24
    spawnLeaves(3 + Math.floor(Math.random() * 3))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive])

  return (
    <canvas
      ref={canvasRef}
      width={W * Math.ceil(size / W)}
      height={H * Math.ceil(size / W)}
      style={{
        width: size,
        height: Math.round(size * (H / W)),
        imageRendering: 'pixelated',
        cursor: interactive ? 'pointer' : 'default',
        opacity,
      }}
      className={className}
      onClick={handleTap}
      title={`${palette.nameCn} (${palette.name})`}
      aria-label={`${palette.nameCn}植物图示`}
    />
  )
}
