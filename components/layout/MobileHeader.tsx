'use client'

import { useState } from 'react'
import { Button, Popover } from '@heroui/react'
import { Menu, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SearchTrigger } from '@/components/search/SearchTrigger'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileDrawer } from './MobileDrawer'

/**
 * Mobile header (`lg:hidden`) with integrated drawer trigger.
 *
 * Header: hamburger button (left), site title (center), search + settings (right).
 * The hamburger opens `MobileDrawer` (left-side) which displays server-rendered
 * content passed in via the `navLinks` and `sidebar` props. The settings button
 * opens a `Popover` with the language switcher and theme toggle.
 *
 * `navLinks`, `sidebar`, and `siteTitle` are RSC payloads - server-rendered
 * values serialized across the server/client boundary so server-only modules
 * (e.g. `lib/site-config` fs reads, `lib/taxonomy` fs reads) stay out of this
 * client component.
 *
 * @param siteTitle - Site title rendered in the header and forwarded to the drawer.
 * @param navLinks - Server-rendered primary navigation (`NavLinks variant="drawer"`).
 * @param sidebar - Server-rendered sidebar content (profile card, categories, tags).
 */
export function MobileHeader({
  siteTitle,
  navLinks,
  sidebar,
}: Readonly<{ siteTitle: string; navLinks: React.ReactNode; sidebar: React.ReactNode }>) {
  const tHeader = useTranslations('Header')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-default bg-surface/70 px-4 backdrop-blur-md lg:hidden">
        <Button
          isIconOnly
          variant="ghost"
          aria-label={tHeader('Menu')}
          onPress={() => setIsDrawerOpen(true)}
        >
          <Menu className="size-5" />
        </Button>

        <Link href="/" className="text-base font-bold text-foreground">
          {siteTitle}
        </Link>

        <div className="flex items-center gap-1">
          <SearchTrigger variant="mobile" />
          <Popover>
            <Button isIconOnly variant="ghost" aria-label={tHeader('Settings')}>
              <Settings className="size-5" />
            </Button>
            <Popover.Content className="max-w-64">
              <Popover.Dialog>
                <Popover.Heading className="text-sm font-semibold">
                  {tHeader('Settings')}
                </Popover.Heading>
                <div className="mt-3 flex flex-col gap-3">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
      </header>

      <MobileDrawer siteTitle={siteTitle} isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        {/*
          Click-interceptor: closes the drawer whenever any child link is clicked.
          Relies on DOM event capture - a single `onClickCapture` on the wrapper
          catches clicks on NavLinks items and SidebarContent category/tag links
          alike during the capture phase (before they reach the link). This avoids
          jsx-a11y warnings on static elements while still closing the drawer.
          `preventDefault` is intentionally NOT called so Next.js Link client
          navigation and the GitHub external link `target="_blank"` still proceed.
          The child links are the keyboard-accessible interactive elements; this
          wrapper is an event-delegation container, not an interactive control.
        */}
        <div onClickCapture={() => setIsDrawerOpen(false)}>
          {navLinks}
          {sidebar}
        </div>
      </MobileDrawer>
    </>
  )
}
