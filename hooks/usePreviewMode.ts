'use client'

// hooks/usePreviewMode.ts
// Lightweight admin preview-mode store backed by sessionStorage. Survives
// route changes inside a tab; closes when the tab closes. Components that
// need to react when preview is toggled subscribe via the same hook.

import { useEffect, useState, useCallback } from 'react'

export type PreviewPath = 'A' | 'B' | 'C'
export type ArchetypeRoute = 'door' | 'throne' | 'engine' | 'push'

export interface PreviewState {
  path: PreviewPath
  dayOverride?: number | null
  cohortId?: string | null
  /** Path A only: forces a specific archetype route regardless of the
   *  signed-in user's quiz result. Lets admins walk the Open Door variant
   *  of Day 3, the Pushthrough variant of Day 5, etc. */
  archetypeOverride?: ArchetypeRoute | null
  startedAt: number
}

const KEY = 'admin_preview_v1'
const EVENT = 'admin-preview-change'

function readFromStorage(): PreviewState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as PreviewState
  } catch {
    return null
  }
}

export function usePreviewMode() {
  const [preview, setPreviewState] = useState<PreviewState | null>(null)

  useEffect(() => {
    setPreviewState(readFromStorage())
    const sync = () => setPreviewState(readFromStorage())
    window.addEventListener('storage', sync)
    window.addEventListener(EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(EVENT, sync)
    }
  }, [])

  const setPreview = useCallback((next: PreviewState | null) => {
    if (typeof window === 'undefined') return
    if (next) sessionStorage.setItem(KEY, JSON.stringify(next))
    else sessionStorage.removeItem(KEY)
    setPreviewState(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { preview, setPreview }
}
