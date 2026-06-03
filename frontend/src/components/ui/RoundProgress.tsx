/**
 * RoundProgress — a fairy-tale progress bar showing the relationship journey.
 *
 * Three milestones (初见 → 深聊 → 见见我的圈子) connected by a pixel path.
 * Current round glows with the accent color. Future rounds are dim.
 * Completed rounds show a tiny checkmark.
 */

interface Props {
  currentRound: number; // 1, 2, or 3
  status: "active" | "offer_pending" | "confirmed" | "closed";
  questionsCompleted?: number; // within current round (0-12)
  questionsTotal?: number; // total for current round (12)
}

const ROUNDS = [
  { label: "初见", sub: "Q1-12 · 45min", icon: "🌱" },
  { label: "深聊", sub: "Q13-24 · 90min", icon: "🌿" },
  { label: "见见我的圈子", sub: "Q25-36", icon: "🌸" },
];

export function RoundProgress({
  currentRound,
  status,
  questionsCompleted = 0,
  questionsTotal = 12,
}: Props) {
  const isConfirmed = status === "confirmed";

  return (
    <div className="w-full px-2">
      {/* Milestone row */}
      <div className="flex items-center justify-between relative">
        {/* Connecting line behind milestones */}
        <div className="absolute top-3 left-6 right-6 h-px bg-[#2A2A4A]" />
        <div
          className="absolute top-3 left-6 h-px bg-[#C4956A] transition-all duration-500"
          style={{
            width: `${Math.min(100, ((currentRound - 1) / 2) * 100)}%`,
            maxWidth: "calc(100% - 3rem)",
          }}
        />

        {ROUNDS.map((r, i) => {
          const roundNum = i + 1;
          const isDone = currentRound > roundNum || isConfirmed;
          const isCurrent = currentRound === roundNum && !isConfirmed;
          const isFuture = currentRound < roundNum && !isConfirmed;

          return (
            <div key={i} className="flex flex-col items-center z-10" style={{ minWidth: 60 }}>
              {/* Dot */}
              <div
                className={`w-6 h-6 flex items-center justify-center text-xs font-mono border-2 transition-all ${
                  isDone
                    ? "bg-[#C4956A] border-[#C4956A] text-[#0D0D1A]"
                    : isCurrent
                      ? "bg-[#14142A] border-[#C4956A] text-[#C4956A] shadow-[0_0_8px_rgba(196,149,106,0.4)]"
                      : "bg-[#14142A] border-[#2A2A4A] text-[#2A2A4A]"
                }`}
              >
                {isDone ? "✓" : r.icon}
              </div>
              {/* Label */}
              <span
                className={`text-[10px] font-mono mt-1 ${
                  isCurrent
                    ? "text-[#C4956A]"
                    : isDone
                      ? "text-[#F0EDE8]"
                      : "text-[#2A2A4A]"
                }`}
              >
                {r.label}
              </span>
              {isFuture && (
                <span className="text-[8px] font-mono text-[#2A2A4A]">{r.sub}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Question progress within current round */}
      {!isConfirmed && status !== "closed" && questionsTotal > 0 && (
        <div className="mt-3 px-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-mono text-[#A09CA0]">
              本轮进度
            </span>
            <span className="text-[9px] font-mono text-[#C4956A]">
              {questionsCompleted}/{questionsTotal}
            </span>
          </div>
          <div className="h-1 bg-[#2A2A4A] w-full">
            <div
              className="h-full bg-[#C4956A] transition-all duration-300"
              style={{ width: `${(questionsCompleted / questionsTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Confirmed state */}
      {isConfirmed && (
        <div className="mt-3 text-center">
          <span className="text-[#C4956A] font-mono text-xs">在一起了 ✦</span>
        </div>
      )}
    </div>
  );
}
