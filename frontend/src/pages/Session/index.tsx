import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";

interface Props {
  sessionId: string;
}

interface SessionState {
  session_id: string;
  current_question_index: number;
  current_question: { id: number; zh: string; localized_zh: string } | null;
  questions_completed: number[];
  round_number: number;
  is_host: boolean;
  session_type: string;
}

export function SessionPage({ sessionId }: Props) {
  const [state, setState] = useState<SessionState | null>(null);
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const fetchState = useCallback(async () => {
    const s = await api.getSessionState(sessionId) as unknown as SessionState;
    setState(s);
  }, [sessionId]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const advance = async () => {
    if (!state?.current_question) return;
    await api.advanceQuestion(sessionId, state.current_question.id);
    await fetchState();
  };

  const endSession = async (shouldAdvance: boolean) => {
    await api.endSession(sessionId, rating, shouldAdvance);
    setShowRating(false);
  };

  if (!state) {
    return (
      <div className="pixel-grid min-h-screen flex items-center justify-center text-[#A09CA0] font-mono text-sm">
        加载中...
      </div>
    );
  }

  const q = state.current_question;
  const progress = state.questions_completed.length;
  const total = 12;

  return (
    <div className="pixel-grid min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex gap-1 mb-8">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1"
              style={{ background: i < progress ? "#C4956A" : "#2A2A4A" }}
            />
          ))}
        </div>

        {q ? (
          <div className="pixel-border bg-[#14142A] p-6 mb-6">
            <div className="text-[#A09CA0] text-xs mb-3 font-mono">Q{q.id} · 第{progress + 1}题</div>
            <p className="text-[#F0EDE8] text-base leading-relaxed font-mono">{q.localized_zh || q.zh}</p>
          </div>
        ) : (
          <div className="pixel-border bg-[#14142A] p-6 mb-6 text-center">
            <p className="text-[#A09CA0] font-mono text-sm">本轮问题已全部聊完 ✦</p>
          </div>
        )}

        {state.is_host && q && (
          <button onClick={advance} className="pixel-btn w-full bg-[#C4956A] text-[#0D0D1A] py-3 font-mono text-sm mb-3">
            下一题 →
          </button>
        )}
        {!state.is_host && (
          <p className="text-[#A09CA0] text-xs font-mono text-center mb-3">等待对方切换题目...</p>
        )}
        <button
          onClick={() => setShowRating(true)}
          className="pixel-btn w-full pixel-border text-[#A09CA0] py-2 font-mono text-sm"
        >
          结束今天
        </button>
      </div>

      {showRating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#14142A] pixel-border p-6 w-full max-w-xs">
            <h2 className="text-[#C4956A] mb-4 font-mono text-sm text-center">今天聊得怎么样？</h2>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`w-10 h-10 pixel-border font-mono text-sm ${rating >= n ? "bg-[#C4956A] text-[#0D0D1A]" : "text-[#A09CA0]"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => endSession(false)} className="pixel-btn flex-1 pixel-border py-2 text-xs text-[#A09CA0] font-mono">
                暂时到这里
              </button>
              <button onClick={() => endSession(true)} className="pixel-btn flex-1 bg-[#C4956A] py-2 text-xs text-[#0D0D1A] font-mono">
                继续深聊
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
