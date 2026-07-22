'use client'

import { useState } from 'react'
import { Button, Popover } from '@heroui/react'
import { Menu, Search, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Link } from '@/i18n/navigation'
import { siteConfig } from '@/lib/site-config'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileDrawer } from './MobileDrawer'

/**
 * Mobile header (`lg:hidden`) with integrated drawer trigger.
 *
 * Header: hamburger button (left), site title (center), search + settings (right).
 * The hamburger opens `MobileDrawer` (left-side) which displays server-rendered
 * sidebar content passed in via the `sidebar` prop. The settings button opens a
 * `Popover` with the language switcher and theme toggle.
 *
 * @param sidebar - Server-rendered sidebar content (profile card, categories, tags)
 *                  passed through to the drawer body to avoid crossing the
 *                  server-only boundary inside this client component.
 */
export function MobileHeader({ sidebar }: Readonly<{ sidebar: React.ReactNode }>) {
  const tHeader = useTranslations('Header')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-default px-4 lg:hidden">
        <Button
          isIconOnly
          variant="ghost"
          aria-label={tHeader('Menu')}
          onPress={() => setIsDrawerOpen(true)}
        >
          <Menu className="size-5" />
        </Button>

        <Link href="/" className="text-base font-bold text-foreground">
          {siteConfig.siteTitle}
        </Link>

        <div className="flex items-center gap-1">
          <Button isIconOnly variant="ghost" aria-label={tHeader('Search')} isDisabled>
            <Search className="size-5" />
          </Button>
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

      <MobileDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        {sidebar}
      </MobileDrawer>
    </>
  )
}
