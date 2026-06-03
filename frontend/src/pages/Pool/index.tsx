import { useState } from "react";
import useSWR from "swr";
import { api } from "../../services/api";
import { PixelAvatar } from "../../components/ui/PixelAvatar";

const TIER_PRICE = { standard: "¥19", personalized: "¥39", premium: "¥69" } as const;
type Tier = keyof typeof TIER_PRICE;

interface Candidate {
  candidate_id: string;
  score: number;
  highlights: string[];
  age: number | null;
  city: string | null;
  gender: string | null;
  personality_tags: string[] | null;
}

export function PoolPage() {
  const { data: candidates, isLoading } = useSWR<Candidate[]>("/pool", () => api.getPool() as Promise<Candidate[]>);
  const [approachTarget, setApproachTarget] = useState<Candidate | null>(null);
  const [draft, setDraft] = useState("");
  const [tier, setTier] = useState<Tier>("standard");
  const [sending, setSending] = useState(false);

  const handleDraft = async (candidate: Candidate) => {
    setApproachTarget(candidate);
    const result = await api.draftApproach(candidate.candidate_id, tier);
    setDraft(result.ai_message);
  };

  const handleSend = async () => {
    if (!approachTarget) return;
    setSending(true);
    try {
      await api.sendApproach(approachTarget.candidate_id, tier, draft);
      setApproachTarget(null);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pixel-grid min-h-screen flex items-center justify-center text-[#A09CA0] font-mono text-sm">
        加载候选人池...
      </div>
    );
  }

  return (
    <div className="pixel-grid min-h-screen p-4">
      <h1 className="text-[#C4956A] font-mono text-base mb-4">候选人池</h1>
      <div className="grid gap-3">
        {(candidates ?? []).map((c) => (
          <div key={c.candidate_id} className="pixel-border bg-[#14142A] p-4 flex items-center gap-4">
            <PixelAvatar userId={c.candidate_id} pixelSize={6} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#A09CA0] text-xs font-mono">{c.city} · {c.age}岁</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2"
                      style={{ background: i < Math.round(c.score / 10) ? "#C4956A" : "#2A2A4A" }}
                    />
                  ))}
                </div>
                <span className="text-[#C4956A] text-xs font-mono">{c.score}</span>
              </div>
              <div className="text-xs text-[#A09CA0] font-mono space-y-0.5">
                {c.highlights?.map((h, i) => <div key={i}>· {h}</div>)}
              </div>
            </div>
            <button
              onClick={() => handleDraft(c)}
              className="pixel-btn pixel-border px-3 py-1.5 text-xs text-[#C4956A] hover:bg-[#C4956A] hover:text-[#0D0D1A] transition-colors font-mono shrink-0"
            >
              联系TA
            </button>
          </div>
        ))}
        {(candidates ?? []).length === 0 && (
          <p className="text-[#A09CA0] text-sm font-mono text-center py-12">暂无候选人，完善档案后重试</p>
        )}
      </div>

      {approachTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#14142A] pixel-border p-6 w-full max-w-sm">
            <h2 className="text-[#C4956A] mb-4 font-mono text-sm">AI 帮你开场</h2>
            <div className="flex gap-2 mb-4">
              {(Object.keys(TIER_PRICE) as Tier[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`pixel-btn pixel-border px-2 py-1 text-xs font-mono ${tier === t ? "bg-[#C4956A] text-[#0D0D1A]" : "text-[#A09CA0]"}`}
                >
                  {TIER_PRICE[t]}
                </button>
              ))}
            </div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full bg-[#0D0D1A] pixel-border p-3 text-sm font-mono text-[#F0EDE8] resize-none h-24 mb-4 focus:outline-none focus:border-[#C4956A]"
              maxLength={150}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setApproachTarget(null)}
                className="pixel-btn pixel-border px-4 py-2 text-xs text-[#A09CA0] flex-1 font-mono"
              >
                取消
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !draft}
                className="pixel-btn bg-[#C4956A] px-4 py-2 text-xs text-[#0D0D1A] flex-1 font-mono disabled:opacity-50"
              >
                {sending ? "发送中..." : "确认发送"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
