'use client'

import type { ComponentProps } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Client-side wrapper around `next-themes` ThemeProvider.
 *
 * Configures class-based dark mode (`attribute="class"`) compatible with
 * HeroUI v3's `.light`/`.dark` class strategy. Defaults to light theme with
 * system-preference following enabled and no transition flash on switch.
 */
export function ThemeProvider({
  children,
  ...props
}: Readonly<ComponentProps<typeof NextThemesProvider>>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
