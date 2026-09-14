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
