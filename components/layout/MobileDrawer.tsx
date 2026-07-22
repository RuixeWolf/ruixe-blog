'use client'

import { Drawer } from '@heroui/react'
import { siteConfig } from '../../lib/site-config'

/**
 * Mobile slide-out drawer (`lg:hidden`), controlled by the parent.
 *
 * Slides in from the left and displays the sidebar content passed as `children`
 * (profile card, categories, tags) so the mobile experience mirrors the desktop
 * sidebar. The parent owns the open/close state and passes it via
 * `isOpen`/`onOpenChange`. Sidebar content is rendered server-side by the parent
 * and passed as children to keep server-only modules out of this client boundary.
 *
 * @param isOpen - Whether the drawer is currently open.
 * @param onOpenChange - Callback invoked when the open state should change.
 * @param children - Sidebar content (server-rendered) to display in the drawer body.
 */
export function MobileDrawer({
  isOpen,
  onOpenChange,
  children,
}: Readonly<{
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  children: React.ReactNode
}>) {
  return (
    <Drawer>
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>{siteConfig.siteTitle}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>{children}</Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
