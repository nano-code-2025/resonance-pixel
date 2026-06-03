/**
 * Demo page — showcases all visual components with mock data.
 * Navigate to /#demo to see this page.
 */
import { useState } from "react";
import { RelationshipBloom } from "../../components/ui/RelationshipBloom";
import { RoundProgress } from "../../components/ui/RoundProgress";
import { PixelAvatar } from "../../components/ui/PixelAvatar";

const MOCK_QUESTIONS = [
  { id: 1, text: "如果可以邀请世界上任何人共进晚餐，你会选择谁？" },
  { id: 4, text: "对你来说，一个完美的一天是什么样的？" },
  { id: 9, text: "你这辈子最感激什么？" },
  { id: 11, text: "用四分钟，尽可能详细地告诉对方你的人生故事。" },
  { id: 12, text: "如果明天早上你醒来拥有某种才能或能力，会是什么？" },
];

export function DemoPage() {
  const [demoQuestion, setDemoQuestion] = useState(0);
  const [typewriterKey, setTypewriterKey] = useState(0);

  const q = MOCK_QUESTIONS[demoQuestion];

  return (
    <div className="pixel-grid min-h-screen p-4 pb-8">
      <h1 className="text-[#C4956A] font-mono text-lg mb-1">Resonance 设计预览</h1>
      <p className="text-[#A09CA0] font-mono text-[10px] mb-6">所有组件的实际效果</p>

      {/* Section 1: Bloom growth stages */}
      <section className="mb-8">
        <h2 className="text-[#F0EDE8] font-mono text-sm mb-3 border-b border-[#2A2A4A] pb-1">
          🌱 Relationship Bloom — 缘分之花的生长过程
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "种子", round: 0, status: "active" as const },
            { label: "初见", round: 1, status: "active" as const },
            { label: "深聊", round: 2, status: "active" as const },
            { label: "花开了", round: 3, status: "active" as const },
            { label: "在一起", round: 3, status: "confirmed" as const },
            { label: "缘分止步", round: 2, status: "closed" as const },
          ].map((s, i) => (
            <div key={i} className="pixel-border bg-[#14142A] p-2 flex flex-col items-center">
              <RelationshipBloom
                matchId={`demo-match-${i}`}
                round={s.round}
                status={s.status}
                size={90}
              />
              <span className="text-[9px] font-mono text-[#C4956A] mt-1">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[#2A2A4A] font-mono text-[10px] mt-2">
          每个 match_id 生成独特的形状和配色。衰退时会褪色、枯萎。
        </p>
      </section>

      {/* Section 2: Bloom palette diversity */}
      <section className="mb-8">
        <h2 className="text-[#F0EDE8] font-mono text-sm mb-3 border-b border-[#2A2A4A] pb-1">
          🎨 每段缘分都是唯一的
        </h2>
        <div className="flex gap-2 overflow-x-auto py-1">
          {["alice-bob", "carol-dave", "eve-frank", "grace-heidi", "ivan-judy"].map(id => (
            <div key={id} className="shrink-0">
              <RelationshipBloom matchId={id} round={3} status="active" size={80} />
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Round Progress */}
      <section className="mb-8">
        <h2 className="text-[#F0EDE8] font-mono text-sm mb-3 border-b border-[#2A2A4A] pb-1">
          📊 Round Progress — 旅程进度
        </h2>
        <div className="space-y-4">
          {[
            { round: 1, status: "active" as const, q: 5, label: "Round 1 进行中" },
            { round: 2, status: "active" as const, q: 3, label: "Round 2 刚开始" },
            { round: 3, status: "offer_pending" as const, q: 10, label: "Round 3 + 等待回应" },
            { round: 3, status: "confirmed" as const, q: 12, label: "在一起了" },
          ].map((s, i) => (
            <div key={i} className="pixel-border bg-[#14142A] p-3">
              <span className="text-[10px] text-[#A09CA0] font-mono">{s.label}</span>
              <RoundProgress
                currentRound={s.round}
                status={s.status}
                questionsCompleted={s.q}
                questionsTotal={12}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Session question card (mock) */}
      <section className="mb-8">
        <h2 className="text-[#F0EDE8] font-mono text-sm mb-3 border-b border-[#2A2A4A] pb-1">
          💬 Session — 36问对话体验
        </h2>
        <div className="relative">
          {/* Background bloom */}
          <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
            <RelationshipBloom matchId="demo-session" round={1} status="active" size={260} />
          </div>

          <div className="relative z-10">
            {/* Question progress dots */}
            <div className="flex gap-0.5 mb-4">
              {MOCK_QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 ${
                    i < demoQuestion ? "bg-[#C4956A]" : i === demoQuestion ? "bg-[#C4956A]/50" : "bg-[#2A2A4A]"
                  }`}
                />
              ))}
            </div>

            {/* Question number */}
            <div className="text-center mb-3">
              <span className="text-[#2A2A4A] font-mono text-xs">Q{q.id}</span>
            </div>

            {/* Question card */}
            <div className="pixel-border bg-[#14142A]/90 p-8 mb-4">
              <p key={typewriterKey} className="text-[#F0EDE8] text-lg leading-relaxed font-mono text-center typewriter">
                {q.text}
              </p>
            </div>

            <p className="text-center text-[10px] text-[#2A2A4A] font-mono mb-3">
              不用急，慢慢聊
            </p>

            {/* Controls */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => {
                  setDemoQuestion(Math.max(0, demoQuestion - 1));
                  setTypewriterKey(k => k + 1);
                }}
                className="flex-1 py-2.5 border border-[#2A2A4A] text-[#A09CA0] font-mono text-xs"
              >
                上一题
              </button>
              <button
                onClick={() => {
                  setDemoQuestion(Math.min(MOCK_QUESTIONS.length - 1, demoQuestion + 1));
                  setTypewriterKey(k => k + 1);
                }}
                className="flex-[2] pixel-btn bg-[#C4956A] text-[#0D0D1A] py-2.5 font-mono text-sm"
              >
                下一题 →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Pixel Avatars */}
      <section className="mb-8">
        <h2 className="text-[#F0EDE8] font-mono text-sm mb-3 border-b border-[#2A2A4A] pb-1">
          👤 Pixel Avatar — 像素头像
        </h2>
        <div className="flex gap-3 items-end">
          {["user-alice", "user-bob", "user-carol", "user-dave", "user-eve"].map(id => (
            <div key={id} className="flex flex-col items-center">
              <PixelAvatar userId={id} pixelSize={7} />
              <span className="text-[9px] text-[#2A2A4A] font-mono mt-1">{id.split("-")[1]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 6: Pipeline card mock */}
      <section className="mb-8">
        <h2 className="text-[#F0EDE8] font-mono text-sm mb-3 border-b border-[#2A2A4A] pb-1">
          🔗 Pipeline Card — 管道中的缘分卡片
        </h2>
        <div className="pixel-border bg-[#14142A] p-4">
          <div className="flex gap-4 items-start">
            <RelationshipBloom matchId="pipeline-demo" round={2} status="active" size={100} />
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#F0EDE8] text-sm font-mono">上海</span>
                <span className="text-[10px] font-mono px-1 border border-[#2A2A4A] text-[#A09CA0]">我发起</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {["理性冷静", "爱好运动", "事业心强"].map(tag => (
                  <span key={tag} className="text-[10px] text-[#A09CA0] font-mono border border-[#2A2A4A] px-1">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <RoundProgress currentRound={2} status="active" questionsCompleted={7} questionsTotal={12} />
          </div>
        </div>
      </section>

      {/* Section 7: Decay states */}
      <section className="mb-8">
        <h2 className="text-[#F0EDE8] font-mono text-sm mb-3 border-b border-[#2A2A4A] pb-1">
          ⏳ 衰退效果 — 不活跃的花会枯萎
        </h2>
        <div className="flex gap-2 overflow-x-auto py-1">
          {[0, 3, 7, 14, 30].map(days => (
            <div key={days} className="shrink-0 flex flex-col items-center">
              <RelationshipBloom matchId="decay-demo" round={2} status="active" daysSinceLastActivity={days} size={80} />
              <span className="text-[9px] font-mono text-[#2A2A4A] mt-1">{days}天</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 8: Rating modal mock */}
      <section className="mb-8">
        <h2 className="text-[#F0EDE8] font-mono text-sm mb-3 border-b border-[#2A2A4A] pb-1">
          ⭐ 结束评分 — Session结束时的感受
        </h2>
        <div className="pixel-border bg-[#14142A] p-6 max-w-xs mx-auto">
          <div className="flex justify-center mb-4">
            <RelationshipBloom matchId="rating-demo" round={1} status="active" size={100} />
          </div>
          <h3 className="text-[#C4956A] font-mono text-sm text-center mb-1">今天聊得怎么样？</h3>
          <p className="text-[#2A2A4A] font-mono text-[10px] text-center mb-4">你的评分对方不会看到</p>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className={`w-9 h-9 flex items-center justify-center font-mono text-sm ${
                n <= 4 ? "bg-[#C4956A] text-[#0D0D1A] scale-110" : "border border-[#2A2A4A] text-[#A09CA0]"
              }`}>
                {n <= 4 ? "★" : n}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 border border-[#2A2A4A] text-[#A09CA0] font-mono text-xs">暂时到这里</button>
            <button className="flex-1 pixel-btn bg-[#C4956A] py-2.5 text-[#0D0D1A] font-mono text-xs">继续深聊 →</button>
          </div>
        </div>
      </section>
    </div>
  );
}
