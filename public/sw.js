/**
 * No-op Service Worker for Ruixe Blog PWA installability.
 *
 * This service worker satisfies cross-browser PWA installability criteria
 * (Firefox still requires an active SW; Chrome's install prompt is unstable
 * without one) WITHOUT caching any application resources. Offline browsing is
 * an explicit non-goal - full page reloads while offline fail normally.
 *
 * Lifecycle:
 *   - `install`  -> `self.skipWaiting()` activates the new SW immediately,
 *     bypassing the default "wait for all clients to close" behavior so
 *     updates take effect on the next navigation.
 *   - `activate` -> `self.clients.claim()` takes control of open clients
 *     immediately, so the SW governs the current tab (not just future ones).
 *
 * No `fetch` listener is registered, so no responses are intercepted or
 * cached. In production this file is registered by
 * `components/pwa/ServiceWorkerRegister.tsx` (dev mode is skipped to avoid
 * stale-cache interference).
 */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
