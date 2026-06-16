"use client"

import { useAppStore } from '@/lib/store'

export function Toast() {
  const { toastMessage, toastType } = useAppStore()

  if (!toastMessage) return null

  const borderColor = toastType === 'success' ? '#5A9E6F' : '#C75B5B'

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: 320,
        width: 'calc(100% - 32px)',
        background: '#FBF9F6',
        border: '1px solid #C5C1BB',
        borderLeft: `3px solid ${borderColor}`,
        padding: '10px 14px',
        fontSize: 12,
        fontFamily: 'var(--font-ibm-plex-mono)',
        color: '#1D1B1B',
        animation: 'toast-slide-in 300ms ease-out',
      }}
    >
      {toastMessage}
    </div>
  )
}
