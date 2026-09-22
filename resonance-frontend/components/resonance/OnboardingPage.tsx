"use client"

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'

const PERSONALITY_TAGS = [
  '温柔体贴', '理性冷静', '爱好运动', '文艺青年',
  '事业心强', '居家型', '幽默风趣', '独立自主',
  '善于倾听', '热爱旅行', '创意思维', '注重健康',
]

const STEP_LABELS = ['头像', '信息', '性格', '期望']

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const done = i < step
        const active = i === step
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: done || active ? '#C4956A' : 'transparent',
                  border: `2px solid ${done || active ? '#C4956A' : '#C5C1BB'}`,
                  boxShadow: active ? '0 0 0 3px rgba(196,149,106,0.2)' : 'none',
                  transition: 'all 0.2s',
                }}
              />
              <span style={{ fontSize: 10, color: active ? '#C4956A' : '#9E9A94', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 3 }}>
                {label}
              </span>
            </div>
            {i < 3 && (
              <div style={{ width: 40, height: 2, background: i < step ? '#C4956A' : '#DDD9D3', marginBottom: 13 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#FBF9F6',
  border: 'none',
  borderBottom: '1px solid #C5C1BB',
  padding: '8px 0',
  fontSize: 14,
  fontFamily: 'var(--font-inter)',
  color: '#1D1B1B',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: 'var(--font-ibm-plex-mono)',
  color: '#6B6966',
  marginBottom: 4,
  display: 'block',
}

function GenderToggle({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: '4px 12px',
            fontSize: 13,
            fontFamily: 'var(--font-ibm-plex-mono)',
            background: value === opt ? '#E8D5C0' : '#EDE9E3',
            color: value === opt ? '#1D1B1B' : '#4F4D4A',
            border: value === opt ? '1px solid #C4956A' : '1px solid transparent',
            cursor: 'pointer',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function NavButtons({ step, onBack, onNext, nextLabel = '下一步 →', disabled = false, loading = false }: {
  step: number
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="flex justify-between items-center mt-6">
      {step > 0 ? (
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid #C5C1BB',
            color: '#4F4D4A',
            padding: '8px 16px',
            fontSize: 13,
            fontFamily: 'var(--font-ibm-plex-mono)',
            cursor: 'pointer',
          }}
        >
          ← 返回
        </button>
      ) : <div />}
      <button
        onClick={onNext}
        disabled={disabled || loading}
        style={{
          background: disabled || loading ? '#DDD9D3' : '#C4956A',
          border: 'none',
          color: '#FBF9F6',
          padding: '8px 20px',
          fontSize: 13,
          fontFamily: 'var(--font-ibm-plex-mono)',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '提交中...' : nextLabel}
      </button>
    </div>
  )
}

// Map Chinese gender to API value
const GENDER_MAP: Record<string, string> = { '男': 'male', '女': 'female', '其他': 'other' }
const PREFER_GENDER_MAP: Record<string, string> = { '男': 'male', '女': 'female', '不限': 'any' }

export function OnboardingPage() {
  const { setPage, userProfile, setUserProfile } = useAppStore()
  const [step, setStep] = useState(0)
  const [age, setAge] = useState('25')
  const [city, setCity] = useState('上海')
  const [gender, setGender] = useState('男')
  const [education, setEducation] = useState('')
  const [job, setJob] = useState('')
  const [lifeGoal, setLifeGoal] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [preferGender, setPreferGender] = useState('不限')
  const [preferAgeMin, setPreferAgeMin] = useState('20')
  const [preferAgeMax, setPreferAgeMax] = useState('35')
  const [preferCity, setPreferCity] = useState('')
  const [otherReq, setOtherReq] = useState('')
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelfieFile(file)
      setSelfiePreview(URL.createObjectURL(file))
    }
  }

  const handleComplete = async () => {
    setSubmitting(true)
    setError('')
    try {
      // Upload selfie if provided
      if (selfieFile) {
        await api.uploadSelfie(selfieFile)
      }

      // Update profile
      await api.updateProfile({
        age: parseInt(age),
        city,
        gender: GENDER_MAP[gender] ?? 'male',
        education: education || undefined,
        work: job || undefined,
        life_goals: lifeGoal || undefined,
        personality_tags: selectedTags.length > 0 ? selectedTags : undefined,
        requirements: {
          prefer_gender: PREFER_GENDER_MAP[preferGender] ?? 'any',
          age_min: parseInt(preferAgeMin) || 20,
          age_max: parseInt(preferAgeMax) || 35,
          prefer_city: preferCity || undefined,
          other: otherReq || undefined,
        },
      })

      setUserProfile({
        ...userProfile!,
        age: parseInt(age),
        city,
        gender: gender as '男' | '女' | '其他',
        education,
        job,
        lifeGoal,
        tags: selectedTags,
        preferGender: preferGender as '男' | '女' | '不限',
        preferAgeMin: parseInt(preferAgeMin),
        preferAgeMax: parseInt(preferAgeMax),
        preferCity,
        onboardingComplete: true,
      })
      setPage('pool')
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center px-6 pt-10 pb-6"
      style={{ background: '#F3F1ED' }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <ProgressDots step={step} />

        {error && (
          <p style={{ fontSize: 12, color: '#C75B5B', fontFamily: 'var(--font-ibm-plex-mono)', marginBottom: 8, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {step === 0 && (
          <div className="fade-in">
            <h2 style={{ fontSize: 16, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B', marginBottom: 6 }}>
              上传头像
            </h2>
            <p style={{ fontSize: 13, color: '#6B6966', fontFamily: 'var(--font-inter)', marginBottom: 20 }}>
              让对方认识你的第一眼
            </p>
            <div className="flex justify-center mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 120,
                  height: 120,
                  border: '2px dashed #C5C1BB',
                  background: '#FBF9F6',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: 8,
                  overflow: 'hidden',
                }}
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <div style={{ width: 24, height: 24, background: '#DDD9D3' }} />
                    <span style={{ fontSize: 12, color: '#9E9A94', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                      点击上传
                    </span>
                  </>
                )}
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#9E9A94', fontFamily: 'var(--font-inter)', textAlign: 'center', marginBottom: 20 }}>
              之后可以修改
            </p>
            <NavButtons step={step} onBack={() => {}} onNext={() => setStep(1)} />
          </div>
        )}

        {step === 1 && (
          <div className="fade-in flex flex-col gap-4">
            <h2 style={{ fontSize: 16, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B', marginBottom: 2 }}>
              基本信息
            </h2>
            <div>
              <label style={labelStyle}>年龄 *</label>
              <input
                type="number"
                placeholder="25"
                value={age}
                onChange={e => setAge(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderBottomColor = '#C4956A' }}
                onBlur={e => { e.target.style.borderBottomColor = '#C5C1BB' }}
              />
            </div>
            <div>
              <label style={labelStyle}>城市 *</label>
              <input
                placeholder="上海"
                value={city}
                onChange={e => setCity(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderBottomColor = '#C4956A' }}
                onBlur={e => { e.target.style.borderBottomColor = '#C5C1BB' }}
              />
            </div>
            <div>
              <label style={labelStyle}>性别 *</label>
              <GenderToggle options={['男', '女', '其他']} value={gender} onChange={setGender} />
            </div>
            <div>
              <label style={labelStyle}>学历</label>
              <input
                placeholder="本科 / 硕士..."
                value={education}
                onChange={e => setEducation(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderBottomColor = '#C4956A' }}
                onBlur={e => { e.target.style.borderBottomColor = '#C5C1BB' }}
              />
            </div>
            <div>
              <label style={labelStyle}>工作</label>
              <input
                placeholder="互联网 / 金融..."
                value={job}
                onChange={e => setJob(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderBottomColor = '#C4956A' }}
                onBlur={e => { e.target.style.borderBottomColor = '#C5C1BB' }}
              />
            </div>
            <NavButtons
              step={step}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
              disabled={!age || !city || !gender}
            />
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontSize: 16, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B', marginBottom: 2 }}>
              我的性格
            </h2>
            <p style={{ fontSize: 13, color: '#6B6966', fontFamily: 'var(--font-inter)', marginBottom: 16 }}>
              帮助 AI 更精准地为你匹配
            </p>

            <div className="mb-4">
              <label style={labelStyle}>人生目标</label>
              <textarea
                placeholder="写下你最想实现的事..."
                value={lifeGoal}
                onChange={e => setLifeGoal(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle,
                  borderBottom: 'none',
                  border: '1px solid #C5C1BB',
                  padding: '8px',
                  resize: 'none',
                  width: '100%',
                }}
                onFocus={e => { e.target.style.borderColor = '#C4956A' }}
                onBlur={e => { e.target.style.borderColor = '#C5C1BB' }}
              />
            </div>

            <div className="mb-2">
              <label style={labelStyle}>
                性格标签
                <span style={{ color: '#9E9A94', marginLeft: 6 }}>最多5个 ({selectedTags.length}/5)</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PERSONALITY_TAGS.map(tag => {
                  const selected = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        fontFamily: 'var(--font-ibm-plex-mono)',
                        background: selected ? '#E8D5C0' : '#EDE9E3',
                        color: selected ? '#1D1B1B' : '#4F4D4A',
                        border: selected ? '1px solid #C4956A' : '1px solid transparent',
                        cursor: selectedTags.length >= 5 && !selected ? 'not-allowed' : 'pointer',
                        opacity: selectedTags.length >= 5 && !selected ? 0.5 : 1,
                      }}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            <NavButtons step={step} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        )}

        {step === 3 && (
          <div className="fade-in flex flex-col gap-4">
            <h2 style={{ fontSize: 16, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 500, color: '#1D1B1B', marginBottom: 2 }}>
              期望对象
            </h2>

            <div>
              <label style={labelStyle}>期望性别 *</label>
              <GenderToggle options={['男', '女', '不限']} value={preferGender} onChange={setPreferGender} />
            </div>

            <div>
              <label style={labelStyle}>年龄范围</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="20"
                  value={preferAgeMin}
                  onChange={e => setPreferAgeMin(e.target.value)}
                  style={{ ...inputStyle, width: 60 }}
                  onFocus={e => { e.target.style.borderBottomColor = '#C4956A' }}
                  onBlur={e => { e.target.style.borderBottomColor = '#C5C1BB' }}
                />
                <span style={{ color: '#6B6966', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 12 }}>—</span>
                <input
                  type="number"
                  placeholder="35"
                  value={preferAgeMax}
                  onChange={e => setPreferAgeMax(e.target.value)}
                  style={{ ...inputStyle, width: 60 }}
                  onFocus={e => { e.target.style.borderBottomColor = '#C4956A' }}
                  onBlur={e => { e.target.style.borderBottomColor = '#C5C1BB' }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>期望城市</label>
              <input
                placeholder="不限城市..."
                value={preferCity}
                onChange={e => setPreferCity(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderBottomColor = '#C4956A' }}
                onBlur={e => { e.target.style.borderBottomColor = '#C5C1BB' }}
              />
            </div>

            <div>
              <label style={labelStyle}>其他要求</label>
              <textarea
                placeholder="还有什么想说的..."
                value={otherReq}
                onChange={e => setOtherReq(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle,
                  borderBottom: 'none',
                  border: '1px solid #C5C1BB',
                  padding: '8px',
                  resize: 'none',
                  width: '100%',
                }}
                onFocus={e => { e.target.style.borderColor = '#C4956A' }}
                onBlur={e => { e.target.style.borderColor = '#C5C1BB' }}
              />
            </div>

            <NavButtons
              step={step}
              onBack={() => setStep(2)}
              onNext={handleComplete}
              nextLabel="完成档案 ✓"
              loading={submitting}
            />
          </div>
        )}
      </div>
    </main>
  )
}
