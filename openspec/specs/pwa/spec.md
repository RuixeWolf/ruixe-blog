# PWA Specification

## Purpose

Lets readers install the blog as a Progressive Web App to their operating system home screen for app-like standalone access, without offline caching overhead.

## Requirements

### Requirement: Web App Manifest

The system SHALL serve a valid Web App Manifest at `/manifest.webmanifest` (generated via the `app/manifest.ts` file convention) declaring the site's installability metadata: name, short name, description, start URL, display mode, theme/background colors, and PWA icons.

#### Scenario: Manifest is auto-discoverable

- **WHEN** a browser or PWA validator fetches any page of the site
- **THEN** the HTML `<head>` contains a `<link rel="manifest" href="/manifest.webmanifest">` tag auto-injected by the Next.js file convention
- **AND** fetching `/manifest.webmanifest` returns a valid JSON manifest with `name`, `short_name`, `description`, `start_url`, `display`, `theme_color`, `background_color`, and `icons` fields

#### Scenario: Manifest reuses site configuration

- **WHEN** the manifest is generated
- **THEN** the `name` and `description` fields SHALL be sourced from `content/site.yaml` via `lib/site-config.ts` (single source of truth)
- **AND** the `start_url` SHALL be `/` so the existing locale-detection redirect in `proxy.ts` routes the user to their preferred locale on launch

#### Scenario: Manifest is statically generated

- **WHEN** the site is built
- **THEN** `/manifest.webmanifest` is pre-rendered at build time (marked `○` static in build output) and does not introduce dynamic rendering

### Requirement: PWA Icons

The system SHALL provide PWA icons at standard sizes with appropriate `purpose` declarations, generated from the site's source icon via an automated script.

#### Scenario: Icons cover standard sizes and purposes

- **WHEN** the manifest `icons` array is inspected
- **THEN** it SHALL include at least three icon entries: a 192×192 `purpose: "any"` icon, a 512×512 `purpose: "any"` icon, and a 512×512 `purpose: "maskable"` icon
- **AND** each icon `src` SHALL be a stable URL under `/` (e.g. `/icon-192.png`) resolvable as a static file in `public/`

#### Scenario: Maskable icon has safe-zone padding

- **WHEN** the 512×512 maskable icon is rendered by an Android adaptive icon renderer
- **THEN** the icon content SHALL be confined to the central 80% safe zone (W3C maskable spec) so platform-shaped masks do not clip the logo

#### Scenario: Icons are regenerable from source

- **WHEN** the `generate-pwa-icons` script is run
- **THEN** it SHALL read the source icon (`app/icon.png`) and produce all PWA icon PNGs in `public/` using the `sharp` library
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

The system SHALL declare a `<meta name="theme-color">` tag that responds to the user's operating system color scheme preference, so the browser chrome (e.g. Android Chrome status bar) matches the site's light or dark theme at runtime.

#### Scenario: Light scheme status bar

- **WHEN** the user's OS is in light color scheme mode
- **THEN** the HTML `<head>` SHALL contain a `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f4f5f6">` tag
- **AND** the browser SHALL render its chrome in the light theme color

#### Scenario: Dark scheme status bar

- **WHEN** the user's OS is in dark color scheme mode
- **THEN** the HTML `<head>` SHALL contain a `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#050606">` tag
- **AND** the browser SHALL render its chrome in the dark theme color

#### Scenario: Theme color switches with system

- **WHEN** the user toggles their OS color scheme while the site is open
- **THEN** the active `<meta name="theme-color">` SHALL switch to match the new scheme without a page reload

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
