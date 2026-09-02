'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Modal } from '@heroui/react'
import { Check, Copy, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'

/** Milliseconds before the "copied" check icon reverts to the copy icon. */
const COPIED_RESET_DELAY = 2000

/** Edge length of the QR code SVG, in CSS pixels. */
const QR_CODE_SIZE = 200

/** Props for the post share button component. */
interface ShareButtonProps {
  /**
   * Root-relative path of the post detail page
   * (`/{locale}/posts/{slug}`), built server-side via `buildPostPath` and
   * passed in as a prop so this client component never imports the
   * server-only `lib/seo` module. The browser resolves the origin at
   * runtime so the shared URL tracks the current host in dev, preview, and
   * production.
   */
  path: string
  /** Post title, forwarded to `navigator.share` as the share-sheet title. */
  title: string
}

/** Props for the dialog body, which only mounts after the dialog opens. */
interface ShareDialogContentProps {
  /** Root-relative path of the post detail page. */
  path: string
  /** Post title, forwarded to `navigator.share` as the share-sheet title. */
  title: string
}

/**
 * Post detail header affordance for sharing the current post.
 *
 * Renders a tertiary "Share" trigger button that opens a HeroUI v3 `Modal`
 * (non-controlled trigger mode — the trigger is a plain child `Button`). The
 * dialog body ({@link ShareDialogContent}) contains:
 *
 * - the post's absolute URL (current origin + `path`) with a one-tap copy
 *   button, and
 * - a client-rendered QR code of the same URL (fixed dark-on-white for
 *   scanner reliability in light and dark themes).
 *
 * All browser-API reads (`window.location.origin`, `navigator.share`
 * detection, clipboard) live in {@link ShareDialogContent}, which mounts only
 * after the user opens the dialog — post-hydration by definition — so the
 * server renders nothing but the trigger button.
 *
 * @param path - Root-relative post path for the current locale.
 * @param title - Post title forwarded to the Web Share API.
 */
export function ShareButton({ path, title }: Readonly<ShareButtonProps>) {
  const t = useTranslations('PostDetail')

  return (
    <Modal>
      <Button variant="tertiary" size="sm">
        <Share2 className="mr-1 size-4" aria-hidden="true" />
        {t('Share')}
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div className="flex items-center justify-start gap-2">
                <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                  <Share2 className="size-5" aria-hidden="true" />
                </Modal.Icon>
                <Modal.Heading>{t('ShareDialog')}</Modal.Heading>
              </div>
            </Modal.Header>
            <Modal.Body className="gap-4">
              <ShareDialogContent path={path} title={title} />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

/**
 * Body of the share dialog; mounts only when the dialog is open.
 *
 * Because this component never renders during SSR or hydration (the closed
 * `Modal` only renders its trigger), it may read `window` and `navigator`
 * directly:
 *
 * - the absolute share URL is resolved once per open via
 *   `window.location.origin + path`;
 * - Web Share API support is detected once per open via a lazy state
 *   initializer (`typeof navigator.share === 'function'`) and degrades
 *   gracefully to copy + QR code when unavailable;
 * - the copy button reuses the `MarkdownLinkButton` clipboard pattern: guard
 *   `navigator.clipboard` availability, `writeText` the absolute URL, flash a
 *   check icon for {@link COPIED_RESET_DELAY} ms, clear the timer on
 *   unmount, and silently catch failures so the UI never enters a stuck
 *   "copied" state.
 *
 * The QR code is rendered entirely client-side by `qrcode.react`
 * (`QRCodeSVG`) with fixed `#000`-on-`#fff` colors and a spec-mandated quiet
 * zone (`marginSize={4}`), wrapped in a white rounded card so it stays
 * scannable in dark mode.
 *
 * @param path - Root-relative post path for the current locale.
 * @param title - Post title forwarded to the Web Share API.
 */
function ShareDialogContent({ path, title }: Readonly<ShareDialogContentProps>) {
  const t = useTranslations('PostDetail')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Resolved once per dialog open (client-only mount), so the URL tracks the
  // current browser origin in dev, preview, and production.
  const [url] = useState(() => `${window.location.origin}${path}`)

  // Web Share API support is detected per open via a lazy initializer (the
  // body mounts only client-side, so `navigator` is always defined);
  // `navigator.share` requires a secure context, so the button gracefully
  // disappears when unavailable.
  const [canSystemShare] = useState(() => typeof navigator.share === 'function')

  // Clear any pending reset timer on unmount (dialog close) to prevent state
  // updates after teardown and to let rapid re-opens restart cleanly.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  /**
   * Copies the post URL to the clipboard and flashes the check icon.
   *
   * Silently no-ops when the Clipboard API is unavailable (non-secure
   * context) or the write rejects, so the UI never enters a stuck "copied"
   * state without an actual copy.
   */
  async function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_DELAY)
    } catch {
      // Silently ignore: clipboard may be blocked (permissions, non-focused tab).
    }
  }

  /**
   * Opens the native share sheet with the post URL and title.
   *
   * Rejection (user cancel, `AbortError`) and failures are silently ignored
   * per spec so cancelling never surfaces an error.
   */
  async function handleSystemShare() {
    try {
      await navigator.share({ url, title })
    } catch {
      // Silently ignore: user cancel rejects the promise with AbortError.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <QRCodeSVG
            value={url}
            size={QR_CODE_SIZE}
            marginSize={1}
            fgColor="#000000"
            bgColor="#ffffff"
            title={t('ShareDialog')}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2 font-mono text-sm text-muted">
          {url}
        </p>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="tertiary"
          onPress={handleCopy}
          aria-label={copied ? t('LinkCopied') : t('CopyLink')}
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {t('CopyLink')}
        </Button>
        {canSystemShare ? (
          <Button variant="secondary" onPress={handleSystemShare}>
            <Share2 className="size-4" aria-hidden="true" />
            {t('SystemShare')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
