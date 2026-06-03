import { useMemo } from "react";

interface Props {
  userId: string;
  size?: number;      // grid cells (default 8)
  pixelSize?: number; // px per cell (default 8)
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const PALETTES = [
  ["#C4956A", "#8B6A8B", "#4A6A8B"],
  ["#8B4A6A", "#6A8B4A", "#C4A06A"],
  ["#4A8B8B", "#8B8B4A", "#6A4A8B"],
  ["#C46A8B", "#6A8BC4", "#8BC46A"],
];

const FACE_TEMPLATES = [
  [0,0,1,1,1,1,0,0,
   0,1,0,0,0,0,1,0,
   1,0,1,0,0,1,0,1,
   1,0,0,0,0,0,0,1,
   1,0,1,0,0,1,0,1,
   1,0,0,1,1,0,0,1,
   0,1,0,0,0,0,1,0,
   0,0,1,1,1,1,0,0],
  [0,1,1,0,0,1,1,0,
   1,0,0,1,1,0,0,1,
   1,0,1,0,0,1,0,1,
   1,0,0,0,0,0,0,1,
   1,0,1,1,1,1,0,1,
   1,0,0,0,0,0,0,1,
   0,1,0,0,0,0,1,0,
   0,0,1,1,1,1,0,0],
];

export function PixelAvatar({ userId, size = 8, pixelSize = 8 }: Props) {
  const { palette, template } = useMemo(() => {
    const h = hashCode(userId);
    const palette = PALETTES[h % PALETTES.length];
    const template = FACE_TEMPLATES[Math.floor(h / PALETTES.length) % FACE_TEMPLATES.length];
    return { palette, template };
  }, [userId]);

  const totalSize = size * pixelSize;

  return (
    <div
      style={{
        width: totalSize,
        height: totalSize,
        display: "grid",
        gridTemplateColumns: `repeat(${size}, ${pixelSize}px)`,
      }}
    >
      {template.slice(0, size * size).map((on, i) => (
        <div
          key={i}
          style={{
            width: pixelSize,
            height: pixelSize,
            backgroundColor: on ? palette[i % palette.length] : "transparent",
          }}
        />
      ))}
    </div>
  );
}
