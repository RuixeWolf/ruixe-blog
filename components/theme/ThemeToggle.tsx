'use client'

import { Tabs } from '@heroui/react'
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useMounted } from '@/lib/hooks/use-mounted'

/** Supported theme modes. `system` follows the OS preference via next-themes. */
type ThemeMode = 'system' | 'light' | 'dark'

/**
 * Tab descriptors for the three theme modes.
 *
 * Order matches the visual layout: system (default), light, then dark. Icons
 * come from lucide-react; visible labels are omitted in favor of icons plus
 * screen-reader text resolved from the `Theme` i18n namespace.
 */
const THEME_MODES: ReadonlyArray<{
  key: ThemeMode
  Icon: LucideIcon
  labelKey: 'System' | 'Light' | 'Dark'
}> = [
  { key: 'system', Icon: Monitor, labelKey: 'System' },
  { key: 'light', Icon: Sun, labelKey: 'Light' },
  { key: 'dark', Icon: Moon, labelKey: 'Dark' },
]

/**
 * Three-way theme mode switcher (system / light / dark) built on HeroUI v3 Tabs.
 *
 * Replaces the previous single toggle button. The selected tab reflects the
 * `next-themes` `theme` *preference* (not `resolvedTheme`), so picking "system"
 * retains OS-following behavior. "system" is the default via `ThemeProvider`.
 *
 * Hydration: `next-themes` exposes `theme` only after mount, so we fall back to
 * "system" until `useMounted()` flips - this matches the SSR markup (default
 * theme) and avoids a hydration mismatch on the selected indicator.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  const t = useTranslations('Theme')

  const selectedKey = (mounted ? (theme ?? 'system') : 'system') as ThemeMode

  return (
    <Tabs selectedKey={selectedKey} onSelectionChange={(key) => setTheme(key as ThemeMode)}>
      <Tabs.ListContainer>
        <Tabs.List aria-label={t('Mode')} className="*:size-7 *:p-0">
          {THEME_MODES.map(({ key, Icon, labelKey }) => (
            <Tabs.Tab key={key} id={key}>
              <Icon className="size-4.5" />
              <span className="sr-only">{t(labelKey)}</span>
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  )
}
