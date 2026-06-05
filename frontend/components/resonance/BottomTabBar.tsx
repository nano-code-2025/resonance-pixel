"use client"

import { useAppStore } from '@/lib/store'

const TABS = [
  { id: 'pool' as const, label: '发现', icon: '⊙' },
  { id: 'inbox' as const, label: '收到', icon: '⊠' },
  { id: 'pipeline' as const, label: '管道', icon: '⊞' },
]

export function BottomTabBar() {
  const { activeTab, setActiveTab, inboxBadge, setPage } = useAppStore()

  const handleTab = (tab: 'pool' | 'inbox' | 'pipeline') => {
    setActiveTab(tab)
    setPage(tab)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center"
      style={{
        background: '#F3F1ED',
        borderTop: '1px solid #C5C1BB',
        height: 56,
        maxWidth: 390,
        margin: '0 auto',
      }}
      aria-label="主导航"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => handleTab(tab.id)}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            style={{
              color: isActive ? '#C4956A' : '#6B6966',
              fontFamily: 'var(--font-ibm-plex-mono)',
              fontSize: 12,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Tab icon as pixel square */}
            <div
              style={{
                width: 6,
                height: 6,
                background: isActive ? '#C4956A' : '#C5C1BB',
                imageRendering: 'pixelated',
              }}
            />
            <span>{tab.label}</span>
            {tab.id === 'inbox' && inboxBadge > 0 && (
              <span
                className="absolute top-2 right-6"
                style={{
                  background: '#C75B5B',
                  color: '#FBF9F6',
                  fontSize: 9,
                  fontFamily: 'var(--font-ibm-plex-mono)',
                  minWidth: 14,
                  height: 14,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2px',
                }}
                aria-label={`${inboxBadge}条未读`}
              >
                {inboxBadge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
