## MODIFIED Requirements

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

### Requirement: Runtime Theme Color

The system SHALL declare a static `<meta name="theme-color">` pair — `#FBFCFC` for `(prefers-color-scheme: light)` and `#111314` for `(prefers-color-scheme: dark)` — as the browser-chrome color hint for user agents that honor page colors, and SHALL maintain a single authoritative runtime tag that reflects the site's resolved theme and outranks the static pair when a browser resolves the page's theme color. Android installed-PWA chrome derives its colors from install-time manifest metadata and ignores page colors in dark mode; because the manifest omits `theme_color`, that chrome follows the platform color scheme (light / dark defaults) instead of a single fixed color.

#### Scenario: Light scheme status bar

- **WHEN** the user's OS is in light color scheme mode and the site follows the system
- **THEN** the HTML `<head>` SHALL contain a `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#FBFCFC">` tag
- **AND** user agents that honor page colors SHALL render their chrome in that light color

#### Scenario: Dark scheme status bar

- **WHEN** the user's OS is in dark color scheme mode and the site follows the system
- **THEN** the HTML `<head>` SHALL contain a `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111314">` tag
- **AND** user agents that honor page colors SHALL render their chrome in that dark color

#### Scenario: Runtime tag tracks the resolved site theme

- **WHEN** the site's resolved theme is light or dark — whether from the OS preference or an explicit in-app selection
- **THEN** the system SHALL maintain a single authoritative `theme-color` tag whose content is the matching value (`#FBFCFC` / `#111314`)
- **AND** browsers resolving the page's theme color SHALL obtain this value rather than the static pair's
- **AND** the value SHALL update without a page reload when the theme changes

#### Scenario: Theme color switches with system

- **WHEN** the user toggles their OS color scheme while the site follows the system
- **THEN** the resolved theme — and therefore the authoritative tag — SHALL switch to match the new scheme without a page reload

#### Scenario: Installed PWA chrome follows the system scheme

- **WHEN** the installed PWA runs on Android with the system in dark mode
- **THEN** its status bar and splash status bar SHALL use the platform dark default (`#000000`), never the light `#FBFCFC` value
- **AND** with the system in light mode they SHALL use a light color (platform light default, or the runtime hint where the platform honors page colors)
