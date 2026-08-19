'use client'

import { Drawer } from '@heroui/react'

/**
 * Mobile slide-out drawer (`lg:hidden`), controlled by the parent.
 *
 * Slides in from the left and displays the sidebar content passed as `children`
 * (profile card, categories, tags) so the mobile experience mirrors the desktop
 * sidebar. The parent owns the open/close state and passes it via
 * `isOpen`/`onOpenChange`. Sidebar content is rendered server-side by the parent
 * and passed as children to keep server-only modules out of this client boundary.
 *
 * NOTE: this renders `Drawer.Backdrop` WITHOUT a `<Drawer>` root on purpose.
 * The `Drawer` root wraps its children in a React Aria `DialogTrigger`, whose
 * `PressResponder` fires "A PressResponder was rendered without a pressable
 * child" whenever the drawer is opened in the controlled
 * `isOpen`/`onOpenChange` pattern with no trigger button - this app's trigger
 * (the header hamburger) lives outside the `Drawer` tree. `Drawer.Backdrop` /
 * `.Content` / `.Dialog` are self-sufficient (`ModalOverlay`-based) and work
 * standalone, mirroring `SearchDialog`'s `Modal.Backdrop` without a `Modal`
 * root.
 *
 * @param siteTitle - Site title rendered in the drawer header.
 * @param isOpen - Whether the drawer is currently open.
 * @param onOpenChange - Callback invoked when the open state should change.
 * @param children - Sidebar content (server-rendered) to display in the drawer body.
 */
export function MobileDrawer({
  siteTitle,
  isOpen,
  onOpenChange,
  children,
}: Readonly<{
  siteTitle: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  children: React.ReactNode
}>) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="left">
        <Drawer.Dialog className="bg-background">
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>{siteTitle}</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="p-0">{children}</Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
