## 1. Manifest

- [x] 1.1 Remove `theme_color` from `app/manifest.ts`, adding a comment that documents the intentional omission (installed-PWA chrome follows the platform color scheme; runtimes apply a single declared value in both schemes); verify by fetching `http://localhost:3000/manifest.webmanifest` and confirming the JSON has no `theme_color` field while `background_color` is still `#03142E`
- [x] 1.2 Confirm the remaining installability metadata is intact (`name`, `short_name`, `description`, `start_url`, `display`, `icons`) in the same response and that Chrome DevTools → Application → Manifest reports no errors

## 2. Runtime Theme Color

- [x] 2.1 Rework `components/theme/ThemeColorSync.tsx` to maintain one authoritative `theme-color` tag (no `media` attribute) inserted before the static pair at the start of `<head>`, updated whenever the resolved theme changes, with its position re-asserted on mount; correct its JSDoc; verify in DevTools on `http://localhost:3000/en` that `document.querySelectorAll('meta[name="theme-color"]')` lists the runtime tag first and that toggling the theme updates its `content` without a page reload
- [x] 2.2 Verify the runtime tag stays first and holds the correct value across a locale switch (en → zh → en), covering the layout-remount path
- [x] 2.3 Correct the `viewport.themeColor` comment in `app/[lang]/layout.tsx` to describe actual behavior (static pre-hydration fallback; installed-PWA chrome follows the system scheme); verify `pnpm lint` passes

## 3. Documentation

- [x] 3.1 Add a "Critical pitfalls" entry to `AGENTS.md` recording that installed-PWA chrome colors come from install-time manifest metadata, that page `theme-color` is ignored in dark mode, and that `theme_color` must not be re-added to the manifest; verify the entry matches the file's existing bullet style and passes `pnpm format`

## 4. Build and Regression Checks

- [x] 4.1 Run `pnpm format-lint` and `pnpm build`; verify both succeed and `/manifest.webmanifest` still builds as a static route (`○` in the build output)
- [x] 4.2 Regression-check the served head (`curl http://localhost:3000/en`): the static pair (`#FBFCFC` light / `#111314` dark) is still present with values matching the runtime constant, and no stale theme values (`#f4f5f6`, `#050606`) remain in `app/`, `components/`, or `AGENTS.md`

## 5. Device Verification (Android 16 / Chrome)

- [ ] 5.1 Deploy to production and reinstall the PWA on the device to force the WebAPK metadata refresh; verify with the system in dark mode that the status bar is `#000000` (color-pick) and the splash shows a dark status bar over the `#03142E` background
- [ ] 5.2 Record the light-mode status bar value (`#FFFFFF` vs `#FBFCFC`) and walk the four-case matrix (system light/dark × in-app light/dark); verify no light bar appears in system dark mode, and check navigation bar / task-switcher cosmetics
