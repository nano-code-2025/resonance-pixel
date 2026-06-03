import { useState } from "react";
import useSWR from "swr";
import { api } from "../../services/api";
import { PixelAvatar } from "../../components/ui/PixelAvatar";

const TIER_LABEL: Record<string, string> = {
  standard: "标准",
  personalized: "个性化",
  premium: "深度",
};

interface Approach {
  approach_id: string;
  ai_message: string;
  tier: string;
  created_at: string;
  initiator: {
    user_id: string;
    age: number | null;
    city: string | null;
    gender: string | null;
    personality_tags: string[] | null;
    selfie_url: string | null;
  };
}

export function InboxPage() {
  const { data, isLoading, mutate } = useSWR<Approach[]>(
    "/approaches/received",
    () => api.getReceivedApproaches()
  );
  const [responding, setResponding] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const respond = async (approachId: string, response: "accepted" | "declined") => {
    setResponding(approachId);
    try {
      await api.respondApproach(approachId, response);
      mutate(); // refresh list
    } finally {
      setResponding(null);
    }
  };

  if (isLoading) {
    return (
      <div className="pixel-grid min-h-screen flex items-center justify-center text-[#A09CA0] font-mono text-sm">
        加载收件箱...
      </div>
    );
  }

  const list = data ?? [];

  return (
    <div className="pixel-grid min-h-screen p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[#C4956A] font-mono text-base">收到的心意</h1>
        {list.length > 0 && (
          <span className="bg-[#C4956A] text-[#0D0D1A] text-xs font-mono px-2 py-0.5">
            {list.length}
          </span>
        )}
      </div>

      {list.length === 0 && (
        <p className="text-[#A09CA0] text-sm font-mono text-center py-12">
          暂无待回复的心意
        </p>
      )}

      <div className="grid gap-3">
        {list.map((a) => (
          <div key={a.approach_id} className="pixel-border bg-[#14142A]">
            {/* Header row */}
            <div className="flex items-center gap-3 p-4">
              {a.initiator.selfie_url ? (
                <img
                  src={a.initiator.selfie_url}
                  alt="avatar"
                  className="w-12 h-12 object-cover"
                />
              ) : (
                <PixelAvatar userId={a.initiator.user_id} pixelSize={6} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[#F0EDE8] text-sm font-mono">
                    {a.initiator.city} · {a.initiator.age}岁
                  </span>
                  <span className="text-[#2A2A4A] text-xs font-mono border border-[#2A2A4A] px-1">
                    {TIER_LABEL[a.tier] ?? a.tier}
                  </span>
                </div>
                {(a.initiator.personality_tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(a.initiator.personality_tags ?? []).slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] text-[#A09CA0] font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setExpanded(expanded === a.approach_id ? null : a.approach_id)}
                className="text-[#A09CA0] text-xs font-mono px-2"
              >
                {expanded === a.approach_id ? "收起" : "查看"}
              </button>
            </div>

            {/* Message */}
            {expanded === a.approach_id && (
              <div className="px-4 pb-4">
                <div className="bg-[#0D0D1A] border border-[#2A2A4A] p-3 mb-4">
                  <p className="text-[#F0EDE8] text-sm font-mono leading-relaxed">
                    {a.ai_message}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(a.approach_id, "declined")}
                    disabled={responding === a.approach_id}
                    className="flex-1 py-2 border border-[#2A2A4A] text-[#A09CA0] font-mono text-sm disabled:opacity-50"
                  >
                    婉拒
                  </button>
                  <button
                    onClick={() => respond(a.approach_id, "accepted")}
                    disabled={responding === a.approach_id}
                    className="flex-1 pixel-btn bg-[#C4956A] py-2 text-[#0D0D1A] font-mono text-sm disabled:opacity-50"
                  >
                    {responding === a.approach_id ? "处理中..." : "接受约会"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
