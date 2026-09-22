"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore, type BloomType } from '@/lib/store'
import { api } from '@/lib/api'
import { RelationshipBloom } from './RelationshipBloom'
import { RatingModal } from './RatingModal'

function useTypewriter(text: string, speed = 35) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return { displayed, done }
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function QuestionProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 5,
            background: i < current ? '#C4956A' : '#DDD9D3',
          }}
        />
      ))}
    </div>
  )
}

export function SessionPage() {
  const { currentSession, setCurrentSession, setPage, setRatingModalOpen, ratingModalOpen } = useAppStore()
  const [timerSeconds, setTimerSeconds] = useState(currentSession?.timerSeconds ?? 45 * 60)
  const [qIndex, setQIndex] = useState(currentSession?.questionIndex ?? 0)
  const [myAnswer, setMyAnswer] = useState('')
  const [answerExpanded, setAnswerExpanded] = useState(false)
  const [swapsLeft, setSwapsLeft] = useState(currentSession?.swapsRemaining ?? 2)
  const [allDone, setAllDone] = useState(false)
  const [answerSaved, setAnswerSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<string[]>(currentSession?.questions ?? [])
  const [questionIds, setQuestionIds] = useState<number[]>([])
  const answerRef = useRef<HTMLTextAreaElement>(null)

  const session = currentSession
  const currentQ = questions[qIndex] ?? ''

  const { displayed, done } = useTypewriter(currentQ, 40)

  // Load question IDs from session state
  useEffect(() => {
    if (!session?.id) return
    api.getSessionState(session.id)
      .then(state => {
        if (state.questions) {
          setQuestions(state.questions.map(q => q.text))
          setQuestionIds(state.questions.map(q => q.id))
        }
        if (state.questions_completed) {
          setQIndex(state.questions_completed.length)
        }
      })
      .catch(() => {})
  }, [session?.id])

  // Timer countdown
  useEffect(() => {
    const id = setInterval(() => {
      setTimerSeconds(s => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const handleAdvance = async () => {
    if (!session?.id) return
    const questionId = questionIds[qIndex]
    if (questionId) {
      try {
        await api.advanceQuestion(session.id, questionId)
      } catch {}
    }
  }

  const handleNext = async () => {
    await handleAdvance()
    if (qIndex >= questions.length - 1) {
      setAllDone(true)
    } else {
      setQIndex(q => q + 1)
      setMyAnswer('')
      setAnswerSaved(false)
      setAnswerExpanded(false)
    }
  }

  const handleSkip = async () => {
    if (!session?.id) return
    try {
      await api.skipQuestion(session.id)
    } catch {}
    if (qIndex >= questions.length - 1) {
      setAllDone(true)
    } else {
      setQIndex(q => q + 1)
      setMyAnswer('')
      setAnswerSaved(false)
      setAnswerExpanded(false)
    }
  }

  const handleSwap = async () => {
    if (swapsLeft <= 0 || !session?.id) return
    try {
      const result = await api.swapQuestion(session.id, qIndex)
      // Update the question at current index
      setQuestions(prev => {
        const next = [...prev]
        next[qIndex] = result.new_question.text
        return next
      })
      setQuestionIds(prev => {
        const next = [...prev]
        next[qIndex] = result.new_question.id
        return next
      })
      setSwapsLeft(result.swaps_remaining)
      setMyAnswer('')
      setAnswerSaved(false)
    } catch {}
  }

  const handleEnd = () => {
    setRatingModalOpen(true)
  }

  const handleSaveAnswer = async () => {
    if (!myAnswer || !session?.id) return
    const questionId = questionIds[qIndex]
    if (!questionId) return
    setSaving(true)
    try {
      await api.saveAnswer(session.id, questionId, myAnswer)
      setAnswerSaved(true)
      setTimeout(() => setAnswerSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  const isLowTime = timerSeconds < 5 * 60
  const timerColor = isLowTime ? '#D4915A' : '#4F4D4A'

  if (!session) return null

  return (
    <main
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: '#F3F1ED', maxWidth: 390, margin: '0 auto' }}
    >
      {/* Background pixel tree scene (15% opacity) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        <RelationshipBloom
          bloomType="sakura"
          stage={2}
          size={280}
          showBackground={false}
          interactive={false}
          opacity={0.15}
        />
      </div>

      {/* Content */}
      <div className="relative flex flex-col flex-1 z-10 overflow-y-auto">
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #DDD9D3' }}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B' }}>
                {session.roundLabel}
              </div>
              <div style={{ fontSize: 11, color: '#6B6966', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 2 }}>
                第{session.round}轮 · {session.format} · AI精选{session.totalQuestions}题
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RelationshipBloom
                bloomType="sakura"
                stage={2}
                size={48}
                showBackground
                interactive={false}
              />
              <div
                style={{
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  fontSize: 16,
                  fontWeight: 500,
                  color: timerColor,
                  minWidth: 52,
                  textAlign: 'right',
                  transition: 'color 0.3s',
                }}
                aria-live="off"
              >
                {formatTimer(timerSeconds)}
              </div>
            </div>
          </div>
          <QuestionProgressBar current={qIndex + 1} total={questions.length || session.totalQuestions} />
        </div>

        {/* Main content */}
        <div className="flex-1 px-4 py-5 flex flex-col">
          {allDone ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 fade-in">
              <RelationshipBloom
                bloomType="sakura"
                stage={3}
                size={160}
                showBackground
              />
              <div className="text-center">
                <p style={{ fontSize: 15, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B', marginBottom: 8 }}>
                  本轮问题已全部聊完
                </p>
                <p style={{ fontSize: 13, color: '#6B6966', fontFamily: 'var(--font-inter)' }}>
                  你们一起走过了 {questions.length || session.totalQuestions} 个问题
                </p>
              </div>
              <button
                onClick={() => setRatingModalOpen(true)}
                style={{
                  background: '#C4956A',
                  border: 'none',
                  color: '#FBF9F6',
                  padding: '12px 32px',
                  fontSize: 14,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: 'pointer',
                }}
              >
                结束并评价
              </button>
            </div>
          ) : (
            <>
              {/* Question counter */}
              <div className="flex justify-between items-center mb-3">
                <span style={{ fontSize: 12, color: '#6B6966', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  Q{qIndex + 1} · {qIndex + 1}/{questions.length || session.totalQuestions}
                </span>
                <button
                  onClick={handleSwap}
                  disabled={swapsLeft === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: swapsLeft > 0 ? '#C4956A' : '#9E9A94',
                    fontSize: 12,
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    cursor: swapsLeft > 0 ? 'pointer' : 'not-allowed',
                    textDecoration: 'underline',
                  }}
                >
                  换一题 ({swapsLeft})
                </button>
              </div>

              {/* Question card */}
              <div
                style={{
                  background: '#FBF9F6',
                  border: '1px solid #C5C1BB',
                  padding: '20px 16px',
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 17,
                    fontFamily: 'var(--font-inter)',
                    color: '#1D1B1B',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                  aria-live="polite"
                >
                  {displayed}
                  {!done && <span className="typewriter-cursor" aria-hidden="true" />}
                </p>
              </div>

              {/* My answer */}
              <button
                onClick={() => {
                  setAnswerExpanded(!answerExpanded)
                  if (!answerExpanded) setTimeout(() => answerRef.current?.focus(), 100)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: answerExpanded ? 8 : 0,
                }}
              >
                <span style={{ fontSize: 12, color: '#9E9A94', fontFamily: 'var(--font-inter)' }}>
                  {answerExpanded ? '▾' : '▸'} 记录你的想法（仅自己可见）
                </span>
              </button>

              {answerExpanded && (
                <div className="fade-in">
                  <div
                    style={{
                      background: '#FBF9F6',
                      border: '1px solid #C5C1BB',
                    }}
                  >
                    <textarea
                      ref={answerRef}
                      value={myAnswer}
                      onChange={e => setMyAnswer(e.target.value.slice(0, 500))}
                      placeholder="写下你的感受..."
                      rows={4}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '10px 12px 4px',
                        fontSize: 14,
                        fontFamily: 'var(--font-inter)',
                        color: '#1D1B1B',
                        outline: 'none',
                        resize: 'none',
                        lineHeight: 1.6,
                      }}
                    />
                    <div className="flex justify-between items-center" style={{ padding: '4px 12px 10px' }}>
                      <span style={{ fontSize: 11, color: '#9E9A94', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                        {myAnswer.length}/500
                      </span>
                      <button
                        onClick={handleSaveAnswer}
                        disabled={!myAnswer || saving}
                        style={{
                          background: answerSaved ? '#5A9E6F' : myAnswer ? '#C4956A' : '#DDD9D3',
                          border: 'none',
                          color: '#FBF9F6',
                          padding: '4px 12px',
                          fontSize: 11,
                          fontFamily: 'var(--font-ibm-plex-mono)',
                          cursor: myAnswer && !saving ? 'pointer' : 'not-allowed',
                          transition: 'background 0.2s',
                        }}
                      >
                        {answerSaved ? '已保存 ✓' : saving ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Non-host indicator */}
        {!session.isHost && !allDone && (
          <div
            style={{ padding: '8px 16px', background: '#F3F1ED', borderTop: '1px solid #DDD9D3' }}
            className="flex items-center gap-2"
          >
            <span
              className="pulse-dot"
              style={{ width: 6, height: 6, background: '#C4956A', display: 'inline-block' }}
            />
            <span style={{ fontSize: 12, color: '#6B6966', fontFamily: 'var(--font-ibm-plex-mono)' }}>
              等待对方切换题目
            </span>
          </div>
        )}

        {/* Footer */}
        {!allDone && (
          <div
            style={{
              padding: '12px 16px 24px',
              borderTop: '1px solid #DDD9D3',
              background: '#F3F1ED',
            }}
          >
            {session.isHost && (
              <div className="flex gap-3 mb-3">
                <button
                  onClick={handleSkip}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    background: 'transparent',
                    border: '1px solid #C5C1BB',
                    color: '#4F4D4A',
                    fontSize: 13,
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    cursor: 'pointer',
                  }}
                >
                  跳过
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    flex: 2,
                    padding: '9px 0',
                    background: '#C4956A',
                    border: 'none',
                    color: '#FBF9F6',
                    fontSize: 13,
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = '#B5845B' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = '#C4956A' }}
                  onMouseDown={e => { (e.target as HTMLElement).style.transform = 'translateY(1px)' }}
                  onMouseUp={e => { (e.target as HTMLElement).style.transform = 'translateY(0)' }}
                >
                  下一题 →
                </button>
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleEnd}
                style={{
                  background: 'transparent',
                  border: '1px solid #C5C1BB',
                  color: '#4F4D4A',
                  padding: '8px 24px',
                  fontSize: 12,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: 'pointer',
                }}
              >
                结束今天
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rating modal */}
      {ratingModalOpen && (
        <RatingModal
          sessionId={session.id}
          onClose={() => {
            setRatingModalOpen(false)
            setCurrentSession(null)
            setPage('pipeline')
          }}
        />
      )}
    </main>
  )
}
