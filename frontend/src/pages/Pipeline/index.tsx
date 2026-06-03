import useSWR from "swr";
import { api } from "../../services/api";
import { RelationshipBloom } from "../../components/ui/RelationshipBloom";
import { RoundProgress } from "../../components/ui/RoundProgress";

interface PipelineEntry {
  match_id: string;
  round: number;
  status: string;
  other_city: string | null;
  other_gender: string | null;
  other_personality_tags: string[] | null;
  questions_completed?: number;
}

export function PipelinePage() {
  const { data, isLoading } = useSWR("/pipeline", () =>
    api.getPipeline() as Promise<{ pursuing: PipelineEntry[]; being_found: PipelineEntry[] }>
  );

  if (isLoading) {
    return (
      <div className="pixel-grid min-h-screen flex items-center justify-center text-[#A09CA0] font-mono text-sm">
        加载管道...
      </div>
    );
  }

  const all = [...(data?.pursuing ?? []), ...(data?.being_found ?? [])];
  const isPursuing = new Set((data?.pursuing ?? []).map(e => e.match_id));

  const renderEntry = (e: PipelineEntry) => {
    const s = e.status as "active" | "offer_pending" | "confirmed" | "closed";
    const qTotal = e.round === 1 ? 12 : e.round === 2 ? 12 : 12;

    return (
      <div key={e.match_id} className="pixel-border bg-[#14142A] p-4">
        {/* Bloom + info row */}
        <div className="flex gap-4 items-start">
          <RelationshipBloom
            matchId={e.match_id}
            round={e.round}
            status={s}
            size={100}
          />
          <div className="flex-1 min-w-0 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#F0EDE8] text-sm font-mono">
                {e.other_city ?? "未知城市"}
              </span>
              <span className="text-[10px] font-mono px-1 border border-[#2A2A4A] text-[#A09CA0]">
                {isPursuing.has(e.match_id) ? "我发起" : "TA发起"}
              </span>
            </div>
            {(e.other_personality_tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {(e.other_personality_tags ?? []).slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-[#A09CA0] font-mono border border-[#2A2A4A] px-1">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <RoundProgress
            currentRound={e.round}
            status={s}
            questionsCompleted={e.questions_completed ?? 0}
            questionsTotal={qTotal}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="pixel-grid min-h-screen p-4 pb-20">
      <h1 className="text-[#C4956A] font-mono text-base mb-4">我的缘分</h1>

      {all.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#A09CA0] text-sm font-mono mb-2">暂无进行中的连接</p>
          <p className="text-[#2A2A4A] text-xs font-mono">
            去「发现」页面找到你的第一段缘分
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {all.map(renderEntry)}
      </div>
    </div>
  );
}
