'use client'

import { useSyncExternalStore } from 'react'
import { Button, Tooltip } from '@heroui/react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

/** No-op subscribe for `useSyncExternalStore` (no external updates needed). */
const emptySubscribe = () => () => {}

/**
 * Returns `false` during SSR and initial hydration, `true` after client mount.
 *
 * Uses `useSyncExternalStore` instead of `useEffect` + `setState` to avoid
 * cascading renders flagged by the React Compiler lint rule.
 */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}

/**
 * Theme toggle button with sun/moon icons.
 *
 * Uses `next-themes` `useTheme()` to read and switch the resolved theme.
 * Guards against hydration mismatch by rendering a static placeholder until
 * the component mounts on the client (SSR cannot know the user's theme).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return (
      <Button isIconOnly variant="ghost" isDisabled aria-label="Toggle theme">
        <Sun className="size-5" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <Tooltip delay={0}>
      <Button
        isIconOnly
        variant="ghost"
        onPress={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={label}
      >
        {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
      <Tooltip.Content>
        <p>{label}</p>
      </Tooltip.Content>
    </Tooltip>
  )
}
