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
 * Media query matching an installed-PWA (standalone) launch of this site; the
 * manifest declares `display: standalone`, so installed launches match it.
 */
const STANDALONE_DISPLAY_MODE_QUERY = '(display-mode: standalone)'

/** Selector for the runtime-synced `theme-color` tag managed by this component. */
const SYNCED_THEME_COLOR_SELECTOR = 'meta[name="theme-color"][data-theme-color-sync]'

/**
 * Aligns the page's resolved `theme-color` with the surface that paints it, in
 * two display modes:
 *
 * - **Browser tab** - keeps a single authoritative
 *   `<meta name="theme-color">` tag in sync with the site's resolved theme
 *   (from `next-themes`), so browsers that honor page colors follow the site's
 *   actual toggle state, not just the OS color scheme.
 * - **Installed PWA** (`display-mode: standalone`) - emits no runtime tag, so
 *   the static `prefers-color-scheme` pair emitted by `viewport.themeColor`
 *   governs the resolved theme color. The platform derives the status bar icon
 *   tint from this resolved color while the status bar background follows the
 *   platform surface color, so the page must track the system scheme here to
 *   keep the icons legible (see the `AGENTS.md` "Critical pitfalls" entry).
 *
 * Browsers resolve `theme-color` as the FIRST matching tag in document order,
 * so the synced tag carries a `data-theme-color-sync` marker, has no `media`
 * attribute, and is inserted ahead of the static pair. Its position is
 * re-asserted on every mount and theme change: React metadata re-renders
 * (e.g. a locale switch remounts the `[lang]` layout subtree) can otherwise
 * displace it.
 *
 * @returns A null render - this component only mutates the document head.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  const color = THEME_COLOR_BY_THEME[resolvedTheme === 'dark' ? 'dark' : 'light']

  useEffect(() => {
    const standaloneQuery = window.matchMedia(STANDALONE_DISPLAY_MODE_QUERY)

    const syncThemeColorTag = () => {
      const existingTag = document.head.querySelector<HTMLMetaElement>(SYNCED_THEME_COLOR_SELECTOR)

      // Installed PWA: the static `prefers-color-scheme` pair must govern the
      // resolved color (and therefore the platform's status bar icon tint), so
      // drop the runtime tag whenever one exists.
      if (standaloneQuery.matches) {
        existingTag?.remove()
        return
      }

      let meta = existingTag
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
    }

    syncThemeColorTag()
    // The display mode can change mid-session (e.g. DevTools emulation), so
    // re-evaluate the tag set when it does.
    standaloneQuery.addEventListener('change', syncThemeColorTag)
    return () => standaloneQuery.removeEventListener('change', syncThemeColorTag)
  }, [color])

  return null
}
