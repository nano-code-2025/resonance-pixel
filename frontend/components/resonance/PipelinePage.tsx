"use client"

import { useState, useEffect } from 'react'
import { useAppStore, type BloomType, isDemoMode } from '@/lib/store'
import { api, PipelineMatch as ApiMatch } from '@/lib/api'
import { SectionDivider } from './SectionDivider'
import { RelationshipBloom } from './RelationshipBloom'
import { RoundProgress } from './RoundProgress'
import { PixelAvatar } from './PixelAvatar'

const MEET_OPTIONS = [
  { label: '视频通话', value: 'video' },
  { label: '线下见面', value: 'in_person' },
  { label: '都可以', value: 'either' },
] as const

const ROUND_LABELS: Record<number, string> = { 1: '初见', 2: '深聊', 3: '见见我的圈子' }
const VOTE_LABELS: Record<string, string> = { video: '视频通话', in_person: '线下见面', either: '都可以' }

function MatchCard({ match, stream }: { match: ApiMatch; stream: 'pursuing' | 'being_found' }) {
  const { setPage, setCurrentSession, showToast } = useAppStore()
  const [myVote, setMyVote] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)
  const [setupStatus, setSetupStatus] = useState<{
    my_vote: string | null
    other_voted: boolean
    resolved_format: string | null
    scheduled_at: string | null
  } | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)
  const [recap, setRecap] = useState<string | null>(null)

  // Fetch setup status
  useEffect(() => {
    api.getSetupStatus(match.match_id)
      .then(status => {
        setSetupStatus(status)
        if (status.my_vote) setMyVote(status.my_vote)
      })
      .catch(() => {})
  }, [match.match_id])

  // Fetch recap if available
  useEffect(() => {
    if (match.bloom_stage >= 2 && match.questions_completed > 0) {
      // Try to get recap from the latest completed session
      // We don't have session_id here, so this is best-effort
    }
  }, [match.bloom_stage, match.questions_completed])

  const handleVote = async (value: string) => {
    setVoting(true)
    try {
      const result = await api.voteFormat(match.match_id, value)
      setMyVote(result.my_vote)
      setSetupStatus(prev => prev ? { ...prev, my_vote: result.my_vote, other_voted: result.both_voted } : null)
    } catch { showToast('操作失败，请稍后重试') }
    setVoting(false)
  }

  const handleStartSession = async () => {
    setCreatingSession(true)
    try {
      const sessionType = setupStatus?.resolved_format === 'video' ? 'video' : 'in_person'
      const result = await api.createSession(match.match_id, sessionType)
      const state = await api.getSessionState(result.session_id)
      const questions = state.questions ?? result.questions ?? []
      const completed = state.questions_completed ?? []
      const currentIdx = completed.length

      setCurrentSession({
        id: result.session_id,
        matchId: match.match_id,
        matchName: `${match.other_city ?? '未知'} · ${match.other_gender === 'female' ? '女' : match.other_gender === 'male' ? '男' : ''}`,
        round: match.round,
        roundLabel: ROUND_LABELS[match.round] ?? `第${match.round}轮`,
        format: sessionType === 'video' ? '视频' : '线下',
        questionIndex: currentIdx,
        totalQuestions: questions.length,
        questions: questions.map((q: { id: number; text: string }) => q.text),
        swapsRemaining: Math.max(0, 2 - (state.swap_count ?? 0)),
        isHost: state.is_host,
        timerSeconds: 45 * 60,
        myAnswer: '',
        ended: false,
      })
      setPage('session')
    } catch { showToast('创建会话失败，请重试') }
    setCreatingSession(false)
  }

  const bloomType = (match.bloom_type || 'oak') as BloomType
  const bloomStage = Math.min(4, Math.max(0, match.bloom_stage)) as 0 | 1 | 2 | 3 | 4
  const avatarLevel = match.questions_completed >= 5 ? 3 : match.questions_completed >= 3 ? 2 : 1
  const isReady = setupStatus?.resolved_format && setupStatus?.scheduled_at
  const hasVoted = !!myVote

  return (
    <article
      style={{
        background: '#FBF9F6',
        border: '1px solid #C5C1BB',
        padding: '16px',
      }}
    >
      {/* Top row: bloom + info */}
      <div className="flex gap-4 mb-4">
        <div style={{ flexShrink: 0 }}>
          <RelationshipBloom
            bloomType={bloomType}
            stage={bloomStage}
            daysInactive={match.days_since_activity}
            size={100}
            showBackground
          />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PixelAvatar userId={match.match_id} size={32} level={avatarLevel as 1 | 2 | 3} />
              <div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B' }}>
                  {match.other_city ?? '未知'} · {match.other_gender === 'female' ? '女' : match.other_gender === 'male' ? '男' : '其他'}
                </div>
                <div style={{ fontSize: 11, color: '#9E9A94', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 2 }}>
                  {stream === 'being_found' ? 'TA发起' : '我发起'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#C4956A', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 4 }}>
              {bloomType} · 阶段{bloomStage}
            </div>
          </div>

          {/* Tags */}
          {match.other_personality_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {match.other_personality_tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    background: '#EDE9E3',
                    color: '#4F4D4A',
                    padding: '2px 6px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Round progress */}
      <div className="mb-4">
        <RoundProgress
          currentRound={Math.min(3, match.round) as 0 | 1 | 2 | 3}
          questionProgress={match.questions_completed}
          totalQuestions={5}
        />
      </div>

      {/* Setup section */}
      <div
        style={{
          border: '1px solid #DDD9D3',
          padding: '12px',
          background: '#F3F1ED',
        }}
      >
        {isReady ? (
          <div>
            <p style={{ fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)', color: '#4F4D4A', marginBottom: 8 }}>
              {setupStatus.resolved_format === 'video' ? '视频通话' : '线下见面'} · 已安排
            </p>
            <button
              onClick={handleStartSession}
              disabled={creatingSession}
              style={{
                width: '100%',
                background: creatingSession ? '#DDD9D3' : '#C4956A',
                border: 'none',
                color: '#FBF9F6',
                padding: '10px 0',
                fontSize: 13,
                fontFamily: 'var(--font-ibm-plex-mono)',
                cursor: creatingSession ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!creatingSession) (e.target as HTMLElement).style.background = '#B5845B' }}
              onMouseLeave={e => { if (!creatingSession) (e.target as HTMLElement).style.background = '#C4956A' }}
            >
              {creatingSession ? '创建中...' : '开始对话'}
            </button>
          </div>
        ) : hasVoted ? (
          <p style={{ fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)', color: '#6B6966' }}>
            你选了「{VOTE_LABELS[myVote!] ?? myVote}」· 等待对方选择...
            <span className="pulse-dot inline-block ml-2" style={{ width: 6, height: 6, background: '#C4956A', display: 'inline-block', verticalAlign: 'middle' }} />
          </p>
        ) : (
          <div>
            <p style={{ fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)', color: '#4F4D4A', marginBottom: 8 }}>
              安排{ROUND_LABELS[match.round] ?? '见面'} · 选择见面方式
            </p>
            <div className="flex gap-2">
              {MEET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleVote(opt.value)}
                  disabled={voting}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: 11,
                    fontFamily: 'var(--font-ibm-plex-mono)',
                    background: 'transparent',
                    border: '1px solid #C5C1BB',
                    color: '#4F4D4A',
                    cursor: voting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

function EmptyPipeline() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div style={{ width: 48, height: 32, position: 'relative', imageRendering: 'pixelated' }}>
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: 48, height: 4, background: '#C5C1BB' }} />
        <div style={{ position: 'absolute', left: 18, bottom: 4, width: 4, height: 12, background: '#C4956A' }} />
        <div style={{ position: 'absolute', left: 17, bottom: 14, width: 6, height: 6, background: '#E8C4A0' }} />
        <div style={{ position: 'absolute', left: 17, bottom: 14, width: 6, height: 2, background: '#C46B4A' }} />
        <div style={{ position: 'absolute', right: 4, bottom: 4, width: 16, height: 2, background: '#DDD9D3' }} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono)', color: '#6B6966', textAlign: 'center' }}>
          暂无进行中的连接
        </p>
        <p style={{ fontSize: 12, color: '#9E9A94', fontFamily: 'var(--font-inter)', textAlign: 'center', marginTop: 4 }}>
          去「发现」页面找到你的第一段缘分
        </p>
      </div>
    </div>
  )
}

const MOCK_PIPELINE: { pursuing: ApiMatch[]; being_found: ApiMatch[] } = {
  pursuing: [
    { match_id: 'demo-m1', round: 1, status: 'active', other_city: '上海', other_gender: 'female', other_personality_tags: ['温柔体贴'], bloom_type: 'sakura', days_since_activity: 1, questions_completed: 3, bloom_stage: 3 },
    { match_id: 'demo-m2', round: 1, status: 'active', other_city: '北京', other_gender: 'female', other_personality_tags: ['文艺青年'], bloom_type: 'rose', days_since_activity: 0, questions_completed: 5, bloom_stage: 4 },
    { match_id: 'demo-m3', round: 1, status: 'active', other_city: '杭州', other_gender: 'female', other_personality_tags: ['善于倾听'], bloom_type: 'wisteria', days_since_activity: 2, questions_completed: 2, bloom_stage: 3 },
    { match_id: 'demo-m4', round: 1, status: 'active', other_city: '成都', other_gender: 'female', other_personality_tags: ['独立自主'], bloom_type: 'peony', days_since_activity: 0, questions_completed: 4, bloom_stage: 4 },
    { match_id: 'demo-m5', round: 1, status: 'active', other_city: '广州', other_gender: 'female', other_personality_tags: ['热爱旅行'], bloom_type: 'lotus', days_since_activity: 3, questions_completed: 1, bloom_stage: 3 },
    { match_id: 'demo-m6', round: 1, status: 'active', other_city: '深圳', other_gender: 'male', other_personality_tags: ['理性冷静'], bloom_type: 'oak', days_since_activity: 1, questions_completed: 4, bloom_stage: 4 },
  ],
  being_found: [
    { match_id: 'demo-m7', round: 1, status: 'active', other_city: '武汉', other_gender: 'female', other_personality_tags: ['创意思维'], bloom_type: 'sunflower', days_since_activity: 0, questions_completed: 3, bloom_stage: 3 },
    { match_id: 'demo-m8', round: 1, status: 'active', other_city: '南京', other_gender: 'female', other_personality_tags: ['注重健康'], bloom_type: 'lavender', days_since_activity: 1, questions_completed: 0, bloom_stage: 2 },
    { match_id: 'demo-m9', round: 1, status: 'active', other_city: '西安', other_gender: 'male', other_personality_tags: ['事业心强'], bloom_type: 'dandelion', days_since_activity: 4, questions_completed: 5, bloom_stage: 4 },
    { match_id: 'demo-m10', round: 1, status: 'active', other_city: '厦门', other_gender: 'female', other_personality_tags: ['爱好运动'], bloom_type: 'plumeria', days_since_activity: 0, questions_completed: 2, bloom_stage: 3 },
    { match_id: 'demo-m11', round: 1, status: 'active', other_city: '重庆', other_gender: 'female', other_personality_tags: ['温柔体贴'], bloom_type: 'bougainvillea', days_since_activity: 2, questions_completed: 4, bloom_stage: 4 },
    { match_id: 'demo-m12', round: 1, status: 'active', other_city: '昆明', other_gender: 'male', other_personality_tags: ['善于倾听'], bloom_type: 'glow_mushroom', days_since_activity: 0, questions_completed: 1, bloom_stage: 3 },
  ],
}

export function PipelinePage() {
  const { showToast } = useAppStore()
  const [pursuing, setPursuing] = useState<ApiMatch[]>([])
  const [beingFound, setBeingFound] = useState<ApiMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      setPursuing(MOCK_PIPELINE.pursuing)
      setBeingFound(MOCK_PIPELINE.being_found)
      setLoading(false)
      return
    }
    api.getPipeline()
      .then(data => {
        setPursuing(data.pursuing)
        setBeingFound(data.being_found)
      })
      .catch(() => showToast('无法加载连接列表'))
      .finally(() => setLoading(false))
  }, [showToast])

  const allMatches = [...pursuing, ...beingFound]

  return (
    <div className="pb-20">
      <div className="px-4 pt-5">
        <SectionDivider label="我的缘分" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="loading-dots" style={{ color: '#C4956A', fontSize: 20, letterSpacing: 4, textAlign: 'center' }}>
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      ) : allMatches.length === 0 ? (
        <EmptyPipeline />
      ) : (
        <div className="px-4 flex flex-col" style={{ gap: 16 }}>
          {beingFound.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)', color: '#9E9A94', letterSpacing: '0.1em' }}>
                TA 发起的
              </p>
              {beingFound.map(match => (
                <MatchCard key={match.match_id} match={match} stream="being_found" />
              ))}
            </>
          )}
          {pursuing.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)', color: '#9E9A94', letterSpacing: '0.1em', marginTop: beingFound.length > 0 ? 8 : 0 }}>
                我发起的
              </p>
              {pursuing.map(match => (
                <MatchCard key={match.match_id} match={match} stream="pursuing" />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
