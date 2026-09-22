"use client"

import { useEffect, useRef } from 'react'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getSkyColor(hour: number): string {
  if (hour >= 5 && hour < 7) return '#D4915A'
  if (hour >= 7 && hour < 17) return '#87AECF'
  if (hour >= 17 && hour < 19) return '#8B6B9A'
  return '#2B3A67'
}

export function LoginHeroCanvas({ size = 200 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const starsRef = useRef<{ x: number; y: number; phase: number }[]>([])
  const firefliesRef = useRef<{ x: number; y: number; vx: number; vy: number; phase: number }[]>([])

  const W = 28
  const H = 28

  useEffect(() => {
    starsRef.current = Array.from({ length: 18 }, (_, i) => ({
      x: (i * 7 + 3) % W,
      y: (i * 5 + 2) % Math.round(H * 0.5),
      phase: (i * 1.1) % (Math.PI * 2),
    }))
    firefliesRef.current = Array.from({ length: 4 }, (_, i) => ({
      x: 8 + i * 4 + Math.random() * 2,
      y: 12 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.04,
      phase: i * 1.5,
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    const scale = size / W

    function px(x: number, y: number, w: number, h: number, color: string) {
      ctx!.fillStyle = color
      ctx!.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(w * scale), Math.round(h * scale))
    }

    function draw() {
      const hour = new Date().getHours() + new Date().getMinutes() / 60
      const t = Date.now() / 1000
      const night = hour >= 19 || hour < 5
      const sky = getSkyColor(hour)

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      // Sky
      ctx!.fillStyle = sky
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      // Ghibli-style circular glow behind scene
      const glowGrad = ctx!.createRadialGradient(
        Math.round(14 * scale), Math.round(18 * scale), 0,
        Math.round(14 * scale), Math.round(18 * scale), Math.round(12 * scale)
      )
      glowGrad.addColorStop(0, hexToRgba('#F0EDE8', night ? 0.12 : 0.08))
      glowGrad.addColorStop(1, 'transparent')
      ctx!.fillStyle = glowGrad
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      // Stars
      if (night) {
        starsRef.current.forEach(star => {
          star.phase += 0.015
          const alpha = 0.3 + Math.sin(star.phase) * 0.45
          px(star.x, star.y, 1, 1, hexToRgba('#F0EDE8', Math.max(0, alpha)))
        })
      }

      // Ground
      px(0, 24, W, 4, '#4A7C59')
      px(0, 25, W, 3, '#3D6B48')
      // Grass detail
      px(2, 23, 1, 1, '#4A7C59')
      px(5, 23, 1, 1, '#4A7C59')
      px(8, 23, 1, 1, '#6B9E5E')
      px(11, 23, 1, 1, '#4A7C59')
      px(15, 23, 1, 1, '#6B9E5E')
      px(19, 23, 1, 1, '#4A7C59')
      px(22, 23, 1, 1, '#4A7C59')
      px(25, 23, 1, 1, '#6B9E5E')

      // Large Ghibli tree (left of center)
      // Trunk
      px(10, 18, 2, 6, '#8B6B4A')
      px(11, 16, 1, 2, '#8B6B4A')
      px(9, 19, 1, 3, '#6B5038')
      // Root
      px(8, 23, 2, 1, '#6B5038')
      px(12, 23, 2, 1, '#6B5038')

      // Canopy layers
      px(7, 14, 8, 2, '#3D6B48')
      px(6, 12, 10, 3, '#4A7C59')
      px(5, 10, 12, 3, '#4A7C59')
      px(7, 8, 8, 3, '#6B9E5E')
      px(8, 7, 6, 2, '#6B9E5E')
      px(9, 6, 4, 2, '#4A7C59')
      // Leaf detail
      px(5, 11, 1, 1, '#6B9E5E')
      px(16, 12, 1, 1, '#3D6B48')
      px(8, 9, 1, 1, '#6B9E5E')
      px(14, 10, 1, 1, '#3D6B48')

      // Small character sitting under tree (right side of trunk)
      const sway = Math.sin(t * 0.4) * 0.3
      // Body
      px(14 + sway, 21, 2, 2, '#C4956A') // torso (amber)
      // Head
      px(14 + sway, 19, 2, 2, '#E8C4A0') // skin
      // Hair
      px(14 + sway, 19, 2, 1, '#C46B4A') // warm red-brown hair
      // Legs
      px(14 + sway, 23, 1, 1, '#4F4D4A')
      px(15 + sway, 23, 1, 1, '#4F4D4A')

      // Moon or sun
      if (night) {
        // Moon
        px(22, 3, 3, 3, '#F0EDE8')
        px(22, 3, 1, 1, sky)
        px(23, 3, 1, 1, sky)
      } else if (hour >= 7 && hour < 17) {
        // Sun (top right)
        px(23, 2, 2, 2, '#E4B858')
        px(22, 3, 1, 1, '#E4B858')
        px(25, 3, 1, 1, '#E4B858')
        px(23, 1, 1, 1, '#E4B858')
        px(23, 4, 1, 1, '#E4B858')
      }

      // Fireflies
      if (night) {
        firefliesRef.current.forEach(ff => {
          ff.phase += 0.04
          ff.x += ff.vx + Math.sin(t * 0.3 + ff.phase) * 0.03
          ff.y += ff.vy
          if (ff.x < 6) ff.vx += 0.01
          if (ff.x > 22) ff.vx -= 0.01
          if (ff.y < 12) ff.vy += 0.01
          if (ff.y > 22) ff.vy -= 0.01
          const alpha = 0.4 + Math.sin(ff.phase * 2) * 0.4
          px(Math.round(ff.x), Math.round(ff.y), 1, 1, hexToRgba('#F0EDE8', Math.max(0, alpha)))
        })
      }

      // Distant small tree (right)
      px(22, 20, 1, 4, '#6B5038')
      px(20, 17, 5, 4, '#4A7C59')
      px(21, 16, 3, 2, '#6B9E5E')

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [size, W, H])

  return (
    <canvas
      ref={canvasRef}
      width={W * Math.ceil(size / W)}
      height={H * Math.ceil(size / W)}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      aria-label="像素风格插画：一个小角色坐在大树下，仰望星空"
      className="pixel-art"
    />
  )
}
