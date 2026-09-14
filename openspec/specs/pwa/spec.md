# PWA Specification

## Purpose

Lets readers install the blog as a Progressive Web App to their operating system home screen for app-like standalone access, without offline caching overhead.

## Requirements

### Requirement: Web App Manifest

The system SHALL serve a valid Web App Manifest at `/manifest.webmanifest` (generated via the `app/manifest.ts` file convention) declaring the site's installability metadata: name, short name, description, start URL, display mode, background color, and PWA icons. The manifest SHALL NOT declare `theme_color`; installed-PWA chrome follows the platform color scheme instead (see Runtime Theme Color).

#### Scenario: Manifest is auto-discoverable

- **WHEN** a browser or PWA validator fetches any page of the site
- **THEN** the HTML `<head>` contains a `<link rel="manifest" href="/manifest.webmanifest">` tag auto-injected by the Next.js file convention
- **AND** fetching `/manifest.webmanifest` returns a valid JSON manifest with `name`, `short_name`, `description`, `start_url`, `display`, `background_color`, and `icons` fields

#### Scenario: Manifest omits theme_color by design

- **WHEN** the generated manifest JSON is inspected
- **THEN** it SHALL NOT contain a `theme_color` field
- **AND** the omission SHALL be documented in the manifest source as intentional, because installed-PWA runtimes apply a single declared value in both color schemes

#### Scenario: Manifest reuses site configuration

- **WHEN** the manifest is generated
- **THEN** the `name` and `description` fields SHALL be sourced from `content/site.yaml` via `lib/site-config.ts` (single source of truth)
- **AND** the `start_url` SHALL be `/` so the existing locale-detection redirect in `proxy.ts` routes the user to their preferred locale on launch

#### Scenario: Manifest is statically generated

- **WHEN** the site is built
- **THEN** `/manifest.webmanifest` is pre-rendered at build time (marked `○` static in build output) and does not introduce dynamic rendering

### Requirement: PWA Icons

The system SHALL provide PWA icons at standard sizes with appropriate `purpose` declarations, generated from the site's source icon via an automated script. The `any`-purpose icons SHALL be rendered as rounded rectangles with transparent corners (desktop platforms display them unmasked), while the `maskable` icon SHALL remain fully opaque edge-to-edge (platforms apply their own mask; pre-rounded or transparent corners would be masked twice or composited onto an unexpected background).

#### Scenario: Icons cover standard sizes and purposes

- **WHEN** the manifest `icons` array is inspected
- **THEN** it SHALL include at least three icon entries: a 192×192 `purpose: "any"` icon, a 512×512 `purpose: "any"` icon, and a 512×512 `purpose: "maskable"` icon
- **AND** each icon `src` SHALL be a stable URL under `/` (e.g. `/icon-192.png`) resolvable as a static file in `public/`

#### Scenario: Maskable icon has safe-zone padding

- **WHEN** the 512×512 maskable icon is rendered by an Android adaptive icon renderer
- **THEN** the icon content SHALL be confined to the central 80% safe zone (W3C maskable spec) so platform-shaped masks do not clip the logo
- **AND** the icon SHALL be fully opaque with no transparent pixels

#### Scenario: Any-purpose icons are rounded with transparent corners

- **WHEN** the 192×192 and 512×512 `purpose: "any"` icons are displayed unmasked (e.g. desktop install prompt, taskbar, dock)
- **THEN** each icon SHALL show rounded rectangular corners with fully transparent corner pixels
- **AND** the corner radius proportion SHALL match the browser favicon's

#### Scenario: Icons are regenerable from source

- **WHEN** the `generate-pwa-icons` script is run
- **THEN** it SHALL read the master source icon (`assets/app-icon.png`, a full-bleed opaque square) and produce every generated icon asset — the PWA icons in `public/` plus the browser icon files (`app/icon.png`, `app/favicon.ico`, `app/apple-icon.png`) — using the `sharp` library
- **AND** running the script again with an unchanged source SHALL produce byte-identical output (deterministic generation)

### Requirement: Service Worker for Installability

The system SHALL register a service worker at `/sw.js` (served from `public/`) to satisfy cross-browser PWA installability criteria, without caching any application resources.

#### Scenario: Service worker is registered in production

- **WHEN** a user visits the site in a production deployment (`NODE_ENV === 'production'`) with a browser that supports the Service Worker API
- **THEN** the system SHALL register `/sw.js` with `scope: '/'`
- **AND** the service worker SHALL activate and claim all clients without waiting

#### Scenario: Service worker is not registered in development

- **WHEN** a user visits the site in development mode (`NODE_ENV !== 'production'`)
- **THEN** the system SHALL NOT register the service worker
- **AND** no `/sw.js` registration request SHALL be made (avoids stale-cache interference during development)

#### Scenario: Service worker does not cache resources

- **WHEN** the service worker is active and the browser goes offline
- **THEN** the service worker SHALL NOT serve cached responses for any request
- **AND** full page reloads while offline SHALL fail normally (offline browsing is an explicit non-goal)

#### Scenario: Service worker file is served with correct headers

- **WHEN** a client fetches `/sw.js`
- **THEN** the response SHALL include `Content-Type: application/javascript; charset=utf-8`, `Cache-Control: no-cache, no-store, must-revalidate`, and a `Content-Security-Policy` restricting scripts to `self`
- **AND** these headers SHALL be configured via `next.config.ts` `headers()`

### Requirement: Runtime Theme Color

The system SHALL declare a static `<meta name="theme-color">` pair — `#FBFCFC` for `(prefers-color-scheme: light)` and `#111314` for `(prefers-color-scheme: dark)` — as the browser-chrome color hint for user agents that honor page colors, and SHALL maintain a single authoritative runtime tag that reflects the site's resolved theme and outranks the static pair when a browser resolves the page's theme color. Android installed-PWA chrome derives its colors from install-time manifest metadata and ignores page colors in dark mode; because the manifest omits `theme_color`, that chrome follows the platform color scheme (its themed surface color) instead of a single fixed color. While the site runs as an installed PWA (`display-mode: standalone`), the resolved page theme color SHALL follow the system color scheme rather than the in-app theme selection: the runtime tag is not emitted in that context, so the static pair governs. The platform derives the status bar icon tint from this resolved theme color in light scheme mode while the status bar background follows the platform surface color, so both must track the same scheme to stay legible.

#### Scenario: Light scheme status bar

- **WHEN** the user's OS is in light color scheme mode and the site follows the system
- **THEN** the HTML `<head>` SHALL contain a `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#FBFCFC">` tag
- **AND** user agents that honor page colors SHALL render their chrome in that light color

#### Scenario: Dark scheme status bar

- **WHEN** the user's OS is in dark color scheme mode and the site follows the system
- **THEN** the HTML `<head>` SHALL contain a `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111314">` tag
- **AND** user agents that honor page colors SHALL render their chrome in that dark color

#### Scenario: Runtime tag tracks the resolved site theme (browser tab)

- **WHEN** the site runs in a browser tab and its resolved theme is light or dark — whether from the OS preference or an explicit in-app selection
- **THEN** the system SHALL maintain a single authoritative `theme-color` tag whose content is the matching value (`#FBFCFC` / `#111314`)
- **AND** browsers resolving the page's theme color SHALL obtain this value rather than the static pair's
- **AND** the value SHALL update without a page reload when the theme changes

#### Scenario: Installed PWA theme color follows the system

- **WHEN** the site runs as an installed PWA (`display-mode: standalone`) and the in-app theme differs from the system color scheme
- **THEN** the page's resolved theme color SHALL follow the system color scheme (the runtime tag is not emitted; the static pair governs)
- **AND** the platform's status bar icon tint SHALL stay legible against the platform-provided status bar background in every system × in-app combination

#### Scenario: Theme color switches with system

- **WHEN** the user toggles their OS color scheme while the site follows the system
- **THEN** the resolved theme color SHALL switch to match the new scheme without a page reload (browser tabs update the authoritative tag; the installed PWA's static pair re-resolves)

#### Scenario: Installed PWA chrome follows the system scheme

- **WHEN** the installed PWA runs on Android with the system in dark mode
- **THEN** its status bar and splash status bar SHALL use the platform's scheme-correct surface color (dark; the Chromium baseline is `#131314`, dynamic-color devices may differ), never the light `#FBFCFC` value
- **AND** with the system in light mode they SHALL use the platform's light surface color (device/theme-dependent, e.g. `#FAF9FE`-like where dynamic colors apply) rather than a site-declared value
- **AND** in every combination of system scheme and in-app theme, the status bar background and icon tint SHALL remain legible (no light-on-light)

### Requirement: iOS Standalone App Support

The system SHALL declare Apple web app metadata so iOS users who "Add to Home Screen" get a standalone, full-screen app experience rather than a Safari-chrome wrapper.

#### Scenario: iOS standalone capability

- **WHEN** the HTML `<head>` is inspected
- **THEN** it SHALL contain `<meta name="apple-mobile-web-app-capable" content="yes">` (or the modern `mobile-web-app-capable` equivalent)
- **AND** `<meta name="apple-mobile-web-app-title" content="Ruixe Blog">` SHALL be present

#### Scenario: iOS status bar style

- **WHEN** the iOS PWA is launched from the home screen
- **THEN** the status bar SHALL use the default style (preserving the OS status bar background and text colors)

### Requirement: Installability

The system SHALL meet browser installability criteria so modern browsers (Chrome, Edge, Firefox, Safari iOS) offer an "Install" / "Add to Home Screen" prompt.

#### Scenario: Lighthouse PWA installable

- **WHEN** a Lighthouse PWA audit is run against the production deployment
- **THEN** the "Installable" check SHALL pass
- **AND** no manifest validation errors SHALL be reported

#### Scenario: No custom install UI

- **WHEN** a user visits the site
- **THEN** the system SHALL NOT render a custom install button or `beforeinstallprompt` capture UI
- **AND** installability SHALL rely on the browser's native install prompt (cross-browser compatibility; iOS does not support `beforeinstallprompt`)
