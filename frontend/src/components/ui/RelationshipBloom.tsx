/**
 * RelationshipBloom — a living pixel-art plant that grows with each relationship.
 *
 * Each match_id seeds a unique plant shape + palette. As rounds progress
 * (seed → sprout → tree → flowers → full bloom), the plant grows.
 * If the relationship stagnates, it desaturates and fades.
 * If closed, it withers to grayscale.
 *
 * Design principle: "每一段缘分都是一株独特的花" — seeing it grow
 * motivates users to keep going. Seeing it wilt creates urgency.
 */
import { useRef, useEffect, useMemo } from "react";

/**
 * Plant species from the Pixel Plant Library (12 species).
 * Each species has unique growth form, colors, and particle effects.
 * See docs/frontend-design-spec.md section 5.2.1 for full catalog.
 */
type BloomSpecies =
  | "sakura" | "rose" | "wisteria" | "peony" | "lotus"
  | "oak" | "sunflower" | "lavender" | "dandelion"
  | "plumeria" | "bougainvillea" | "glow_mushroom";

interface Props {
  matchId: string;
  round: number; // 0 = just matched, 1, 2, 3
  status: "active" | "offer_pending" | "confirmed" | "closed";
  bloomType?: BloomSpecies | string; // plant species — defaults to palette-only variation
  daysSinceLastActivity?: number;
  size?: number; // visual width in px (default 140)
}

// --- Seeded PRNG (deterministic per match) ---
function createRNG(seed: number) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// --- Palettes: each relationship gets one ---
const PALETTES = [
  {
    // Warm amber
    ground: ["#2D1B0E", "#3D2B1E", "#251509"],
    stem: "#4A6A3A",
    leaf: ["#5A8A4A", "#6A9A5A", "#4A7A3A"],
    flower: ["#C4956A", "#E8A87C", "#D4A57A"],
    light: "#FFF4E0",
  },
  {
    // Cool lavender
    ground: ["#1B1B2D", "#2B1E30", "#120E22"],
    stem: "#3A5A6A",
    leaf: ["#4A7A8A", "#5A8A9A", "#3A6A7A"],
    flower: ["#9B6ABB", "#BB8ADB", "#AB7ACB"],
    light: "#F0E8FF",
  },
  {
    // Rose pink
    ground: ["#2D1B20", "#3D2530", "#1D0B10"],
    stem: "#4A6A4A",
    leaf: ["#5A8A5A", "#6A9A6A", "#4A7A4A"],
    flower: ["#C46A8B", "#E48AAB", "#D47A9B"],
    light: "#FFE8F0",
  },
  {
    // Golden
    ground: ["#2D2010", "#3D3020", "#1D1000"],
    stem: "#5A7A3A",
    leaf: ["#6A9A4A", "#7AAA5A", "#5A8A3A"],
    flower: ["#D4A040", "#E4B858", "#C49030"],
    light: "#FFFBE0",
  },
  {
    // Teal
    ground: ["#0E2D2D", "#1E3D35", "#002520"],
    stem: "#3A6A5A",
    leaf: ["#4A8A7A", "#5A9A8A", "#3A7A6A"],
    flower: ["#6ABBC4", "#8ADBE4", "#7ACBD4"],
    light: "#E0FFFE",
  },
];

const GW = 20; // grid width (pixels)
const GH = 28; // grid height

const STAGE_LABELS = ["种下了种子", "初见 · 萌芽", "深聊 · 生长", "花开了", "繁花盛开"];

function hexToRgb(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function RelationshipBloom({
  matchId,
  round,
  status,
  bloomType: _bloomType,  // TODO: Phase 2 — species-specific rendering (Terraria-style)
  daysSinceLastActivity = 0,
  size = 140,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seed = useMemo(() => hashStr(matchId), [matchId]);
  const pal = useMemo(() => PALETTES[seed % PALETTES.length], [seed]);

  const stage = useMemo(() => {
    if (status === "confirmed") return 4;
    if (status === "closed") return -1;
    return round;
  }, [round, status]);

  const vitality = useMemo(() => {
    if (status === "confirmed") return 1.0;
    if (status === "closed") return 0.12;
    if (daysSinceLastActivity <= 3) return 1.0;
    if (daysSinceLastActivity <= 7) return 0.65;
    if (daysSinceLastActivity <= 14) return 0.35;
    return 0.15;
  }, [status, daysSinceLastActivity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const px = size / GW;
    canvas.width = size;
    canvas.height = Math.round(size * (GH / GW));

    // --- helpers ---
    const applyColor = (hex: string, alpha: number) => {
      const [r, g, b] = hexToRgb(hex);
      const a = alpha * (stage === -1 ? 0.4 : 1);
      if (vitality >= 1.0 && stage >= 0) return `rgba(${r},${g},${b},${a})`;
      // desaturate
      const gray = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
      const v = stage === -1 ? 0 : vitality;
      const mr = Math.round(r * v + gray * (1 - v));
      const mg = Math.round(g * v + gray * (1 - v));
      const mb = Math.round(b * v + gray * (1 - v));
      return `rgba(${mr},${mg},${mb},${a})`;
    };

    const drawPx = (x: number, y: number, hex: string, alpha = 1.0) => {
      if (x < 0 || x >= GW || y < 0 || y >= GH) return;
      ctx.fillStyle = applyColor(hex, alpha);
      ctx.fillRect(Math.round(x * px), Math.round(y * px), Math.ceil(px), Math.ceil(px));
    };

    // --- separate RNG streams so adding flowers doesn't shift leaf positions ---
    const groundRng = createRNG(seed);
    const starRng = createRNG(seed + 100);
    const stemRng = createRNG(seed + 200);
    const leafRng = createRNG(seed + 300);
    const flowerRng = createRNG(seed + 400);
    const glowRng = createRNG(seed + 500);

    // 1. Sky background
    ctx.fillStyle = "#0D0D1A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Stars
    const starCount = 6 + (stage >= 4 ? 10 : stage >= 0 ? stage * 2 : 0);
    for (let i = 0; i < starCount; i++) {
      const sx = Math.floor(starRng() * GW);
      const sy = Math.floor(starRng() * (GH - 7));
      drawPx(sx, sy, pal.light, 0.08 + starRng() * 0.18);
    }

    // 3. Ground (bottom 3 rows)
    for (let y = GH - 3; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        if (groundRng() < 0.88) {
          drawPx(x, y, pal.ground[Math.floor(groundRng() * pal.ground.length)]);
        }
      }
    }

    // --- Closed: only ground + faded stars ---
    if (stage < 0) return;

    const cx = Math.floor(GW / 2);
    const groundY = GH - 4;

    // 4. Seed (always drawn — it's the root of the plant)
    drawPx(cx, groundY, "#5A4A3A");
    drawPx(cx - 1, groundY, pal.ground[0], 0.7);
    drawPx(cx + 1, groundY, pal.ground[0], 0.7);

    // Seed glow (stage 0 only)
    if (stage === 0) {
      drawPx(cx, groundY - 1, pal.flower[0], 0.35);
      drawPx(cx - 1, groundY - 1, pal.flower[0], 0.15);
      drawPx(cx + 1, groundY - 1, pal.flower[0], 0.15);
      drawPx(cx, groundY - 2, pal.light, 0.08);
      return; // seed stage — done
    }

    // 5. Stem (stage 1+)
    const stemH = [0, 5, 9, 13, 16][Math.min(stage, 4)];
    let sx = cx;
    const stemPts: { x: number; y: number }[] = [];

    for (let i = 0; i < stemH; i++) {
      drawPx(sx, groundY - i, pal.stem);
      stemPts.push({ x: sx, y: groundY - i });
      if (i > 2 && i % 3 === 0 && stemRng() > 0.45) {
        sx += stemRng() > 0.5 ? 1 : -1;
        sx = Math.max(cx - 2, Math.min(cx + 2, sx));
      }
    }

    // 6. Leaves (stage 1+)
    const leafCount = [0, 3, 6, 8, 10][Math.min(stage, 4)];
    for (let i = 0; i < leafCount; i++) {
      const ai = 2 + Math.floor(leafRng() * Math.max(1, stemPts.length - 3));
      const pt = stemPts[Math.min(ai, stemPts.length - 1)];
      if (!pt) continue;
      const dir = leafRng() > 0.5 ? -1 : 1;
      const lc = pal.leaf[Math.floor(leafRng() * pal.leaf.length)];

      drawPx(pt.x + dir, pt.y, lc);
      drawPx(pt.x + dir * 2, pt.y, lc, 0.8);
      if (stage >= 2) {
        drawPx(pt.x + dir, pt.y - 1, lc, 0.65);
        if (leafRng() > 0.4) drawPx(pt.x + dir * 2, pt.y - 1, lc, 0.45);
      }
      if (stage >= 3 && leafRng() > 0.5) {
        drawPx(pt.x + dir * 3, pt.y, lc, 0.4);
      }
    }

    // 7. Flowers (stage 2+)
    if (stage >= 2) {
      const fCount = [0, 0, 2, 4, 7][Math.min(stage, 4)];
      for (let i = 0; i < fCount; i++) {
        const ai = Math.max(0, stemPts.length - 2 - Math.floor(flowerRng() * Math.min(6, stemPts.length)));
        const pt = stemPts[Math.max(0, ai)];
        if (!pt) continue;
        const dx = (flowerRng() > 0.5 ? -1 : 1) * (1 + Math.floor(flowerRng() * 2));
        const dy = -Math.floor(flowerRng() * 2);
        const fc = pal.flower[Math.floor(flowerRng() * pal.flower.length)];
        const fx = pt.x + dx;
        const fy = pt.y + dy;

        // Cross-shaped blossom
        drawPx(fx, fy, fc);
        drawPx(fx - 1, fy, fc, 0.8);
        drawPx(fx + 1, fy, fc, 0.8);
        drawPx(fx, fy - 1, fc, 0.75);
        if (stage >= 3) {
          drawPx(fx, fy + 1, fc, 0.55);
          drawPx(fx - 1, fy - 1, fc, 0.35);
          drawPx(fx + 1, fy - 1, fc, 0.35);
        }
        if (stage >= 4) {
          // Larger petals for full bloom
          drawPx(fx - 2, fy, fc, 0.3);
          drawPx(fx + 2, fy, fc, 0.3);
          drawPx(fx, fy - 2, fc, 0.25);
        }
      }
    }

    // 8. Crown (stage 3+): large flower at the top
    if (stage >= 3 && stemPts.length > 0) {
      const top = stemPts[stemPts.length - 1];
      const fc = pal.flower[0];
      drawPx(top.x, top.y - 1, fc);
      drawPx(top.x - 1, top.y - 1, fc, 0.85);
      drawPx(top.x + 1, top.y - 1, fc, 0.85);
      drawPx(top.x, top.y - 2, fc, 0.7);
      drawPx(top.x - 1, top.y - 2, fc, 0.4);
      drawPx(top.x + 1, top.y - 2, fc, 0.4);
      if (stage >= 4) {
        drawPx(top.x, top.y - 3, pal.light, 0.5);
        drawPx(top.x - 2, top.y - 1, fc, 0.4);
        drawPx(top.x + 2, top.y - 1, fc, 0.4);
      }
    }

    // 9. Radiant glow (stage 4: confirmed 在一起)
    if (stage >= 4) {
      for (let i = 0; i < 18; i++) {
        const gx = Math.floor(glowRng() * GW);
        const gy = Math.floor(glowRng() * (GH - 5));
        drawPx(gx, gy, pal.light, 0.12 + glowRng() * 0.22);
      }
      // Halo around crown
      if (stemPts.length > 0) {
        const top = stemPts[stemPts.length - 1];
        for (let dx = -3; dx <= 3; dx++) {
          for (let dy = -4; dy <= 0; dy++) {
            if (Math.abs(dx) + Math.abs(dy) <= 4 && glowRng() > 0.3) {
              drawPx(top.x + dx, top.y + dy, pal.light, 0.06 + glowRng() * 0.1);
            }
          }
        }
      }
    }
  }, [seed, pal, stage, vitality, size]);

  const label =
    status === "closed"
      ? "缘分止步"
      : status === "offer_pending"
        ? "等待回应..."
        : STAGE_LABELS[Math.max(0, Math.min(stage, 4))];

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: Math.round(size * (GH / GW)),
          imageRendering: "pixelated",
        }}
      />
      <span className="text-[10px] font-mono text-[#A09CA0]">{label}</span>
    </div>
  );
}
