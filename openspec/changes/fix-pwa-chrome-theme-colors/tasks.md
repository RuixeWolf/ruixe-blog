## 1. Manifest

- [x] 1.1 Remove `theme_color` from `app/manifest.ts`, adding a comment that documents the intentional omission (installed-PWA chrome follows the platform color scheme; runtimes apply a single declared value in both schemes); verify by fetching `http://localhost:3000/manifest.webmanifest` and confirming the JSON has no `theme_color` field while `background_color` is still `#03142E`
- [x] 1.2 Confirm the remaining installability metadata is intact (`name`, `short_name`, `description`, `start_url`, `display`, `icons`) in the same response and that Chrome DevTools → Application → Manifest reports no errors

## 2. Runtime Theme Color

- [x] 2.1 Rework `components/theme/ThemeColorSync.tsx` to maintain one authoritative `theme-color` tag (no `media` attribute) inserted before the static pair at the start of `<head>`, updated whenever the resolved theme changes, with its position re-asserted on mount; **and** to skip emitting that tag when running as the installed PWA (`display-mode: standalone`), so the static `prefers-color-scheme` pair governs the page's resolved theme color there; correct its JSDoc; verify in DevTools on `http://localhost:3000/en` that `document.querySelectorAll('meta[name="theme-color"]')` lists the runtime tag first and that toggling the theme updates its `content` without a page reload
- [x] 2.2 Verify in a browser tab that the runtime tag stays first and holds the in-app theme's value across a locale switch (en → zh → en), covering the layout-remount path
- [x] 2.3 Correct the `viewport.themeColor` comment in `app/[lang]/layout.tsx` to describe actual behavior (static pair = primary source in the installed PWA; authoritative runtime tag for browser tabs; installed-PWA chrome follows the platform surface color); verify `pnpm lint` passes
- [ ] 2.4 Verify the installed-PWA path (DevTools `display-mode: standalone` emulation + on device): no runtime tag is emitted, the resolved theme color follows the system scheme when the in-app theme differs, and the status bar icons stay legible against the platform background (system light + in-app dark must show dark icons)

## 3. Documentation

- [x] 3.1 Extend the "Critical pitfalls" entry in `AGENTS.md`: installed-PWA chrome colors come from install-time manifest metadata; omitting `theme_color` yields the platform surface color (a themed/dynamic `colorSurface` — not a fixed `#FFFFFF` on dynamic-color devices); the platform still derives the status bar icon tint from the page's theme-color in light scheme mode, so the page-level tag follows the system in the installed PWA; `theme_color` must not be re-added. Verify the entry matches the file's existing bullet style and passes `pnpm format`

## 4. Build and Regression Checks

- [x] 4.1 Run `pnpm format-lint` and `pnpm build`; verify both succeed and `/manifest.webmanifest` still builds as a static route (`○` in the build output)
- [x] 4.2 Regression-check the served head (`curl http://localhost:3000/en`): the static pair (`#FBFCFC` light / `#111314` dark) is still present with values matching the runtime constant, and no stale theme values (`#f4f5f6`, `#050606`) remain in `app/`, `components/`, or `AGENTS.md`

## 5. Device Verification (Android 16 / Chrome)

- [ ] 5.1 Deploy to production and reinstall the PWA on the device to force the WebAPK metadata refresh; verify with the system in dark mode that the status bar uses the platform's dark surface color (color-pick; the Chromium baseline is `#131314`, dynamic-color devices may differ) and the splash shows a dark status bar over the `#03142E` background
- [ ] 5.2 Walk the four-case matrix (system light/dark × in-app light/dark) and record the picked status bar background + icon tint for each; verify all four combinations are legible (in particular system light + in-app dark), that the background matches Chrome's own status bar color in both schemes, and check navigation bar / task-switcher cosmetics
