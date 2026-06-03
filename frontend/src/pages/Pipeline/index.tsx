import useSWR from "swr";
import { api } from "../../services/api";
import { PixelAvatar } from "../../components/ui/PixelAvatar";

interface PipelineEntry {
  match_id: string;
  round: number;
  status: string;
  other_city: string | null;
  other_gender: string | null;
  other_personality_tags: string[] | null;
}

const ROUND_LABEL = ["", "初见", "深聊", "见见我的圈子"];
const STATUS_LABEL: Record<string, string> = {
  active: "进行中",
  offer_pending: "等待回应",
  confirmed: "在一起了",
};

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

  const renderEntry = (e: PipelineEntry, label: string) => (
    <div key={e.match_id} className="pixel-border bg-[#14142A] p-4 flex items-center gap-4">
      <PixelAvatar userId={e.match_id} pixelSize={5} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#C4956A] text-xs font-mono">{ROUND_LABEL[e.round]} · Round {e.round}</span>
          <span className="text-[#A09CA0] text-xs font-mono">{STATUS_LABEL[e.status] ?? e.status}</span>
        </div>
        <p className="text-[#A09CA0] text-xs font-mono">{e.other_city} · {label}</p>
      </div>
    </div>
  );

  return (
    <div className="pixel-grid min-h-screen p-4">
      <h1 className="text-[#C4956A] font-mono text-base mb-4">我的管道</h1>

      {(data?.pursuing ?? []).length > 0 && (
        <section className="mb-6">
          <h2 className="text-[#A09CA0] text-xs font-mono mb-3 uppercase tracking-wider">我在追求</h2>
          <div className="grid gap-3">
            {data?.pursuing.map(e => renderEntry(e, "我发起"))}
          </div>
        </section>
      )}

      {(data?.being_found ?? []).length > 0 && (
        <section>
          <h2 className="text-[#A09CA0] text-xs font-mono mb-3 uppercase tracking-wider">被找到了</h2>
          <div className="grid gap-3">
            {data?.being_found.map(e => renderEntry(e, "TA发起"))}
          </div>
        </section>
      )}

      {(data?.pursuing ?? []).length === 0 && (data?.being_found ?? []).length === 0 && (
        <p className="text-[#A09CA0] text-sm font-mono text-center py-12">暂无进行中的连接</p>
      )}
    </div>
  );
}
