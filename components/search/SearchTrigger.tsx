'use client'

import { Button, Kbd } from '@heroui/react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMounted } from '@/lib/hooks/use-mounted'
import { useSearch } from './SearchContext'

type SearchTriggerVariant = 'desktop' | 'mobile'

interface SearchTriggerProps {
  /** `desktop` renders the keyboard shortcut hint (`⌘K`/`Ctrl+K`); `mobile` omits it. */
  variant: SearchTriggerVariant
}

/**
 * Header search affordance that opens the global {@link SearchDialog} via the
 * shared {@link useSearch} context.
 *
 * - **`desktop`**: icon-only ghost button followed by a `⌘K` (macOS) or
 *   `Ctrl+K` (other platforms) hint rendered with HeroUI's `Kbd`.
 * - **`mobile`**: icon-only ghost button without the hint, sized for touch.
 *
 * Platform detection runs only after mount (guarded by {@link useMounted}) so
 * the server markup matches the first client render and avoids hydration
 * mismatch. The global `⌘K`/`Ctrl+K` shortcut listener lives in
 * {@link SearchProvider} - this button is a mouse/touch affordance only.
 *
 * @param props - Variant controlling whether the keyboard hint is shown.
 */
export function SearchTrigger({ variant }: Readonly<SearchTriggerProps>) {
  const t = useTranslations('Search')
  const { setIsOpen } = useSearch()
  const mounted = useMounted()

  const isDesktop = variant === 'desktop'
  const isMac =
    mounted && typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const label = t('Trigger')

  return (
    <div className={isDesktop ? 'flex items-center gap-1.5' : undefined}>
      <Button
        variant={isDesktop ? 'outline' : 'ghost'}
        aria-label={label}
        onPress={() => setIsOpen(true)}
        className={isDesktop ? undefined : 'size-9'}
      >
        <Search className="size-5" />
        {isDesktop && mounted ? (
          <>
            <span className="mr-10">{label}</span>
            <Kbd className="hidden sm:inline-flex">
              <Kbd.Abbr keyValue={isMac ? 'command' : 'ctrl'} />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </>
        ) : null}
      </Button>
    </div>
  )
}
