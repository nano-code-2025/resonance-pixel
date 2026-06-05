"use client"

import { useState, useEffect, useCallback } from 'react'
import { api, PoolCandidate } from '@/lib/api'
import { MOCK_POOL_CANDIDATES, MatchCandidate } from '@/lib/store'
import { SectionDivider } from './SectionDivider'
import { PixelAvatar } from './PixelAvatar'

const APPROACH_TIERS = [
  { label: '标准', value: 'standard', price: '¥19', desc: '基础介绍，简洁有力' },
  { label: '个性化', value: 'personalized', price: '¥39', desc: 'AI定制开场白，更有温度' },
  { label: '深度', value: 'premium', price: '¥69', desc: '详细分析共同点，诚意满满' },
]

// Convert API candidate to display format
function toDisplayCandidate(c: PoolCandidate): MatchCandidate {
  return {
    id: c.candidate_id,
    city: c.city ?? '未知',
    age: c.age ?? 0,
    gender: (c.gender === 'male' ? '男' : c.gender === 'female' ? '女' : '其他') as '男' | '女' | '其他',
    fitScore: Math.round(c.score),
    reasons: c.highlights ?? [],
    tags: c.personality_tags ?? [],
  }
}

function ApproachModal({
  candidate,
  onClose,
}: {
  candidate: MatchCandidate
  onClose: () => void
}) {
  const [tierIndex, setTierIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const tier = APPROACH_TIERS[tierIndex]

  // Draft AI message when tier changes
  const draftMessage = useCallback(async () => {
    setDrafting(true)
    setError('')
    try {
      const result = await api.draftApproach(candidate.id, tier.value)
      setMessage(result.ai_message)
    } catch (e) {
      setMessage(`你好，我看到你的档案之后觉得我们有很多共同话题，想和你聊聊。`)
      setError(e instanceof Error ? e.message : '生成失败，已使用默认消息')
    } finally {
      setDrafting(false)
    }
  }, [candidate.id, tier.value])

  useEffect(() => {
    draftMessage()
  }, [draftMessage])

  const handleTierChange = (i: number) => {
    setTierIndex(i)
  }

  const handleSend = async () => {
    setSending(true)
    setError('')
    try {
      await api.sendApproach(candidate.id, tier.value, message)
      setSent(true)
      setTimeout(onClose, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败')
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(29,27,27,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full fade-in"
        style={{
          background: '#FBF9F6',
          border: '1px solid #C5C1BB',
          borderBottom: 'none',
          padding: '20px 16px 32px',
          maxWidth: 390,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="选择联系方式"
      >
        {sent ? (
          <div className="text-center py-6">
            <p style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 14, color: '#C4956A' }}>已发送心意 ✓</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B', marginBottom: 14 }}>
              选择联系方式
            </p>

            <div className="flex gap-2 mb-4">
              {APPROACH_TIERS.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => handleTierChange(i)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    fontSize: 12,
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    background: tierIndex === i ? '#E8D5C0' : 'transparent',
                    border: tierIndex === i ? '1px solid #C4956A' : '1px solid #C5C1BB',
                    color: tierIndex === i ? '#1D1B1B' : '#4F4D4A',
                    cursor: 'pointer',
                    textAlign: 'center' as const,
                  }}
                >
                  <div>{t.label}</div>
                  <div style={{ color: '#C4956A', fontWeight: 600, fontSize: 11 }}>{t.price}</div>
                </button>
              ))}
            </div>

            {error && (
              <p style={{ fontSize: 11, color: '#D4915A', fontFamily: 'var(--font-ibm-plex-mono)', marginBottom: 6 }}>
                {error}
              </p>
            )}

            <p style={{ fontSize: 11, color: '#6B6966', fontFamily: 'var(--font-ibm-plex-mono)', marginBottom: 6 }}>
              {drafting ? 'AI 正在为你撰写...' : 'AI 为你写的开场白：'}
            </p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 150))}
              rows={4}
              disabled={drafting}
              style={{
                width: '100%',
                background: '#F3F1ED',
                border: '1px solid #C5C1BB',
                padding: '8px',
                fontSize: 13,
                fontFamily: 'var(--font-inter)',
                color: '#1D1B1B',
                outline: 'none',
                resize: 'none',
                opacity: drafting ? 0.6 : 1,
              }}
              onFocus={e => { e.target.style.borderColor = '#C4956A' }}
              onBlur={e => { e.target.style.borderColor = '#C5C1BB' }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: '#9E9A94', marginBottom: 14, fontFamily: 'var(--font-ibm-plex-mono)' }}>
              {message.length}/150
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'transparent',
                  border: '1px solid #C5C1BB',
                  color: '#4F4D4A',
                  fontSize: 13,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSend}
                disabled={sending || drafting}
                style={{
                  flex: 2,
                  padding: '10px 0',
                  background: sending || drafting ? '#DDD9D3' : '#C4956A',
                  border: 'none',
                  color: '#FBF9F6',
                  fontSize: 13,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: sending || drafting ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? '发送中...' : '确认发送'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CandidateCard({
  candidate,
  onApproach,
}: {
  candidate: MatchCandidate
  onApproach: (id: string) => void
}) {
  return (
    <article
      style={{
        background: '#FBF9F6',
        border: '1px solid #C5C1BB',
        padding: '14px',
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <PixelAvatar userId={candidate.id} size={48} />
        <div className="flex-1">
          <div style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', color: '#1D1B1B', fontWeight: 500 }}>
            {candidate.city} · {candidate.age}岁
          </div>
          <div style={{ fontSize: 12, color: '#6B6966', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 2 }}>
            {candidate.gender}
          </div>
        </div>
      </div>

      {/* Fit score bar */}
      <div className="flex items-center gap-2 mb-3">
        <div style={{ flex: 1, height: 4, background: '#DDD9D3', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${candidate.fitScore}%`,
              background: '#C4956A',
            }}
          />
        </div>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)', color: '#C4956A', fontWeight: 600, minWidth: 24 }}>
          {candidate.fitScore}
        </span>
      </div>

      {/* Reasons */}
      {candidate.reasons.length > 0 && (
        <ul className="mb-4" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {candidate.reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2">
              <span style={{ color: '#C4956A', fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
              <span style={{ fontSize: 13, color: '#4F4D4A', fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}>
                {reason}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Tags */}
      {candidate.tags.length > 0 && candidate.reasons.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {candidate.tags.map(tag => (
            <span key={tag} style={{ fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)', background: '#EDE9E3', color: '#4F4D4A', padding: '2px 8px' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onApproach(candidate.id)}
        style={{
          width: '100%',
          background: '#C4956A',
          border: 'none',
          color: '#FBF9F6',
          padding: '10px 0',
          fontSize: 13,
          fontFamily: 'var(--font-ibm-plex-mono)',
          cursor: 'pointer',
          letterSpacing: '0.05em',
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.background = '#B5845B' }}
        onMouseLeave={e => { (e.target as HTMLElement).style.background = '#C4956A' }}
        onMouseDown={e => { (e.target as HTMLElement).style.transform = 'translateY(1px)' }}
        onMouseUp={e => { (e.target as HTMLElement).style.transform = 'translateY(0)' }}
      >
        联系TA
      </button>
    </article>
  )
}

export function PoolPage() {
  const [candidates, setCandidates] = useState<MatchCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [approachTarget, setApproachTarget] = useState<string | null>(null)

  useEffect(() => {
    api.getPool()
      .then(data => setCandidates(data.map(toDisplayCandidate)))
      .catch(() => setCandidates(MOCK_POOL_CANDIDATES)) // fallback to mock
      .finally(() => setLoading(false))
  }, [])

  const approachCandidate = candidates.find(c => c.id === approachTarget)

  return (
    <div className="pb-20">
      <div className="px-4 pt-5">
        <SectionDivider label="候选人池" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <p style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', color: '#6B6966' }}>加载中...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', color: '#6B6966', textAlign: 'center' }}>
            暂无候选人
          </p>
          <p style={{ fontSize: 12, color: '#9E9A94', fontFamily: 'var(--font-inter)', textAlign: 'center' }}>
            AI 正在为你寻找合适的人选
          </p>
        </div>
      ) : (
        <div className="px-4 flex flex-col" style={{ gap: 20 }}>
          {candidates.map(candidate => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onApproach={setApproachTarget}
            />
          ))}
        </div>
      )}

      {approachTarget && approachCandidate && (
        <ApproachModal
          candidate={approachCandidate}
          onClose={() => setApproachTarget(null)}
        />
      )}
    </div>
  )
}
