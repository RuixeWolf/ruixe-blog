'use client'

import { useEffect } from 'react'

/**
 * Registers the no-op service worker (`/sw.js`) in production and applies
 * silent self-updates.
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
 * Update flow (silent, no UI):
 *
 *   - `updateViaCache: 'none'` bypasses the HTTP cache when byte-comparing
 *     the SW script, so a deployed `/sw.js` change is detected on the next
 *     navigation / browser update check.
 *   - `skipWaiting()` + `clients.claim()` in `/sw.js` activate the new SW
 *     immediately (no waiting for the user to close the app).
 *   - A `controllerchange` listener reloads the page once so the new SW
 *     governs the current tab. The reload is skipped on the very first
 *     install (the page had no controller yet), avoiding a pointless reload.
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

    // Only reload for a real update (the page was already controlled by an
    // older SW). On first install there is no controller yet - the `claim()`
    // that follows registration would otherwise trigger a pointless reload.
    const wasControlled = navigator.serviceWorker.controller !== null

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing || !wasControlled) return
      refreshing = true
      window.location.reload()
    })

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {})
  }, [])

  return null
}
