## Why

The installed PWA (Android 16 / Chrome 152) shows a permanently light (`#FBFCFC`) system status bar in dark mode — on the running app and on the launch splash (light status bar over the dark-navy splash). Chromium source research shows installed PWAs (WebAPKs) derive their chrome colors from install-time manifest metadata, page-level `<meta name="theme-color">` is ignored in dark mode (long-standing Chrome behavior, issues 40634649 / 500880823), and the per-scheme manifest member (`dark_theme_color`) is obsolete in Blink — so the single declared light `theme_color` is applied in both color schemes, with no site-side way to supply a dark value.

## What Changes

- **Remove `theme_color` from `app/manifest.ts`** — intentionally omitted, with an explanatory comment, so Chrome Android falls back to its scheme-correct defaults for installed-app chrome (`#FFFFFF` light / `#000000` dark). `background_color` (`#03142E`, matching the icon background) stays and keeps painting the splash.
- **Fix the runtime theme-color override** (`components/theme/ThemeColorSync.tsx`): the synced tag is currently _appended_ to `<head>`, but browsers resolve `theme-color` as the **first** matching `meta` in document order — an appended tag can never win. Make the emitted tag authoritative (prepend / single managed tag) and correct the misleading JSDoc.
- **Correct the `viewport.themeColor` comment** in `app/[lang]/layout.tsx` to describe actual platform behavior (static pre-hydration fallback; which surfaces honor page colors).
- **Document the platform contract** in `AGENTS.md` (new "Critical pitfalls" entry): installed-PWA chrome colors come from install-time manifest metadata; do not re-add `theme_color` to the manifest.
- **Update the `pwa` spec** (see Capabilities).
- **Intended behavior change**: installed-PWA chrome follows the _system_ color scheme rather than the site's in-app toggle. Known residual limitation: system dark + site forced light keeps a dark status bar (Chrome ignores page colors in dark mode — not controllable from the site).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pwa`: two requirements change — "Web App Manifest" (declared metadata no longer includes `theme_color`; intentional absence asserted) and "Runtime Theme Color" (correct color values, runtime override that actually wins resolution, and the installed-PWA system-scheme behavior documented in place of the incorrect "matches the site's theme" claim).

## Impact

- **Code**: `app/manifest.ts`, `components/theme/ThemeColorSync.tsx`, `app/[lang]/layout.tsx` (comment), `AGENTS.md`; spec merged on archive into `openspec/specs/pwa/spec.md`.
- **Runtime surfaces**: Android installed-PWA status bar and splash status bar become scheme-following; nav bar / task switcher / desktop PWA window tint fall back to platform defaults; Lighthouse `themed-omnibox` audit no longer has a manifest color; iOS is unaffected (it resolves the remaining `meta` tags).
- **Propagation**: existing installs pick the manifest change up via the WebAPK metadata update (reason `THEME_COLOR_DIFFERS`) on the next background check; reinstalling the PWA forces it immediately (clears site storage, so the stored theme preference resets to `system`).
- **Verification**: manifest JSON check, `pnpm build` / `pnpm lint`, and on-device color-pick of the status bar in both schemes plus the splash.
