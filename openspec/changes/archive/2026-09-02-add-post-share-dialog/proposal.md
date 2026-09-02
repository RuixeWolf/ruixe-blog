# Proposal: Add Post Share Dialog

## Why

The post detail page offers no way for readers to share an article: there is no share entry point, no one-tap link copy for the post URL itself (the existing copy button targets the Markdown source URL, not the page URL), and no QR code — which is the only practical share path into WeChat since WeChat has no web share URL scheme. Adding a share dialog closes this gap with a small, self-contained UI surface.

## What Changes

- Add a **Share** button in the post detail header, placed before the existing "View Markdown" button; both sit in one horizontal action row.
- Clicking the button opens a **share dialog** (HeroUI v3 `Modal`) containing:
  - The post's full URL with a **one-tap copy** button (copy/check icon feedback, auto-reset);
  - A **QR code** of the post URL (client-rendered SVG, fixed dark-on-white colors for scanner reliability);
  - A **system share** button (Web Share API) rendered only when `navigator.share` is available; activation failures (including user cancel) are silently ignored.
- Share targets track the **current browser origin** (dev / preview / production), not the configured `siteConfig.siteUrl`.
- The dialog is fully localized (zh/en) and themed (light/dark).
- No changes to post rendering, routing, SEO metadata, or existing Markdown link affordances.

## Capabilities

### New Capabilities

- `post-share`: Share affordances on the post detail page — share entry point placement, share dialog contents (URL display, link copy, QR code, system share), origin resolution, and localization.

### Modified Capabilities

(none — `post-share` is self-contained; no existing capability's requirements change)

## Impact

- **New dependency**: `qrcode.react@^4.2.0` (peer range includes React 19; pure client SVG rendering, no network requests).
- **New component**: `components/posts/ShareButton.tsx` (`'use client'`, non-controlled HeroUI v3 `Modal` with built-in trigger).
- **New helper**: `buildPostPath(slug, locale)` in `lib/seo.ts` (root-relative post path, mirroring `buildPostMarkdownPath`).
- **Modified**: `components/posts/PostLayout.tsx` (header action row wrapping `ShareButton` + `MarkdownLinkButton`), `i18n/messages/{zh,en}.json` (new `PostDetail.Share*` keys).
- **Static generation preserved**: all share logic runs client-side after dialog open; post pages remain SSG (`●`).
- **Not affected**: `mdx-content`, `seo` requirements, `post-search`, `post-comments`, RSS, llms.txt, PWA.
