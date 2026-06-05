"use client"

import { create } from 'zustand'

export type AppPage = 'auth' | 'onboarding' | 'pool' | 'inbox' | 'pipeline' | 'session'

export type BloomType =
  | 'sakura' | 'rose' | 'wisteria' | 'peony' | 'lotus'
  | 'oak' | 'sunflower' | 'lavender' | 'dandelion'
  | 'plumeria' | 'bougainvillea' | 'glow_mushroom'

export interface MatchCandidate {
  id: string
  city: string
  age: number
  gender: '男' | '女' | '其他'
  fitScore: number
  reasons: string[]
  tags: string[]
}

export interface ReceivedApproach {
  id: string
  fromUser: MatchCandidate
  tier: '标准' | '个性化' | '深度'
  message: string
  expanded: boolean
}

export interface PipelineMatch {
  id: string
  candidate: MatchCandidate
  bloomType: BloomType
  bloomStage: 0 | 1 | 2 | 3 | 4
  daysInactive: number
  roundProgress: 0 | 1 | 2 | 3
  questionProgress: number // 0-5
  totalQuestions: number // 5
  initiatedBy: 'me' | 'them'
  setupState: 'pending_vote' | 'voted_waiting' | 'ready'
  myVote: '视频通话' | '线下见面' | '都可以' | null
  scheduledTime: string | null
  activeSessionId: string | null
}

export interface SessionState {
  id: string
  matchId: string
  matchName: string
  round: number
  roundLabel: string
  format: '视频' | '线下'
  questionIndex: number
  totalQuestions: number
  questions: string[]
  swapsRemaining: number
  isHost: boolean
  timerSeconds: number
  myAnswer: string
  ended: boolean
}

export interface UserProfile {
  phone: string
  age: number
  city: string
  gender: '男' | '女' | '其他'
  education: string
  job: string
  lifeGoal: string
  tags: string[]
  preferGender: '男' | '女' | '不限'
  preferAgeMin: number
  preferAgeMax: number
  preferCity: string
  onboardingStep: number
  onboardingComplete: boolean
}

interface AppStore {
  // Auth
  token: string | null
  page: AppPage
  activeTab: 'pool' | 'inbox' | 'pipeline'
  inboxBadge: number
  currentSession: SessionState | null
  userProfile: UserProfile | null
  ratingModalOpen: boolean
  approachModalOpen: boolean
  approachTargetId: string | null

  // Auth actions
  setToken: (token: string | null) => void
  logout: () => void
  initAuth: () => void
  setPage: (page: AppPage) => void
  setActiveTab: (tab: 'pool' | 'inbox' | 'pipeline') => void
  setCurrentSession: (session: SessionState | null) => void
  setUserProfile: (profile: UserProfile) => void
  setRatingModalOpen: (open: boolean) => void
  setApproachModalOpen: (open: boolean, targetId?: string) => void
  setInboxBadge: (n: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  page: 'auth',
  activeTab: 'pool',
  inboxBadge: 2,
  currentSession: null,
  userProfile: null,
  ratingModalOpen: false,
  approachModalOpen: false,
  approachTargetId: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, page: 'auth', userProfile: null, currentSession: null })
  },
  initAuth: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      set({ token, page: 'pool' })
    }
  },
  setPage: (page) => set({ page }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setRatingModalOpen: (open) => set({ ratingModalOpen: open }),
  setApproachModalOpen: (open, targetId) =>
    set({ approachModalOpen: open, approachTargetId: targetId ?? null }),
  setInboxBadge: (n) => set({ inboxBadge: n }),
}))

// Mock data
export const MOCK_POOL_CANDIDATES: MatchCandidate[] = [
  {
    id: 'u1',
    city: '上海',
    age: 26,
    gender: '女',
    fitScore: 89,
    reasons: ['你们都喜欢旅行', '对生活节奏想法相似', '价值观接近'],
    tags: ['文艺青年', '热爱旅行', '善于倾听'],
  },
  {
    id: 'u2',
    city: '北京',
    age: 28,
    gender: '男',
    fitScore: 82,
    reasons: ['都是早起型的人', '爱好阅读相同', '都重视家庭'],
    tags: ['理性冷静', '事业心强', '注重健康'],
  },
  {
    id: 'u3',
    city: '成都',
    age: 24,
    gender: '女',
    fitScore: 76,
    reasons: ['对美食的热爱一致', '都喜欢安静的周末', '创意思维相符'],
    tags: ['温柔体贴', '爱好运动', '创意思维'],
  },
]

export const MOCK_RECEIVED_APPROACHES: ReceivedApproach[] = [
  {
    id: 'a1',
    fromUser: {
      id: 'u4',
      city: '杭州',
      age: 29,
      gender: '男',
      fitScore: 78,
      reasons: [],
      tags: ['温柔体贴', '爱好运动'],
    },
    tier: '标准',
    message: '你好，我看到你也喜欢爬山，上周刚从黄山下来，想和你聊聊。',
    expanded: false,
  },
  {
    id: 'a2',
    fromUser: {
      id: 'u5',
      city: '广州',
      age: 27,
      gender: '男',
      fitScore: 85,
      reasons: [],
      tags: ['独立自主', '热爱旅行'],
    },
    tier: '个性化',
    message: '看到你档案里提到对生活的安全感，我觉得我们对这件事的理解很接近，想深入聊聊。',
    expanded: false,
  },
]

export const MOCK_PIPELINE_MATCHES: PipelineMatch[] = [
  {
    id: 'm1',
    candidate: {
      id: 'u6',
      city: '上海',
      age: 26,
      gender: '女',
      fitScore: 91,
      reasons: [],
      tags: ['温柔体贴', '善于倾听'],
    },
    bloomType: 'sakura',
    bloomStage: 2,
    daysInactive: 1,
    roundProgress: 1,
    questionProgress: 3,
    totalQuestions: 5,
    initiatedBy: 'them',
    setupState: 'ready',
    myVote: '视频通话',
    scheduledTime: '6月5日 14:00',
    activeSessionId: 'sess1',
  },
  {
    id: 'm2',
    candidate: {
      id: 'u7',
      city: '北京',
      age: 25,
      gender: '女',
      fitScore: 88,
      reasons: [],
      tags: ['文艺青年', '热爱旅行'],
    },
    bloomType: 'wisteria',
    bloomStage: 1,
    daysInactive: 5,
    roundProgress: 0,
    questionProgress: 0,
    totalQuestions: 5,
    initiatedBy: 'me',
    setupState: 'voted_waiting',
    myVote: '视频通话',
    scheduledTime: null,
    activeSessionId: null,
  },
]

export const MOCK_SESSION: SessionState = {
  id: 'sess1',
  matchId: 'm1',
  matchName: '上海 · 26岁',
  round: 1,
  roundLabel: '初见',
  format: '视频',
  questionIndex: 3,
  totalQuestions: 5,
  questions: [
    '如果你可以邀请任何在世的人共进晚餐，你会邀请谁？为什么？',
    '你有一个关于自己的秘密梦想吗？',
    '在你告诉我你的"人生故事"之前，请用30个字讲完它。',
    '对你来说，一个完美的一天是什么样的？',
    '你上一次在别人面前唱歌是什么时候？',
  ],
  swapsRemaining: 2,
  isHost: true,
  timerSeconds: 37 * 60 + 24,
  myAnswer: '',
  ended: false,
}

export const BLOOM_PALETTES: Record<BloomType, {
  ground: string; stem: string; leaf: string; flower: string; light: string; name: string; nameCn: string
}> = {
  sakura:       { ground:'#8B6B4A', stem:'#6B5038', leaf:'#4A7C59', flower:'#E8A0B0', light:'#F0C0D0', name:'Cherry Blossom', nameCn:'樱花' },
  rose:         { ground:'#6B5038', stem:'#3D6B48', leaf:'#4A7C59', flower:'#C45060', light:'#E0A0A8', name:'Rose Bush', nameCn:'玫瑰' },
  wisteria:     { ground:'#8B6B4A', stem:'#6B5038', leaf:'#4A7C59', flower:'#9B7BC0', light:'#C4B0E0', name:'Wisteria', nameCn:'紫藤' },
  peony:        { ground:'#8B6B4A', stem:'#4A7C59', leaf:'#6B9E5E', flower:'#D4869A', light:'#F0C0D0', name:'Peony', nameCn:'牡丹' },
  lotus:        { ground:'#5A8AAE', stem:'#4A7C59', leaf:'#2D8B4E', flower:'#F0C0D0', light:'#F0EDE8', name:'Lotus', nameCn:'莲花' },
  oak:          { ground:'#8B6B4A', stem:'#6B5038', leaf:'#4A7C59', flower:'#C4956A', light:'#FFF4E0', name:'Oak Tree', nameCn:'橡树' },
  sunflower:    { ground:'#8B6B4A', stem:'#4A7C59', leaf:'#6B9E5E', flower:'#D4A040', light:'#FFFBE0', name:'Sunflower', nameCn:'向日葵' },
  lavender:     { ground:'#A0845C', stem:'#4A7C59', leaf:'#6B9E5E', flower:'#8B7BB0', light:'#C4B0E0', name:'Lavender', nameCn:'薰衣草' },
  dandelion:    { ground:'#8B6B4A', stem:'#6B9E5E', leaf:'#4A7C59', flower:'#D4A040', light:'#F0EDE8', name:'Dandelion', nameCn:'蒲公英' },
  plumeria:     { ground:'#A0845C', stem:'#6B5038', leaf:'#2D8B4E', flower:'#F0EDE8', light:'#E8D5C0', name:'Frangipani', nameCn:'鸡蛋花' },
  bougainvillea:{ ground:'#8B6B4A', stem:'#3D6B48', leaf:'#2D8B4E', flower:'#C45060', light:'#D4915A', name:'Bougainvillea', nameCn:'三角梅' },
  glow_mushroom:{ ground:'#3D6B48', stem:'#4A7C59', leaf:'#6B9E5E', flower:'#7AAECE', light:'#F0EDE8', name:'Glowing Mushroom', nameCn:'发光蘑菇' },
}
