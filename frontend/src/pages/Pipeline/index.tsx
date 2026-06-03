import { useState } from "react";
import useSWR, { mutate } from "swr";
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

interface SetupStatus {
  my_vote: string | null;
  other_voted: boolean;
  resolved_format: string | null;
  scheduled_at: string | null;
}

const FORMAT_LABELS: Record<string, string> = {
  video: "视频通话",
  in_person: "线下见面",
  either: "都可以",
};

const RESOLVED_LABELS: Record<string, string> = {
  feishu_call: "飞书视频",
  in_person: "线下见面",
};

function MatchSetup({ matchId, onStartSession }: { matchId: string; onStartSession: (format: string) => void }) {
  const { data: status, mutate: refreshStatus } = useSWR<SetupStatus>(
    `/match-setup/${matchId}`,
    () => api.getSetupStatus(matchId) as Promise<SetupStatus>,
  );
  const [voting, setVoting] = useState(false);

  const vote = async (preference: string) => {
    setVoting(true);
    try {
      await api.voteFormat(matchId, preference);
      await refreshStatus();
    } finally {
      setVoting(false);
    }
  };

  if (!status) return <div className="text-[#2A2A4A] font-mono text-[10px]">加载中...</div>;

  // Step 1: Format vote
  if (!status.my_vote) {
    return (
      <div className="mt-3 pixel-border bg-[#0D0D1A] p-3">
        <p className="text-[#A09CA0] font-mono text-xs mb-2">选择见面方式</p>
        <div className="flex gap-2">
          {(["video", "in_person", "either"] as const).map((pref) => (
            <button
              key={pref}
              onClick={() => vote(pref)}
              disabled={voting}
              className="flex-1 py-2 border border-[#2A2A4A] text-[#A09CA0] font-mono text-[10px] hover:border-[#C4956A] hover:text-[#C4956A] transition-colors disabled:opacity-50"
            >
              {FORMAT_LABELS[pref]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Waiting for other person's vote
  if (!status.resolved_format) {
    return (
      <div className="mt-3 pixel-border bg-[#0D0D1A] p-3">
        <p className="text-[#A09CA0] font-mono text-xs">
          你选了「{FORMAT_LABELS[status.my_vote]}」
        </p>
        <p className="text-[#2A2A4A] font-mono text-[10px] mt-1">
          <span className="inline-block animate-pulse mr-1">●</span>
          等待对方选择...
        </p>
      </div>
    );
  }

  // Step 3: Both voted — show resolved format + start button
  return (
    <div className="mt-3 pixel-border bg-[#0D0D1A] p-3">
      <p className="text-[#A09CA0] font-mono text-xs mb-2">
        {RESOLVED_LABELS[status.resolved_format]}
        {status.scheduled_at && (
          <span className="ml-2 text-[#C4956A]">
            {new Date(status.scheduled_at).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </p>
      <button
        onClick={() => onStartSession(status.resolved_format!)}
        className="w-full pixel-btn bg-[#C4956A] text-[#0D0D1A] py-2.5 font-mono text-xs"
      >
        开始对话
      </button>
    </div>
  );
}

export function PipelinePage() {
  const { data, isLoading } = useSWR("/pipeline", () =>
    api.getPipeline() as Promise<{ pursuing: PipelineEntry[]; being_found: PipelineEntry[] }>
  );

  const startSession = async (matchId: string, format: string) => {
    const sessionType = format === "feishu_call" ? "feishu_call" : "in_person";
    const result = await api.createSession(matchId, sessionType);
    // Navigate to session via App-level callback
    const el = document.querySelector("[data-navigate-session]") as HTMLElement & { navigateToSession?: (id: string) => void };
    el?.navigateToSession?.(result.session_id);
  };

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
            questionsTotal={5}
          />
        </div>

        {/* Setup flow for active matches */}
        {s === "active" && (
          <MatchSetup
            matchId={e.match_id}
            onStartSession={(format) => startSession(e.match_id, format)}
          />
        )}
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
