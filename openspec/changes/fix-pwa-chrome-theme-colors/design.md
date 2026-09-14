## Context

See `proposal.md` — Why. Platform facts established during the investigation (Chromium `main` sources, September 2026) that shape the approach:

- Installed Android PWAs are WebAPKs whose window chrome colors come from **install-time manifest metadata** (`THEME_COLOR`, `DARK_THEME_COLOR`, `BACKGROUND_COLOR`), not from the running page. Page `<meta name="theme-color">` does not reach these surfaces, and Chrome ignores page colors for WebAPK chrome in dark mode (long-standing behavior; Chromium issues 40634649, 500880823).
- With `DARK_THEME_COLOR` absent, `SplashActivity` falls back to the **light** `theme_color` in night mode, and `WebappIntentDataProvider.getColorProvider()` selects the light provider whenever it is valid and no dark value exists — hence the permanently light status bar and splash status bar.
- The per-scheme manifest members (`dark_theme_color`, `dark_background_color`) are obsolete in Blink (`manifest.mojom` marks them for removal; `manifest_parser.h` no longer parses them), so no manifest input can supply a dark value.
- Fallback defaults with nothing declared: light `#FFFFFF`, dark `#000000` (`getDefaultToolbarColor()` / `getDefaultDarkToolbarColor()`). A manifest change triggers a WebAPK metadata update via `WebApkUpdateReason.THEME_COLOR_DIFFERS`.
- Separately, browsers resolve `theme-color` as the **first matching tag in document order**; the current runtime sync appends its tag last, so it can never win resolution.
- Device verification (2026-09-14, Android 16 / Chrome 152, preview deployment): the installed-PWA status bar background matches Chrome's own status bar color in both schemes. `ChromeColors.getDefaultThemeColor()` resolves to `MaterialColors.getColor(context, R.attr.colorSurface)` (Chromium baseline `gm3_baseline_surface_light = #FFFFFF` / `gm3_baseline_surface_dark = #131314`; Material You dynamic color overrides it — `#FAF9FE`-like light on the test device). The light-mode value is therefore platform/theme-dependent, not a fixed `#FFFFFF`.
- The status bar **icon tint** is derived from the color the platform intends for the status bar (`StatusBarColorController.setStatusBarColor()`: `needsDarkStatusBarIcons = !shouldUseLightForegroundOnBackground(color)`). That intended color follows the page's resolved theme-color in light scheme mode and the platform default in dark scheme mode (page colors ignored in dark mode). Observed consequence: system light + in-app dark → light icons on the light platform surface (unreadable); the mirror case (system dark + in-app light) is legible.

## Goals / Non-Goals

**Goals:**

- Installed-PWA chrome (status bar and splash status bar) stops being permanently light in dark mode and follows the platform color scheme.
- The runtime `theme-color` tag actually wins tag resolution and tracks the site's resolved theme for user agents that honor page colors (browser tabs).
- The installed PWA's page-level theme-color follows the system scheme, so the platform's status bar icon tint never conflicts with the system-driven status bar background (no light-on-light in any system × in-app combination).
- The platform contract is recorded in the codebase and conventions so `theme_color` is not reintroduced into the manifest later.

**Non-Goals:**

- Making installed-PWA chrome follow the _in-app_ theme toggle (the platform drives the status bar background from the system scheme; D5 aligns the page tag with it instead).
- Changing browser-tab behavior: the authoritative runtime tag keeps following the in-app theme there.
- Pre-paint syncing of the runtime tag from an inline script (revisit only if post-verification behavior shows a flash worth removing).
- Changing the splash background color (`#03142E`, matched to the icon artwork) or PWA icons.

## Decisions

### D1: Remove `theme_color` from the manifest instead of declaring a value

Chrome applies a single declared value in both color schemes and no dark value can be supplied, so the only scheme-correct configuration is to declare nothing and let Chrome use `#FFFFFF` / `#000000`.

Alternatives considered:

- **Declare the dark value** (`#111314`): forces a dark status bar in light mode — worse than the current bug.
- **Keep the light value, fix only the meta tags**: does not reach WebAPK chrome in dark mode; bug remains.
- **Dynamic manifest served per user preference**: WebAPK metadata updates are asynchronous and throttled; rejected as fragile and disproportionate.
- **Repackage as a Play Store TWA**: different distribution model; out of scope.

Accepted trade-off: the exact `#FBFCFC` / `#111314` tints are lost on installed-PWA chrome (visually near-identical to the platform defaults), and surfaces such as the task switcher, navigation bar, and desktop window tint revert to platform defaults.

### D2: Make the runtime tag authoritative by winning tag resolution

Replace the append-last tag with a single dedicated runtime tag inserted **before** the static pair (start of `<head>`), re-asserted on mount and whenever the resolved theme changes. In browser tabs the static pair stays as the no-JS / pre-hydration fallback; in the installed PWA it becomes the primary source (see D5).

Alternatives considered:

- **Keep appending last**: cannot win first-match resolution — rejected.
- **Mutate the framework-rendered static tags**: risks being clobbered when React re-renders metadata (e.g. locale switch remounts the layout subtree) — rejected.
- **Drop the static pair and emit only the runtime tag**: loses the no-JS / pre-hydration scheme fallback (visible flash) — rejected.

### D3: Keep the static pair values `#FBFCFC` / `#111314`

They remain the correct browser-chrome hint where honored and the pre-hydration fallback. The spec's stale values (`#f4f5f6` / `#050606`) are corrected to match the code rather than changed.

### D4: Record the contract where future edits happen

The platform behavior is documented in `AGENTS.md` (new "Critical pitfalls" entry) and the incorrect comments are corrected in the runtime-sync component and the viewport export, so a future contributor does not "restore" `theme_color`.

### D5: The installed PWA's page-level theme-color follows the system scheme

While the site runs as an installed PWA (`display-mode: standalone`), `ThemeColorSync` does not emit its authoritative tag, so the static `prefers-color-scheme` pair governs the page's resolved theme-color. Rationale: the platform derives the status bar icon tint from the page's resolved theme-color in light scheme mode, while the status bar background follows the platform surface color — letting the in-app theme leak into that resolution produced light icons on a light bar (observed: system light + in-app dark). The `prefers-color-scheme` pair is inherently live (media queries re-evaluate on scheme change) and needs no JS listener, so dropping the runtime tag in this context is sufficient.

Alternatives considered:

- **Emit a system-valued runtime tag plus a `matchMedia` listener**: same outcome, more moving parts; the static pair already provides those values live. Rejected.
- **Keep the runtime tag in the installed PWA**: leaves the observed light-on-light defect. Rejected.
- **Re-add manifest `theme_color`**: re-breaks dark mode (D1). Rejected.

Browser tabs are unchanged: the runtime tag still follows the in-app theme (D2), so surfaces that honor page colors keep tracking the toggle.

## Risks / Trade-offs

- [Removing `theme_color` changes other installed-app surfaces] → accepted; the platform surface color is scheme-correct but device/theme-dependent (dynamic colors); documented in `AGENTS.md`.
- [Existing installs update asynchronously and throttled] → verification reinstalls the PWA to force the metadata refresh; end users converge on the next background checks.
- [The runtime tag's first position could be disturbed by client navigation] → re-assert on mount and theme change; verify with a locale switch after deploy (browser tab).
- [The platform resolves the status bar icon tint from the page theme color in light scheme mode] → the observed light-on-light defect; fixed by D5 (page tag follows the system in the installed PWA); verify on device.
- [D5 relies on `display-mode: standalone` detection] → the manifest declares `display: standalone`; verify the emulated and on-device paths.
- [D5 assumes the platform resolves the media-matched static tag when no runtime tag exists] → confirm on device (open question below).
- [Lighthouse `themed-omnibox` no longer has a manifest color] → accepted; installability criteria do not require `theme_color`.

## Migration Plan

1. Ship the manifest change, the runtime-sync fix (authoritative tag + installed-PWA system-following behavior), comment corrections, `AGENTS.md` entry, and spec update; `pnpm build` + `pnpm lint` gate.
2. On test devices, reinstall the PWA to force the WebAPK metadata refresh (note: this clears site storage, so the stored theme preference resets to `system`).
3. Verify: record the picked status bar value in both schemes (platform surface color — e.g. `#FAF9FE`-like light / `#131314`-based dark, dynamic-color devices may differ), the splash status bar over `#03142E`, and the full four-case matrix (system light/dark × in-app light/dark) for legibility; check nav bar / task switcher cosmetics.
4. Rollback: revert the manifest change (single commit); the WebAPK refreshes back on the next check, or immediately on reinstall.

## Open Questions

- Does the platform resolve the media-matched static tag for the page theme color when no runtime tag is emitted (the mechanism D5 relies on)? Confirm on device during verification (task 2.4).

Resolved during device verification (2026-09-14): light-mode installed-PWA chrome uses the **platform surface color** (`colorSurface` — `#FAF9FE`-like on the test device), not the `#FFFFFF` baseline and not the page hint `#FBFCFC`; the value is device/theme-dependent and not site-controlled.
