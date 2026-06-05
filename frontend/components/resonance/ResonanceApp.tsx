"use client"

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { AuthPage } from './AuthPage'
import { OnboardingPage } from './OnboardingPage'
import { PoolPage } from './PoolPage'
import { InboxPage } from './InboxPage'
import { PipelinePage } from './PipelinePage'
import { SessionPage } from './SessionPage'
import { BottomTabBar } from './BottomTabBar'

export function ResonanceApp() {
  const { page, token, initAuth, setInboxBadge } = useAppStore()

  // On mount, check for existing token
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Poll inbox count when authenticated
  useEffect(() => {
    if (!token) return
    const refresh = () =>
      api.getReceivedApproaches()
        .then(list => setInboxBadge(list.length))
        .catch(() => {})
    refresh()
    const timer = setInterval(refresh, 30_000)
    return () => clearInterval(timer)
  }, [token, setInboxBadge])

  if (page === 'auth') {
    return <AuthPage />
  }

  if (page === 'onboarding') {
    return <OnboardingPage />
  }

  if (page === 'session') {
    return <SessionPage />
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F3F1ED',
        maxWidth: 390,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Page content */}
      <div style={{ paddingBottom: 56 }}>
        {page === 'pool' && <PoolPage />}
        {page === 'inbox' && <InboxPage />}
        {page === 'pipeline' && <PipelinePage />}
      </div>

      {/* Fixed bottom tab bar */}
      <BottomTabBar />
    </div>
  )
}
