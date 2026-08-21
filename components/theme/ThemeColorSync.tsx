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
 * Keeps the `<meta name="theme-color">` tag in sync with the site's active
 * theme (from `next-themes`), so the browser chrome and Android status bar
 * follow the site's actual toggle state - not just the OS color scheme.
 *
 * The synced tag carries a `data-theme-color-sync` marker and is appended last
 * in `<head>`, so it overrides the static `prefers-color-scheme` media-query
 * tags emitted by `viewport.themeColor` (which remain as the no-JS /
 * pre-hydration fallback).
 *
 * @returns A null render - this component only mutates the document head.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  const color = THEME_COLOR_BY_THEME[resolvedTheme === 'dark' ? 'dark' : 'light']

  useEffect(() => {
    const selector = 'meta[name="theme-color"][data-theme-color-sync]'
    let meta = document.querySelector<HTMLMetaElement>(selector)
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.dataset.themeColorSync = ''
      document.head.appendChild(meta)
    }
    meta.content = color
  }, [color])

  return null
}
