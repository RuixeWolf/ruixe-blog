import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

/**
 * Generates `/manifest.webmanifest` at build time.
 *
 * Declares the site's PWA installability metadata (name, description, start
 * URL, display mode, background color, and icons) reusing `siteConfig` as the
 * single source of truth for title and description.
 *
 * `theme_color` is intentionally omitted: installed-PWA chrome derives its
 * colors from install-time manifest metadata, and a declared value applies in
 * BOTH color schemes (the per-scheme `dark_theme_color` member is obsolete in
 * Blink). Declaring nothing lets Chrome use its scheme-correct defaults
 * (`#FFFFFF` light / `#000000` dark); `background_color` still paints the
 * splash. Do NOT re-add it (see the `AGENTS.md` "Critical pitfalls" entry).
 *
 * Next.js file convention auto-generates the `/manifest.webmanifest` route
 * and injects the matching `<link rel="manifest">` tag into every page's
 * `<head>`. Statically pre-rendered at build time (no Request-time API), so
 * it does not introduce dynamic rendering.
 *
 * @returns Web App Manifest consumed by Next.js metadata routing.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: siteConfig.siteTitle,
    short_name: siteConfig.siteTitle,
    description: siteConfig.siteDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#03142E',
    // No `theme_color` - see the JSDoc above for why.
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
