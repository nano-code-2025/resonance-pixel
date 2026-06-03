/**
 * Session page — the heart of Resonance.
 *
 * Two people sit together. The app guides them through Arthur Aron's
 * 36 progressive questions. A pixel-art plant grows in the background
 * as they answer, question by question.
 *
 * The experience should feel intimate, warm, unhurried — like a fairy tale.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../services/api";
import { RelationshipBloom } from "../../components/ui/RelationshipBloom";

interface Props {
  sessionId: string;
  onExit?: () => void;
}

interface SessionState {
  session_id: string;
  match_id: string;
  current_question_index: number;
  current_question: { id: number; zh: string; localized_zh: string } | null;
  questions_completed: number[];
  total_questions: number;
  round_number: number;
  is_host: boolean;
  session_type: string;
  feishu_meeting_url: string | null;
}

const ROUND_NAMES = ["", "初见", "深聊", "见见我的圈子"];
const ROUND_DURATIONS_MIN = [0, 45, 90, 0]; // 0 = no timer

// 7-segment pixel timer display
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Typewriter effect hook
function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;

    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done, skip: () => { setDisplayed(text); setDone(true); } };
}

export function SessionPage({ sessionId, onExit }: Props) {
  const [state, setState] = useState<SessionState | null>(null);
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [showTimerPrompt, setShowTimerPrompt] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(-1); // -1 = not started
  const startTimeRef = useRef<number>(0);
  const [transitioning, setTransitioning] = useState(false);

  const questionText = state?.current_question?.localized_zh || state?.current_question?.zh || "";
  const { displayed, done: typeDone, skip: skipType } = useTypewriter(questionText);

  // Fetch session state (polling for non-host)
  const fetchState = useCallback(async () => {
    const s = (await api.getSessionState(sessionId)) as unknown as SessionState;
    setState(s);
  }, [sessionId]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Timer countdown
  useEffect(() => {
    if (!state) return;
    const duration = ROUND_DURATIONS_MIN[state.round_number] * 60;
    if (duration <= 0) return; // no timer for Round 3

    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
      setTimerSeconds(duration);
    }

    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimerSeconds(remaining);
      if (remaining === 0) {
        setShowTimerPrompt(true);
        clearInterval(tick);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [state?.round_number]);

  // Advance to next question (host only)
  const advance = async () => {
    if (!state?.current_question) return;
    setTransitioning(true);
    await api.advanceQuestion(sessionId, state.current_question.id);
    setTimeout(async () => {
      await fetchState();
      setTransitioning(false);
    }, 300);
  };

  // Skip question (host only)
  const skipQ = async () => {
    setTransitioning(true);
    await api.skipQuestion(sessionId);
    setTimeout(async () => {
      await fetchState();
      setTransitioning(false);
    }, 300);
  };

  // End session
  const endSession = async (shouldAdvance: boolean) => {
    await api.endSession(sessionId, rating, shouldAdvance);
    setShowRating(false);
    onExit?.();
  };

  if (!state) {
    return (
      <div className="pixel-grid min-h-screen flex flex-col items-center justify-center">
        <div className="text-[#A09CA0] font-mono text-sm mb-4">准备中...</div>
        <div className="w-8 h-1 bg-[#2A2A4A]">
          <div className="h-full bg-[#C4956A] animate-pulse w-4" />
        </div>
      </div>
    );
  }

  const q = state.current_question;
  const progress = state.questions_completed.length;
  const total = state.total_questions;
  const roundName = ROUND_NAMES[state.round_number];
  const hasTimer = ROUND_DURATIONS_MIN[state.round_number] > 0;

  return (
    <div className="pixel-grid min-h-screen flex flex-col relative overflow-hidden">
      {/* Background bloom — large, behind everything */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <RelationshipBloom
          matchId={state.match_id}
          round={state.round_number}
          status="active"
          size={320}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-[#C4956A] font-mono text-sm">{roundName}</h1>
              <p className="text-[#2A2A4A] font-mono text-[10px]">
                第{state.round_number}轮 · {state.session_type === "feishu_call" ? "视频" : "面对面"}
              </p>
            </div>

            {/* Timer */}
            {hasTimer && timerSeconds >= 0 && (
              <div className={`font-mono text-lg tracking-widest ${
                timerSeconds <= 300 ? "text-[#E8A87C]" : "text-[#A09CA0]"
              }`}>
                {formatTime(timerSeconds)}
              </div>
            )}

            {/* Small bloom (top-right) */}
            <RelationshipBloom
              matchId={state.match_id}
              round={state.round_number}
              status="active"
              size={56}
            />
          </div>

          {/* Question progress dots */}
          <div className="flex gap-0.5">
            {Array.from({ length: total }).map((_, i) => {
              const isCompleted = i < progress;
              const isCurrent = i === state.current_question_index;
              return (
                <div
                  key={i}
                  className={`h-1 flex-1 transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#C4956A]"
                      : isCurrent
                        ? "bg-[#C4956A]/50"
                        : "bg-[#2A2A4A]"
                  }`}
                />
              );
            })}
          </div>
        </header>

        {/* Question area — centered, the emotional core */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-4">
          {q ? (
            <div
              className={`w-full max-w-sm transition-all duration-300 ${
                transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {/* Question number */}
              <div className="text-center mb-4">
                <span className="text-[#2A2A4A] font-mono text-xs">
                  Q{q.id}
                </span>
              </div>

              {/* Question card — large, centered, typewriter reveal */}
              <div className="pixel-border bg-[#14142A]/90 backdrop-blur-sm p-8">
                <p
                  className="text-[#F0EDE8] text-lg leading-relaxed font-mono text-center cursor-pointer"
                  onClick={() => !typeDone && skipType()}
                >
                  {displayed}
                  {!typeDone && <span className="animate-pulse text-[#C4956A]">▌</span>}
                </p>
              </div>

              {/* Gentle hint */}
              <p className="text-center text-[10px] text-[#2A2A4A] font-mono mt-3">
                不用急，慢慢聊
              </p>
            </div>
          ) : (
            /* All questions done */
            <div className="w-full max-w-sm text-center">
              <RelationshipBloom
                matchId={state.match_id}
                round={state.round_number}
                status="active"
                size={180}
              />
              <p className="text-[#F0EDE8] font-mono text-base mt-4 mb-1">
                本轮问题已全部聊完
              </p>
              <p className="text-[#A09CA0] font-mono text-xs">
                你们一起走过了 {progress} 个问题 ✦
              </p>
            </div>
          )}
        </main>

        {/* Controls — bottom */}
        <footer className="px-4 pb-6 pt-2">
          {state.is_host && q && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={skipQ}
                className="flex-1 py-2.5 border border-[#2A2A4A] text-[#A09CA0] font-mono text-xs"
              >
                跳过
              </button>
              <button
                onClick={advance}
                className="flex-[2] pixel-btn bg-[#C4956A] text-[#0D0D1A] py-2.5 font-mono text-sm"
              >
                下一题 →
              </button>
            </div>
          )}

          {!state.is_host && q && (
            <div className="text-center mb-2">
              <p className="text-[#A09CA0] text-xs font-mono">
                <span className="inline-block animate-pulse mr-1">●</span>
                等待对方切换题目
              </p>
            </div>
          )}

          {/* Feishu meeting link (if video call session) */}
          {state.feishu_meeting_url && (
            <a
              href={state.feishu_meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center mb-2 text-[#4A8A8A] text-xs font-mono underline"
            >
              打开飞书视频 →
            </a>
          )}

          <button
            onClick={() => setShowRating(true)}
            className="w-full py-2 border border-[#2A2A4A] text-[#A09CA0] font-mono text-xs"
          >
            结束今天
          </button>
        </footer>
      </div>

      {/* Timer prompt overlay */}
      {showTimerPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-40">
          <div className="bg-[#14142A] pixel-border p-6 w-full max-w-xs text-center">
            <p className="text-[#F0EDE8] font-mono text-sm mb-2">
              时间到了
            </p>
            <p className="text-[#A09CA0] font-mono text-xs mb-4">
              今天聊到这里？还是再继续一会儿？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowTimerPrompt(false); setShowRating(true); }}
                className="flex-1 py-2 border border-[#2A2A4A] text-[#A09CA0] font-mono text-xs"
              >
                结束
              </button>
              <button
                onClick={() => setShowTimerPrompt(false)}
                className="flex-1 pixel-btn bg-[#C4956A] py-2 text-[#0D0D1A] font-mono text-xs"
              >
                再聊一会儿
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#14142A] pixel-border p-6 w-full max-w-xs">
            {/* Bloom in rating modal */}
            <div className="flex justify-center mb-4">
              <RelationshipBloom
                matchId={state.match_id}
                round={state.round_number}
                status="active"
                size={100}
              />
            </div>

            <h2 className="text-[#C4956A] font-mono text-sm text-center mb-1">
              今天聊得怎么样？
            </h2>
            <p className="text-[#2A2A4A] font-mono text-[10px] text-center mb-4">
              你的评分对方不会看到
            </p>

            {/* Star rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`w-9 h-9 font-mono text-sm transition-all ${
                    rating >= n
                      ? "bg-[#C4956A] text-[#0D0D1A] scale-110"
                      : "border border-[#2A2A4A] text-[#A09CA0]"
                  }`}
                >
                  {rating >= n ? "★" : n}
                </button>
              ))}
            </div>

            {/* Decision */}
            <p className="text-[#A09CA0] font-mono text-[10px] text-center mb-3">
              想继续了解TA吗？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => endSession(false)}
                disabled={rating === 0}
                className="flex-1 py-2.5 border border-[#2A2A4A] text-[#A09CA0] font-mono text-xs disabled:opacity-30"
              >
                暂时到这里
              </button>
              <button
                onClick={() => endSession(true)}
                disabled={rating === 0}
                className="flex-1 pixel-btn bg-[#C4956A] py-2.5 text-[#0D0D1A] font-mono text-xs disabled:opacity-30"
              >
                继续深聊 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
