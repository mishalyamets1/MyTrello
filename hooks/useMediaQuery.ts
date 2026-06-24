'use client'

import { useSyncExternalStore } from 'react'

function subscribe(query: string, callback: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches
}

function getServerSnapshot() {
  return false
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => getSnapshot(query),
    getServerSnapshot
  )
}

export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
