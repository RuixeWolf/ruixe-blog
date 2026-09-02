# Tasks: Add Post Share Dialog

## 1. Setup

- [x] 1.1 Run `pnpm add qrcode.react` and verify installation succeeds (`node -p "require('qrcode.react/package.json').version"` prints `4.x`) without bumping pinned `typescript`/`eslint` versions
- [x] 1.2 Add `buildPostPath(slug: string, locale: Locale): string` to `lib/seo.ts` (returns `/{locale}/posts/{slug}`) with JSDoc mirroring `buildPostMarkdownPath`, and verify via `pnpm lint` that no client module imports it directly

## 2. Share Component

- [x] 2.1 Create `components/posts/ShareButton.tsx` (`'use client'`): non-controlled HeroUI v3 `Modal` with tertiary `sm` Button trigger (Share2 icon + `PostDetail.Share` label), `Modal.CloseTrigger`, `Modal.Header` (icon + `ShareDialog` heading), and `Modal.Body` layout; verify the trigger renders on the post page and opens/closes the (empty) dialog via button, ✕, ESC, and backdrop click
- [x] 2.2 Implement URL display + copy inside `Modal.Body`: resolve `window.location.origin + path` after dialog open, show truncated URL text, copy button reusing the `MarkdownLinkButton` clipboard pattern (guard, 2 s check-icon reset, unmount timer cleanup); verify in browser that the copied value equals the address-bar URL and the check icon reverts after ~2 s
- [x] 2.3 Implement the QR code block: `QRCodeSVG` (~200 px, `fgColor #000`, `bgColor #fff`, `marginSize={4}`, localized `title`) inside a white rounded card; verify in light AND dark theme that the code stays dark-on-light and scans with a phone
- [x] 2.4 Implement the conditional system share button: detect `typeof navigator.share === 'function'` after dialog open, call `navigator.share({ url, title })` on press, silently catch rejection; verify the button appears/disappears per browser capability and that cancelling the native sheet surfaces no error
- [x] 2.5 Verify hydration safety: confirm (dev tools / SSR source) that closed dialog does not render `Modal.Body` content referencing `window`; if it does, add the `useMounted` guard per design.md decision 4 and re-verify no hydration mismatch in console

## 3. Integration

- [x] 3.1 Wire into `PostLayout.tsx`: wrap `ShareButton` (path via `buildPostPath(meta.slug, locale)`) and `MarkdownLinkButton` in one `flex flex-wrap items-center gap-1` row, share button first; verify on `/zh/posts/<slug>` and `/en/posts/<slug>` that the row renders with share before "View Markdown"
- [x] 3.2 Add i18n keys `Share`, `ShareDialog`, `CopyLink`, `LinkCopied`, `SystemShare` to `PostDetail` in `i18n/messages/zh.json` and `en.json`; verify both locales display fully translated dialog text

## 4. Verification

- [x] 4.1 Run `pnpm format-lint` and fix any violations; verify zero ESLint errors
- [x] 4.2 Run `pnpm build` and verify post detail pages remain statically generated (`●` in the route summary, no new `ƒ` dynamic entries)
- [x] 4.3 Cross-browser/viewport pass on `http://localhost:3000/zh/posts/ai-coding-workflow-2026-mid`: desktop + mobile widths, light + dark themes, ESC/✕/backdrop dismissal, keyboard focus order, and screen-reader labels (a11y names on all controls)
