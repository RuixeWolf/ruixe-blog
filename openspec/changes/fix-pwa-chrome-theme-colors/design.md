## Context

See `proposal.md` — Why. Platform facts established during the investigation (Chromium `main` sources, September 2026) that shape the approach:

- Installed Android PWAs are WebAPKs whose window chrome colors come from **install-time manifest metadata** (`THEME_COLOR`, `DARK_THEME_COLOR`, `BACKGROUND_COLOR`), not from the running page. Page `<meta name="theme-color">` does not reach these surfaces, and Chrome ignores page colors for WebAPK chrome in dark mode (long-standing behavior; Chromium issues 40634649, 500880823).
- With `DARK_THEME_COLOR` absent, `SplashActivity` falls back to the **light** `theme_color` in night mode, and `WebappIntentDataProvider.getColorProvider()` selects the light provider whenever it is valid and no dark value exists — hence the permanently light status bar and splash status bar.
- The per-scheme manifest members (`dark_theme_color`, `dark_background_color`) are obsolete in Blink (`manifest.mojom` marks them for removal; `manifest_parser.h` no longer parses them), so no manifest input can supply a dark value.
- Fallback defaults with nothing declared: light `#FFFFFF`, dark `#000000` (`getDefaultToolbarColor()` / `getDefaultDarkToolbarColor()`). A manifest change triggers a WebAPK metadata update via `WebApkUpdateReason.THEME_COLOR_DIFFERS`.
- Separately, browsers resolve `theme-color` as the **first matching tag in document order**; the current runtime sync appends its tag last, so it can never win resolution.

## Goals / Non-Goals

**Goals:**

- Installed-PWA chrome (status bar and splash status bar) stops being permanently light in dark mode and follows the platform color scheme.
- The runtime `theme-color` tag actually wins tag resolution and tracks the site's resolved theme for user agents that honor page colors.
- The platform contract is recorded in the codebase and conventions so `theme_color` is not reintroduced into the manifest later.

**Non-Goals:**

- Making installed-PWA chrome follow the _in-app_ theme toggle while the system is in dark mode (not controllable from the site on current Chrome; tracked upstream).
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

Replace the append-last tag with a single dedicated runtime tag inserted **before** the static pair (start of `<head>`), re-asserted on mount and whenever the resolved theme changes. The static pair stays as the no-JS / pre-hydration fallback.

Alternatives considered:

- **Keep appending last**: cannot win first-match resolution — rejected.
- **Mutate the framework-rendered static tags**: risks being clobbered when React re-renders metadata (e.g. locale switch remounts the layout subtree) — rejected.
- **Drop the static pair and emit only the runtime tag**: loses the no-JS / pre-hydration scheme fallback (visible flash) — rejected.

### D3: Keep the static pair values `#FBFCFC` / `#111314`

They remain the correct browser-chrome hint where honored and the pre-hydration fallback. The spec's stale values (`#f4f5f6` / `#050606`) are corrected to match the code rather than changed.

### D4: Record the contract where future edits happen

The platform behavior is documented in `AGENTS.md` (new "Critical pitfalls" entry) and the incorrect comments are corrected in the runtime-sync component and the viewport export, so a future contributor does not "restore" `theme_color`.

## Risks / Trade-offs

- [Removing `theme_color` changes other installed-app surfaces] → accepted; platform defaults are scheme-correct; documented in `AGENTS.md`.
- [Existing installs update asynchronously and throttled] → verification reinstalls the PWA to force the metadata refresh; end users converge on the next background checks.
- [The runtime tag's first position could be disturbed by client navigation] → re-assert on mount and theme change; verify with a locale switch after deploy.
- [Light-mode behavior on installed chrome is not fully pinned (page hint vs platform default)] → the spec scenario deliberately accepts either light outcome; record the observed value during verification.
- [Lighthouse `themed-omnibox` no longer has a manifest color] → accepted; installability criteria do not require `theme_color`.

## Migration Plan

1. Ship the manifest change together with the runtime-sync fix, comment corrections, `AGENTS.md` entry, and spec update; `pnpm build` + `pnpm lint` gate.
2. On test devices, reinstall the PWA to force the WebAPK metadata refresh (note: this clears site storage, so the stored theme preference resets to `system`).
3. Verify: system dark → status bar `#000000`, splash status bar dark over `#03142E`; record the light-mode strip value (`#FFFFFF` vs `#FBFCFC`); check nav bar / task switcher cosmetics.
4. Rollback: revert the manifest change (single commit); the WebAPK refreshes back on the next check, or immediately on reinstall.

## Open Questions

- Does installed-PWA light-mode chrome use the page hint (`#FBFCFC`) or the platform default (`#FFFFFF`)? Answer during step 3 of the migration plan; both satisfy the spec, and the outcome only informs whether the runtime-sync fix has a visible effect on installed chrome in light mode.
