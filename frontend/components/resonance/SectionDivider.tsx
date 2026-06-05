"use client"

interface SectionDividerProps {
  label: string
  number?: string
}

export function SectionDivider({ label, number }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#9E9A94] font-mono text-[11px]">──</span>
      {number && (
        <span className="text-[#6B6966] font-mono text-[11px] uppercase tracking-[2px]">
          {number}
        </span>
      )}
      <span className="text-[#6B6966] font-mono text-[11px] uppercase tracking-[2px] whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#C5C1BB]" />
    </div>
  )
}
