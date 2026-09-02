'use client'

import { useState } from 'react'
import { Button, Dropdown, Header, Label, Separator, type Selection } from '@heroui/react'
import { ChevronDown, Rss, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { GithubMark } from '@/components/icons/GithubMark'
import { useSearch } from '@/components/search/SearchContext'
import { THEME_MODES } from '@/components/theme/ThemeToggle'
import { routing, type Locale } from '@/i18n/routing'
import { LOCALE_LABELS, useLocaleSwitch } from './LanguageSwitcher'

/**
 * Merged mobile-header actions menu.
 *
 * Consolidates the three former mobile header buttons (search, RSS, settings)
 * into a single trigger whose chevron icon flips (down when closed, up when
 * open) with the menu's controlled open state. The menu is built from native
 * HeroUI v3 dropdown items in three sections:
 *
 * 1. **Actions** - search (opens the global `SearchDialog` via `useSearch`),
 *    GitHub repository (anchor item opening the repo in a new tab), and RSS
 *    subscription (anchor item linking to the locale feed).
 * 2. **Language** - single-selection section reusing `useLocaleSwitch`; the
 *    active locale carries the checkmark indicator.
 * 3. **Theme** - single-selection section mapping to `next-themes` modes
 *    (system / light / dark), sharing icons and labels with `ThemeToggle`.
 *
 * Selection is fully controlled (derived from `useLocale`/`useTheme`), so
 * pressing the already-selected item can never visually deselect it.
 *
 * @param githubRepoUrl - Absolute URL of the blog's GitHub repository
 *   (`siteConfig.githubRepoUrl`, derived from the `githubRepository` field),
 *   passed in as an RSC payload because this client component must not import
 *   the server-only `lib/site-config` module.
 */
export function MobileActionsMenu({ githubRepoUrl }: Readonly<{ githubRepoUrl: string }>) {
  const tHeader = useTranslations('Header')
  const tSearch = useTranslations('Search')
  const tTheme = useTranslations('Theme')
  const { theme, setTheme } = useTheme()
  const { setIsOpen: setSearchOpen } = useSearch()
  const { currentLocale, switchTo } = useLocaleSwitch()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  /**
   * Runs the imperative action for non-selection items. Link items (GitHub
   * repository, RSS) navigate natively and need no handling here; selection
   * items are routed through their section's `onSelectionChange` instead.
   *
   * @param key - The `id` of the activated `Dropdown.Item`.
   */
  function handleAction(key: React.Key) {
    if (key === 'search') {
      setSearchOpen(true)
      setIsMenuOpen(false)
    }
  }

  /**
   * Switches to the locale picked in the language section and closes the menu
   * (the locale change remounts the layout anyway, but closing keeps the
   * trigger chevron state honest).
   *
   * @param selection - React Aria selection payload from the language section.
   */
  function handleLocaleSelection(selection: Selection) {
    const key = selection === 'all' ? undefined : [...selection][0]
    if (typeof key !== 'string') return
    if (!(routing.locales as readonly string[]).includes(key)) return
    switchTo(key as Locale)
    setIsMenuOpen(false)
  }

  /**
   * Applies the theme picked in the theme section. React Aria closes the menu
   * on item activation; the checkmark lands on the new mode when reopened.
   *
   * @param selection - React Aria selection payload from the theme section.
   */
  function handleThemeSelection(selection: Selection) {
    const key = selection === 'all' ? undefined : [...selection][0]
    if (typeof key !== 'string') return
    if (THEME_MODES.some(({ key: mode }) => mode === key)) setTheme(key)
  }

  return (
    <Dropdown isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <Button isIconOnly variant="ghost" aria-label={tHeader('More')}>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
        />
      </Button>
      <Dropdown.Popover className="min-w-56">
        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Item id="search" textValue={tSearch('Trigger')}>
            <Search className="size-4 shrink-0 text-muted" />
            <Label>{tSearch('Trigger')}</Label>
          </Dropdown.Item>
          <Dropdown.Item
            id="github"
            href={githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            textValue={tHeader('Github')}
          >
            <GithubMark className="size-4 shrink-0 text-muted" />
            <Label>{tHeader('Github')}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="rss" href={`/${currentLocale}/feed.xml`} textValue={tHeader('Rss')}>
            <Rss className="size-4 shrink-0 text-muted" />
            <Label>{tHeader('Rss')}</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Section
            selectionMode="single"
            selectedKeys={new Set([currentLocale])}
            onSelectionChange={handleLocaleSelection}
          >
            <Header>{tHeader('Language')}</Header>
            {routing.locales.map((locale) => (
              <Dropdown.Item key={locale} id={locale} textValue={LOCALE_LABELS[locale].name}>
                <Dropdown.ItemIndicator />
                <Label>{LOCALE_LABELS[locale].name}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
          <Separator />
          <Dropdown.Section
            selectionMode="single"
            selectedKeys={new Set([theme ?? 'system'])}
            onSelectionChange={handleThemeSelection}
          >
            <Header>{tTheme('Mode')}</Header>
            {THEME_MODES.map(({ key, Icon, labelKey }) => (
              <Dropdown.Item key={key} id={key} textValue={tTheme(labelKey)}>
                <Dropdown.ItemIndicator />
                <Icon className="size-4 shrink-0 text-muted" />
                <Label>{tTheme(labelKey)}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
