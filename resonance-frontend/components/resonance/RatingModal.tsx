"use client"

import { useState } from 'react'
import { api } from '@/lib/api'
import { RelationshipBloom } from './RelationshipBloom'

interface RatingModalProps {
  sessionId: string
  onClose: () => void
}

export function RatingModal({ sessionId, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [decided, setDecided] = useState<'continue' | 'stop' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleDecide = async (choice: 'continue' | 'stop') => {
    setSubmitting(true)
    try {
      await api.endSession(sessionId, rating, choice === 'continue')
    } catch {}
    setDecided(choice)
    setTimeout(onClose, 1000)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(29,27,27,0.5)' }}
    >
      <div
        className="w-full fade-in"
        style={{
          background: '#FBF9F6',
          border: '1px solid #C5C1BB',
          padding: '24px 20px',
          maxWidth: 340,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="会话评分"
      >
        {decided ? (
          <div className="text-center py-4">
            <p style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 14, color: '#C4956A' }}>
              {decided === 'continue' ? '期待下次相遇 ✓' : '感谢这段时光 —'}
            </p>
          </div>
        ) : (
          <>
            {/* Bloom */}
            <div className="flex justify-center mb-4">
              <RelationshipBloom
                bloomType="sakura"
                stage={3}
                size={88}
                showBackground
              />
            </div>

            {/* Title */}
            <div className="text-center mb-5">
              <p style={{ fontSize: 14, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#C4956A', marginBottom: 4 }}>
                今天聊得怎么样？
              </p>
              <p style={{ fontSize: 11, color: '#9E9A94', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                你的评分对方不会看到
              </p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  style={{
                    width: 44,
                    height: 44,
                    background: rating >= n ? '#C4956A' : '#EDE9E3',
                    border: 'none',
                    fontSize: 18,
                    cursor: 'pointer',
                    color: rating >= n ? '#FBF9F6' : '#4F4D4A',
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    transition: 'background 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={`${n}星评分`}
                  aria-pressed={rating >= n}
                >
                  {n <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>

            {/* Continue question */}
            <p style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', color: '#4F4D4A', textAlign: 'center', marginBottom: 14 }}>
              想继续了解TA吗？
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleDecide('stop')}
                disabled={rating === 0 || submitting}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'transparent',
                  border: '1px solid #C5C1BB',
                  color: '#4F4D4A',
                  fontSize: 12,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: rating > 0 && !submitting ? 'pointer' : 'not-allowed',
                  opacity: rating > 0 ? 1 : 0.3,
                }}
              >
                暂时到这里
              </button>
              <button
                onClick={() => handleDecide('continue')}
                disabled={rating === 0 || submitting}
                style={{
                  flex: 2,
                  padding: '10px 0',
                  background: rating > 0 && !submitting ? '#C4956A' : '#DDD9D3',
                  border: 'none',
                  color: '#FBF9F6',
                  fontSize: 12,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  cursor: rating > 0 && !submitting ? 'pointer' : 'not-allowed',
                  opacity: rating > 0 ? 1 : 0.3,
                }}
              >
                {submitting ? '提交中...' : '继续深聊 →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
