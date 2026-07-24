'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Milliseconds before the "copied" check icon reverts to the copy icon. */
const COPIED_RESET_DELAY = 2000

/**
 * Client-side code block wrapper with a copy-to-clipboard button.
 *
 * Wraps the MDX `<pre>` element with a theme-aware `bg-surface-tertiary`
 * background and an always-visible copy button in the top-right corner. On
 * click, copies the raw text content of the `<pre>` to the clipboard, swaps
 * the copy icon for a check icon for {@link COPIED_RESET_DELAY} ms, then
 * reverts automatically.
 *
 * The button is anchored to an outer `relative` wrapper (not the `<pre>`) so
 * it stays fixed when the `<pre>` content scrolls horizontally. This keeps it
 * reachable on touch devices regardless of scroll position.
 *
 * @param children - The `<code>` element rendered by MDX inside the `<pre>`.
 * @param rest - Remaining `<pre>` props forwarded to the underlying element.
 */
export function CodeBlock({ children, ...rest }: Readonly<React.HTMLAttributes<HTMLPreElement>>) {
  const preRef = useRef<HTMLPreElement>(null)
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
   * Copies the `<pre>` text content to the clipboard and flashes the check icon.
   *
   * Silently no-ops when the Clipboard API is unavailable (SSR / non-secure
   * context) or the write rejects (permissions, tab not focused), so the UI
   * never enters a stuck "copied" state without an actual copy.
   */
  async function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    const text = preRef.current?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_DELAY)
    } catch {
      // Silently ignore: clipboard may be blocked (permissions, non-focused tab).
    }
  }

  return (
    <div className="relative">
      <pre
        ref={preRef}
        className="my-4 overflow-x-auto rounded-lg bg-surface-tertiary p-4 text-sm text-foreground"
        {...rest}
      >
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? t('Copied') : t('CopyCode')}
        className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-md border border-default bg-surface text-muted transition-[color] hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}
