## MODIFIED Requirements

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
