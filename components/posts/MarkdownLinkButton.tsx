'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Link, Tooltip } from '@heroui/react'
import { buttonVariants } from '@heroui/styles'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Milliseconds before the "copied" check icon reverts to the copy icon. */
const COPIED_RESET_DELAY = 2000

/** Props for the Markdown link button component. */
interface MarkdownLinkButtonProps {
  /**
   * Root-relative path of the post's Markdown version
   * (`/{locale}/posts/{slug}/index.md`), built server-side via
   * `buildPostMarkdownPath` and passed in as a prop so this client component
   * never imports the server-only `lib/seo` module. The browser resolves the
   * origin at runtime so the link tracks the current host in dev, preview, and
   * production.
   */
  path: string
}

/**
 * Post detail header affordance for accessing the raw Markdown source.
 *
 * Renders two side-by-side controls:
 *
 * - **"View Markdown"** link button (HeroUI `Link`, `target="_blank"`): opens
 *   the post's `.md` route in a new tab so readers (and LLMs) can read the
 *   frontmatter-stripped markdown source. The `path` prop is root-relative, so
 *   the browser resolves it against the current origin in dev, preview, and
 *   production.
 * - **Copy** icon button (HeroUI `Button`, `isIconOnly`): copies the absolute
 *   Markdown URL (current origin + `path`) to the clipboard, flashing a check
 *   icon for {@link COPIED_RESET_DELAY} ms on success (mirrors the `CodeBlock`
 *   copy pattern).
 *
 * The clipboard logic reuses `CodeBlock.tsx`'s approach: guard
 * `navigator.clipboard` availability, build the absolute URL from
 * `window.location.origin + path`, `writeText` it, auto-reset the copied
 * state, clear the timer on unmount, and silently catch failures so the UI
 * never enters a stuck "copied" state. When the Clipboard API is unavailable
 * (SSR or non-secure HTTP context) the handler no-ops.
 *
 * Both controls are wrapped in HeroUI v3 `Tooltip` (compound pattern, default
 * 700 ms hover delay): the link explains it opens the raw source in a new tab
 * (`ViewMarkdownTooltip`), and the copy button advertises the copy action,
 * switching to `Copied` while the check icon is shown.
 *
 * @param path - Root-relative Markdown path for the current post.
 */
export function MarkdownLinkButton({ path }: Readonly<MarkdownLinkButtonProps>) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t = useTranslations('PostDetail')

  // Clear any pending reset timer on unmount to prevent state updates after
  // teardown and to let rapid re-clicks restart the timer cleanly.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  /**
   * Copies the Markdown URL to the clipboard and flashes the check icon.
   *
   * Silently no-ops when the Clipboard API is unavailable (SSR / non-secure
   * context) or the write rejects (permissions, tab not focused), so the UI
   * never enters a stuck "copied" state without an actual copy.
   */
  async function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_DELAY)
    } catch {
      // Silently ignore: clipboard may be blocked (permissions, non-focused tab).
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <Link
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'tertiary', size: 'sm' })}
        >
          <ExternalLink className="mr-1 size-4" aria-hidden="true" />
          {t('ViewMarkdown')}
        </Link>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          <p>{t('ViewMarkdownTooltip')}</p>
        </Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Button
          isIconOnly
          variant="tertiary"
          size="sm"
          onPress={handleCopy}
          aria-label={copied ? t('Copied') : t('CopyMarkdownLink')}
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </Button>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          <p>{copied ? t('Copied') : t('CopyMarkdownLinkTooltip')}</p>
        </Tooltip.Content>
      </Tooltip>
    </div>
  )
}
