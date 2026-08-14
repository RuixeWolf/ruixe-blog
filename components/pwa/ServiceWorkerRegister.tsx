'use client'

import { useEffect } from 'react'

/**
 * Registers the no-op service worker (`/sw.js`) in production.
 *
 * The service worker is a progressive enhancement that satisfies cross-browser
 * PWA installability criteria without caching any resources. Registration is
 * gated by two guards:
 *
 *   - **Dev guard**: `process.env.NODE_ENV !== 'production'` skips
 *     registration in development to avoid stale-cache interference while
 *     iterating on the app.
 *   - **SSR guard**: `'serviceWorker' in navigator` degrades gracefully on
 *     older browsers / server renders where the API is unavailable.
 *
 * Registration failures are swallowed (`.catch(() => {})`) because the SW is
 * purely additive - the site works identically without it.
 *
 * Renders `null` (no UI); this is a side-effect-only component mounted in the
 * root layout.
 *
 * @returns Always `null`.
 */
export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }, [])

  return null
}
