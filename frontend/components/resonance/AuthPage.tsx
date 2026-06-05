"use client"

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { LoginHeroCanvas } from './LoginHeroCanvas'

export function AuthPage() {
  const { setPage, setUserProfile, setToken } = useAppStore()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async () => {
    if (!phone || phone.length < 11) return
    setLoading(true)
    setError('')
    try {
      await api.sendOtp(phone)
      setOtpSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!otp) return
    setLoading(true)
    setError('')
    try {
      const result = await api.verifyOtp(phone, otp)
      setToken(result.token)

      if (result.is_new) {
        setUserProfile({
          phone,
          age: 0,
          city: '',
          gender: '男',
          education: '',
          job: '',
          lifeGoal: '',
          tags: [],
          preferGender: '不限',
          preferAgeMin: 20,
          preferAgeMax: 35,
          preferCity: '',
          onboardingStep: 0,
          onboardingComplete: false,
        })
        setPage('onboarding')
      } else {
        // Returning user — check if profile is complete
        try {
          const profile = await api.getProfile()
          if (!profile.is_complete) {
            setPage('onboarding')
          } else {
            setPage('pool')
          }
        } catch {
          setPage('pool')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '验证失败')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#FBF9F6',
    border: 'none',
    borderBottom: '1px solid #C5C1BB',
    padding: '8px 0',
    fontSize: 15,
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

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen px-6"
      style={{ background: '#F3F1ED' }}
    >
      <div className="flex flex-col items-center w-full" style={{ maxWidth: 320, gap: 0 }}>
        {/* Hero canvas */}
        <div className="mb-4">
          <LoginHeroCanvas size={160} />
        </div>

        {/* Quote */}
        <p
          className="text-center mb-5 leading-relaxed"
          style={{
            fontSize: 13,
            fontFamily: 'var(--font-inter)',
            fontStyle: 'italic',
            color: '#6B6966',
          }}
        >
          &ldquo;你和我有共同的记忆，<br />比前方的路还长。&rdquo;
        </p>

        {/* Brand */}
        <div className="text-center mb-8">
          <h1
            style={{
              fontSize: 17,
              fontFamily: 'var(--font-ibm-plex-mono)',
              fontWeight: 500,
              color: '#1D1B1B',
              letterSpacing: '0.08em',
            }}
          >
            RESONANCE
          </h1>
          <p style={{ fontSize: 14, fontFamily: 'var(--font-inter)', color: '#4F4D4A', marginTop: 2 }}>
            找到同频的人
          </p>
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: '#C75B5B', fontFamily: 'var(--font-ibm-plex-mono)', marginBottom: 8, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Phone input */}
        <div className="w-full mb-4">
          <label style={labelStyle}>手机号</label>
          <input
            type="tel"
            placeholder="13800000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={11}
            style={{
              ...inputStyle,
              color: phone ? '#1D1B1B' : '#9E9A94',
            }}
            onFocus={(e) => { e.target.style.borderBottomColor = '#C4956A' }}
            onBlur={(e) => { e.target.style.borderBottomColor = '#C5C1BB' }}
            disabled={otpSent}
          />
        </div>

        {!otpSent ? (
          <button
            onClick={handleSendOtp}
            disabled={loading || phone.length < 11}
            style={{
              width: '100%',
              background: loading || phone.length < 11 ? '#DDD9D3' : '#C4956A',
              color: '#FBF9F6',
              border: 'none',
              padding: '12px 0',
              fontSize: 14,
              fontFamily: 'var(--font-ibm-plex-mono)',
              cursor: loading || phone.length < 11 ? 'not-allowed' : 'pointer',
              letterSpacing: '0.05em',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '发送中...' : '获取验证码'}
          </button>
        ) : (
          <div className="w-full">
            <div className="mb-4">
              <label style={labelStyle}>验证码</label>
              <input
                type="number"
                placeholder="请输入6位验证码"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                style={{
                  ...inputStyle,
                  letterSpacing: '0.2em',
                  fontSize: 18,
                }}
                onFocus={(e) => { e.target.style.borderBottomColor = '#C4956A' }}
                onBlur={(e) => { e.target.style.borderBottomColor = '#C5C1BB' }}
                autoFocus
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={loading || otp.length < 4}
              style={{
                width: '100%',
                background: loading || otp.length < 4 ? '#DDD9D3' : '#C4956A',
                color: '#FBF9F6',
                border: 'none',
                padding: '12px 0',
                fontSize: 14,
                fontFamily: 'var(--font-ibm-plex-mono)',
                cursor: loading || otp.length < 4 ? 'not-allowed' : 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              {loading ? '验证中...' : '验证登录'}
            </button>
            <button
              onClick={() => { setOtpSent(false); setError('') }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#6B6966',
                fontSize: 12,
                fontFamily: 'var(--font-ibm-plex-mono)',
                marginTop: 12,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              重新发送
            </button>
          </div>
        )}

        <p style={{ fontSize: 11, color: '#9E9A94', marginTop: 20, fontFamily: 'var(--font-inter)', textAlign: 'center' }}>
          登录即代表同意用户协议和隐私政策
        </p>
      </div>
    </main>
  )
}
