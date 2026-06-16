"use client"

import { useState, useEffect } from 'react'
import { api, ReceivedApproach as ApiApproach } from '@/lib/api'
import { useAppStore, isDemoMode } from '@/lib/store'
import { SectionDivider } from './SectionDivider'
import { PixelAvatar } from './PixelAvatar'

const TIER_LABELS: Record<string, string> = {
  standard: '标准',
  personalized: '个性化',
  premium: '深度',
}

function ApproachCard({
  approach,
  onAccept,
  onDecline,
}: {
  approach: ApiApproach
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [decided, setDecided] = useState<'accepted' | 'declined' | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      await api.respondApproach(approach.approach_id, 'accept')
      setDecided('accepted')
      onAccept(approach.approach_id)
    } catch {
      // still mark as accepted on UI
      setDecided('accepted')
    }
    setLoading(false)
  }

  const handleDecline = async () => {
    setLoading(true)
    try {
      await api.respondApproach(approach.approach_id, 'decline')
      setDecided('declined')
      onDecline(approach.approach_id)
    } catch {
      setDecided('declined')
    }
    setLoading(false)
  }

  const user = approach.initiator
  const tierLabel = TIER_LABELS[approach.tier] ?? approach.tier
  const tags = user.personality_tags ?? []

  if (decided) {
    return (
      <div
        style={{
          background: '#FBF9F6',
          border: '1px solid #C5C1BB',
          padding: '14px',
          opacity: 0.6,
        }}
      >
        <div style={{ fontSize: 12, color: '#6B6966', fontFamily: 'var(--font-ibm-plex-mono)', textAlign: 'center' }}>
          {decided === 'accepted' ? '已接受约会 ✓' : '已婉拒 —'}
        </div>
      </div>
    )
  }

  return (
    <article
      style={{
        background: '#FBF9F6',
        border: '1px solid #C5C1BB',
        overflow: 'hidden',
      }}
    >
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
        style={{ padding: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <PixelAvatar userId={user.user_id} size={44} />
          <div className="flex-1">
            <div style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', color: '#1D1B1B', fontWeight: 500 }}>
              {user.city ?? '未知'} · {user.age ?? '?'}岁
            </div>
            <div style={{ fontSize: 11, color: '#6B6966', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 2 }}>
              「{tierLabel}」
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#9E9A94', fontFamily: 'var(--font-ibm-plex-mono)' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  background: '#EDE9E3',
                  color: '#4F4D4A',
                  padding: '2px 8px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="fade-in" style={{ padding: '0 14px 14px' }}>
          {/* AI message */}
          <div
            style={{
              background: '#EDE9E3',
              padding: '10px 12px',
              marginBottom: 12,
              border: '1px solid #DDD9D3',
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontFamily: 'var(--font-inter)',
                fontStyle: 'italic',
                color: '#4F4D4A',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              &ldquo;{approach.ai_message}&rdquo;
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 0',
                background: 'transparent',
                border: '1px solid #C5C1BB',
                color: '#4F4D4A',
                fontSize: 12,
                fontFamily: 'var(--font-ibm-plex-mono)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              婉拒
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              style={{
                flex: 2,
                padding: '9px 0',
                background: loading ? '#DDD9D3' : '#C4956A',
                border: 'none',
                color: '#FBF9F6',
                fontSize: 12,
                fontFamily: 'var(--font-ibm-plex-mono)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.background = '#B5845B' }}
              onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = '#C4956A' }}
            >
              {loading ? '处理中...' : '接受约会'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// Empty state pixel mailbox
function EmptyMailbox() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div style={{ width: 40, height: 32, position: 'relative', imageRendering: 'pixelated' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', left: 4, top: 8, width: 32, height: 20, background: '#C5C1BB' }} />
          <div style={{ position: 'absolute', left: 4, top: 20, width: 32, height: 8, background: '#DDD9D3' }} />
          <div style={{ position: 'absolute', left: 10, top: 14, width: 20, height: 2, background: '#9E9A94' }} />
          <div style={{ position: 'absolute', left: 28, top: 0, width: 2, height: 10, background: '#C5C1BB' }} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', color: '#6B6966', textAlign: 'center' }}>
          暂无待回复的心意
        </p>
        <p style={{ fontSize: 12, color: '#9E9A94', fontFamily: 'var(--font-inter)', textAlign: 'center', marginTop: 4 }}>
          去「发现」页面找到感兴趣的人
        </p>
      </div>
    </div>
  )
}

const MOCK_INBOX: ApiApproach[] = [
  {
    approach_id: 'demo-a1',
    ai_message: '你好，我看到你也喜欢爬山，上周刚从黄山下来，想和你聊聊。',
    tier: 'standard',
    created_at: new Date().toISOString(),
    initiator: { user_id: 'u4', age: 29, city: '杭州', gender: 'male', personality_tags: ['温柔体贴', '爱好运动'], selfie_url: null },
  },
  {
    approach_id: 'demo-a2',
    ai_message: '看到你档案里提到对生活的安全感，我觉得我们对这件事的理解很接近，想深入聊聊。',
    tier: 'personalized',
    created_at: new Date().toISOString(),
    initiator: { user_id: 'u5', age: 27, city: '广州', gender: 'male', personality_tags: ['独立自主', '热爱旅行'], selfie_url: null },
  },
]

export function InboxPage() {
  const { setInboxBadge, showToast } = useAppStore()
  const [approaches, setApproaches] = useState<ApiApproach[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      setApproaches(MOCK_INBOX)
      setInboxBadge(MOCK_INBOX.length)
      setLoading(false)
      return
    }
    api.getReceivedApproaches()
      .then(data => {
        setApproaches(data)
        setInboxBadge(data.length)
      })
      .catch(() => showToast('无法加载收到的心意'))
      .finally(() => setLoading(false))
  }, [setInboxBadge, showToast])

  const handleResponded = () => {
    // Refresh after response
    api.getReceivedApproaches()
      .then(data => {
        setApproaches(data)
        setInboxBadge(data.length)
      })
      .catch(() => {})
  }

  return (
    <div className="pb-20">
      <div className="px-4 pt-5">
        <SectionDivider label="收到的心意" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="loading-dots" style={{ color: '#C4956A', fontSize: 20, letterSpacing: 4, textAlign: 'center' }}>
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      ) : approaches.length === 0 ? (
        <EmptyMailbox />
      ) : (
        <div className="px-4 flex flex-col" style={{ gap: 12 }}>
          {approaches.map(approach => (
            <ApproachCard
              key={approach.approach_id}
              approach={approach}
              onAccept={handleResponded}
              onDecline={handleResponded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
