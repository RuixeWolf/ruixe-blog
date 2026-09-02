# Design: Add Post Share Dialog

## Context

`PostLayout.tsx` (RSC, `server-only`) renders the post header; `lib/seo.ts` is server-only, so client components must never import it — URLs are passed in as root-relative path props (the `MarkdownLinkButton` / `buildPostMarkdownPath` precedent). `SearchDialog.tsx` documents the HeroUI v3 `Modal` pitfalls already solved in this codebase (ESC handling, focus trap, mobile close affordance). The clipboard pattern (guard, 2 s copied state, timer cleanup) is established in `MarkdownLinkButton.tsx` and `CodeBlock.tsx`.

## Goals / Non-Goals

**Goals:**

- Self-contained client component; zero changes to data flow, routing, or SEO.
- Share URL always matches the browser's current origin (dev / preview / prod).
- QR code rendered client-side, offline, privacy-preserving (no third-party requests).

**Non-Goals:**

- Social-platform share buttons (X/微博/Telegram link templates) — QR code + system share cover the same need without per-platform maintenance.
- Share counting/analytics.
- Sharing anything other than the post URL (title/description are only passed to `navigator.share`, not encoded anywhere else).

## Decisions

1. **Dedicated client component `ShareButton`** (`components/posts/ShareButton.tsx`), mounted by `PostLayout` with a root-relative `path` prop.
   _Why:_ mirrors `MarkdownLinkButton`'s prop-based server→client boundary; keeps JSDoc, clipboard state, and modal logic in one testable unit.
   _Alternative:_ extending `MarkdownLinkButton` into a generic "link actions" bar — rejected: misleading name, mixed responsibilities.

2. **Root-relative path prop + `window.location.origin` join.**
   New `buildPostPath(slug, locale): string` in `lib/seo.ts` returns `/{locale}/posts/{slug}` (sibling of `buildPostMarkdownPath`). The client builds the absolute URL only after the dialog opens.
   _Why:_ `siteConfig.siteUrl` is wrong in dev/preview; `window.location.href` couples the component to routing.
   _Alternative:_ server-computed absolute URL via `buildPostUrl` — rejected (preview deployments would show production URLs).

3. **HeroUI v3 `Modal`, non-controlled trigger mode.**
   The share button renders as the `Modal`'s child trigger; structure: `Modal.Backdrop → Modal.Container → Modal.Dialog → CloseTrigger / Header / Body`. Default (small) size, no `size="cover"`, no `isKeyboardDismissDisabled`.
   _Why:_ unlike `SearchDialog`, there is no external open-state owner, no input field, no custom ESC gradient — the simple documented pattern suffices and avoids the overlay-ESC pitfalls `SearchDialog` had to work around.
   _Alternative:_ `Popover` (content too heavy, mobile positioning fragile) or `Drawer` (conflicts with mobile nav pattern).

4. **Hydration safety without `useMounted`.**
   All browser-API reads (`window.location.origin`, `navigator.share` detection, clipboard) happen inside the `Modal.Body`, which only mounts after the user opens the dialog — post-hydration by definition. SSR renders only the trigger button.
   _Contingency:_ if implementation reveals that HeroUI Modal pre-renders children while closed, guard origin resolution with `useMounted` (already available at `lib/hooks/use-mounted.ts`) — verification point in tasks.

5. **QR code via `qrcode.react@^4.2.0` (`QRCodeSVG`).**
   ~200 px square, `fgColor="#000"`, `bgColor="#fff"`, SVG `title` for a11y, wrapped in a white rounded card so it stays scannable in dark mode.
   **Quiet zone (implementation deviation, recorded):** the final code uses `marginSize={1}` instead of the initially planned `marginSize={4}` — at 200 px the QR modules are small enough that `marginSize={4}` (16 modules ≈ 58 px of border) visibly shrank the code inside the card. The remaining quiet zone is provided jointly by `marginSize={1}` (4 px) and the white card's `p-3` (12 px) padding, which together keep a light margin around the code on all sides; scanner reliability was verified on device.
   _Why:_ pure client SVG, zero network requests, peer range includes React 19 (verified).
   _Alternatives:_ `qrcode` + manual canvas (lifecycle churn), server route handler (breaks all-SSG story), external QR service (privacy + availability).

6. **System share button gated on `typeof navigator.share === 'function'`**, calling `navigator.share({ url, title })` and silently catching rejection (user cancel rejects with `AbortError`).
   _Why:_ big mobile UX win (WeChat/Weibo/native apps) for one line of detection; silent catch is required to avoid unhandled rejections on cancel.

7. **i18n: 5 new keys in the `PostDetail` namespace** — `Share`, `ShareDialog`, `CopyLink`, `LinkCopied`, `SystemShare` — following the existing PascalCase convention; zh and en in lockstep.
   _Why a separate `LinkCopied`:_ the existing `Copied` key is the code-copy/Markdown-copy affordance; independent wording keeps tooltip/future copy flexible.

## Risks / Trade-offs

- [HeroUI v3 is beta; `Modal` non-controlled API may change] → Containment: single component, no other usage shares this pattern; upgrade impact is one file.
- [Modal may pre-render closed-state children → hydration mismatch on `window.location.origin`] → Mitigation: verification task; fallback is the existing `useMounted` guard.
- [Fixed black-on-white QR ignores theme aesthetics] → Accepted: scanner reliability outranks theme fidelity; visual integration via rounded white card on the themed dialog background.
- [New runtime dependency] → Small (~10 kB), tree-shakeable, actively maintained, React 19 peer support confirmed; no patching required.
- [`navigator.share` availability varies even on desktop Chrome (needs secure context)] → Detection is per-open, so behavior degrades gracefully to copy + QR.

## Migration Plan

Purely additive; no data or URL changes. Rollback = revert the single commit (and remove the dependency). No redirects, no schema edits.

## Open Questions

- Final QR `size` (180 vs 220 px) — decide visually during implementation; does not affect any requirement.
- Link row typography (`<code>`-style vs plain muted text) — visual polish during implementation.
- Copy control label style (icon-only vs icon+text) — visual polish during implementation.
