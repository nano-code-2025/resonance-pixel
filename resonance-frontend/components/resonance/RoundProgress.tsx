"use client"

const ROUNDS = [
  { label: '初见', emoji: '☕' },
  { label: '深聊', emoji: '🌿' },
  { label: '见见我的圈子', emoji: '✨' },
]

interface RoundProgressProps {
  currentRound: 0 | 1 | 2 | 3
  questionProgress: number // 0-5
  totalQuestions: number
}

export function RoundProgress({ currentRound, questionProgress, totalQuestions }: RoundProgressProps) {
  return (
    <div>
      {/* Milestone row */}
      <div className="flex items-center mb-1">
        {ROUNDS.map((round, i) => {
          const done = i < currentRound
          const active = i === currentRound - 1 || (currentRound === 0 && i === 0)
          return (
            <div key={round.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 0, // pixel-sharp
                    background: done ? '#C4956A' : 'transparent',
                    border: `2px solid ${done || active ? '#C4956A' : '#C5C1BB'}`,
                    boxShadow: active ? '0 0 0 3px rgba(196,149,106,0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {done && (
                    <div style={{ width: 6, height: 6, background: '#FBF9F6' }} />
                  )}
                  {active && !done && (
                    <div style={{ width: 4, height: 4, background: '#C4956A' }} />
                  )}
                </div>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  color: done || active ? '#C4956A' : '#9E9A94',
                  marginTop: 3,
                  whiteSpace: 'nowrap',
                }}>
                  {round.label}
                </span>
              </div>
              {i < 2 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  background: i < currentRound ? '#C4956A' : '#DDD9D3',
                  marginBottom: 14,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Sub-progress bar */}
      {totalQuestions > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <div style={{ flex: 1, height: 4, background: '#DDD9D3', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 0, top: 0, height: '100%',
                width: `${(questionProgress / totalQuestions) * 100}%`,
                background: '#C4956A',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)', color: '#6B6966', flexShrink: 0 }}>
            {questionProgress}/{totalQuestions}
          </span>
        </div>
      )}
    </div>
  )
}
