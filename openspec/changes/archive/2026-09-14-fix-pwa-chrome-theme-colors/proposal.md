## Why

The installed PWA (Android 16 / Chrome 152) shows a permanently light (`#FBFCFC`) system status bar in dark mode — on the running app and on the launch splash (light status bar over the dark-navy splash). Chromium source research shows installed PWAs (WebAPKs) derive their chrome colors from install-time manifest metadata, page-level `<meta name="theme-color">` is ignored in dark mode (long-standing Chrome behavior, issues 40634649 / 500880823), and the per-scheme manifest member (`dark_theme_color`) is obsolete in Blink — so the single declared light `theme_color` is applied in both color schemes, with no site-side way to supply a dark value.

## What Changes

- **Remove `theme_color` from `app/manifest.ts`** — intentionally omitted, with an explanatory comment, so Chrome Android falls back to the platform's scheme-correct chrome color for installed apps (its themed surface color: `#FFFFFF` / `#131314` baseline, overridden by Material You dynamic colors — `#FAF9FE`-like light on the test device). `background_color` (`#03142E`, matching the icon background) stays and keeps painting the splash.
- **Fix the runtime theme-color override** (`components/theme/ThemeColorSync.tsx`): the synced tag is currently _appended_ to `<head>`, but browsers resolve `theme-color` as the **first** matching `meta` in document order — an appended tag can never win. Make the emitted tag authoritative (prepend / single managed tag) and correct the misleading JSDoc.
- **Make the installed PWA's page-level `theme-color` follow the system scheme** (`components/theme/ThemeColorSync.tsx`): while running as an installed PWA (`display-mode: standalone`) the runtime tag is not emitted, so the static `prefers-color-scheme` pair governs the page's resolved theme-color. The platform derives the status bar icon tint from that resolved color in light scheme mode, while the status bar background follows the platform surface color — without this, "system light + in-app dark" produced light icons on the light bar (observed on device). Browser tabs are unchanged (the runtime tag keeps following the in-app theme).
- **Correct the `viewport.themeColor` comment** in `app/[lang]/layout.tsx` to describe actual platform behavior (static pair = primary source in the installed PWA; authoritative runtime tag for browser tabs; which surfaces honor page colors).
- **Document the platform contract** in `AGENTS.md` (extended "Critical pitfalls" entry): installed-PWA chrome colors come from install-time manifest metadata; do not re-add `theme_color` to the manifest.
- **Update the `pwa` spec** (see Capabilities).
- **Intended behavior change**: installed-PWA chrome follows the _system_ color scheme rather than the site's in-app toggle. On-device verification (2026-09-14, Android 16 / Chrome 152) confirmed the status bar background now matches Chrome's own status bar color in both schemes — a device/theme-dependent platform surface color, so the exact `#FBFCFC` tint is no longer used. The status bar **icon tint** is resolved from the page's theme-color in light scheme mode and from the platform default in dark scheme mode; the page tag therefore follows the system inside the installed PWA (see above) so the icons stay legible. The previously documented "system dark + site forced light" limitation did not reproduce (that combination is legible); the defect found instead was "system light + in-app dark" (light-on-light), which this change addresses.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pwa`: two requirements change — "Web App Manifest" (declared metadata no longer includes `theme_color`; intentional absence asserted) and "Runtime Theme Color" (correct color values, runtime override that actually wins resolution, and the installed-PWA system-scheme behavior documented in place of the incorrect "matches the site's theme" claim).

## Impact

- **Code**: `app/manifest.ts`, `components/theme/ThemeColorSync.tsx` (authoritative tag + installed-PWA system-following behavior), `app/[lang]/layout.tsx` (comment), `AGENTS.md`; spec merged on archive into `openspec/specs/pwa/spec.md`.
- **Runtime surfaces**: Android installed-PWA status bar and splash status bar become scheme-following (platform surface color); the installed PWA's page-level theme-color follows the system scheme so the status bar icon tint stays legible; browser tabs keep the in-app-theme runtime tag; nav bar / task switcher / desktop PWA window tint fall back to platform defaults; Lighthouse `themed-omnibox` audit no longer has a manifest color; iOS is unaffected (it resolves the remaining `meta` tags).
- **Propagation**: existing installs pick the manifest change up via the WebAPK metadata update (reason `THEME_COLOR_DIFFERS`) on the next background check; reinstalling the PWA forces it immediately (clears site storage, so the stored theme preference resets to `system`).
- **Verification**: manifest JSON check, `pnpm build` / `pnpm lint`, and on-device color-pick across the four-case matrix (system light/dark × in-app light/dark) plus the splash — all four combinations must stay legible.
