'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

/**
 * Status bar / browser chrome color per resolved theme (matches `viewport.themeColor`).
 * The theme color same as the page header background, so the status bar blends with the page and does not flash a different color.
 */
const THEME_COLOR_BY_THEME = {
  light: '#FBFCFC',
  dark: '#111314',
} as const

/**
 * Keeps a single authoritative `<meta name="theme-color">` tag in sync with
 * the site's resolved theme (from `next-themes`), so browsers that honor page
 * colors follow the site's actual toggle state - not just the OS color scheme.
 *
 * Browsers resolve `theme-color` as the FIRST matching tag in document order,
 * so the synced tag carries a `data-theme-color-sync` marker, has no `media`
 * attribute, and is inserted ahead of the static `prefers-color-scheme` pair
 * emitted by `viewport.themeColor` (which remains the no-JS / pre-hydration
 * fallback). Its position is re-asserted on every mount and theme change:
 * React metadata re-renders (e.g. a locale switch remounts the `[lang]`
 * layout subtree) can otherwise displace it.
 *
 * Installed Android PWA chrome is NOT affected - it derives colors from
 * install-time manifest metadata and ignores page colors in dark mode (see
 * the `theme_color` note in `app/manifest.ts`).
 *
 * @returns A null render - this component only mutates the document head.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  const color = THEME_COLOR_BY_THEME[resolvedTheme === 'dark' ? 'dark' : 'light']

  useEffect(() => {
    const selector = 'meta[name="theme-color"][data-theme-color-sync]'
    let meta = document.head.querySelector<HTMLMetaElement>(selector)
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.dataset.themeColorSync = ''
    }
    meta.content = color

    // First matching tag wins resolution, so keep the synced tag ahead of the
    // static pair. `insertBefore` is a no-op move once it is already first.
    if (document.head.firstChild !== meta) {
      document.head.insertBefore(meta, document.head.firstChild)
    }
  }, [color])

  return null
}
