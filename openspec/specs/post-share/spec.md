# post-share Specification

## Purpose

Lets readers share a blog post from the post detail page via a share dialog exposing the post URL with one-tap copy, a QR code, and the device's native share sheet when available.

## Requirements

### Requirement: Share entry point on post detail page

The post detail page SHALL display a share entry point in the post header action row, positioned before the existing "View Markdown" affordance. The entry point SHALL be visibly labeled as a share action in the active locale and SHALL open the share dialog when activated.

#### Scenario: Share button visible on post detail page

- **WHEN** a visitor views any post detail page
- **THEN** a share button labeled with the active locale's share text is displayed in the header action row, before the "View Markdown" button

#### Scenario: Share button hidden on other pages

- **WHEN** a visitor views a non-post page (home, category listing, tag listing, about)
- **THEN** no share entry point is displayed

### Requirement: Share dialog shows the current-origin post URL

The share dialog SHALL display the post's absolute URL resolved against the current browser origin (not the configured site URL), so the URL is correct in local development, preview deployments, and production.

#### Scenario: URL tracks the current origin

- **WHEN** the share dialog is opened on a preview deployment (e.g. `https://example-preview.vercel.app/zh/posts/foo`)
- **THEN** the dialog displays `https://example-preview.vercel.app/zh/posts/foo`

#### Scenario: URL preserves the active locale

- **WHEN** the share dialog is opened on an English post page
- **THEN** the displayed URL contains the `/en` locale prefix

### Requirement: One-tap copy of the post URL

The share dialog SHALL provide a copy control that copies the displayed post URL to the clipboard and shows immediate visual confirmation (copied state) that automatically reverts after a short delay. When the Clipboard API is unavailable, the control SHALL fail silently without entering a stuck copied state.

#### Scenario: Copy succeeds

- **WHEN** the visitor activates the copy control
- **THEN** the post URL is written to the clipboard and the control shows a copied confirmation for approximately 2 seconds before reverting

#### Scenario: Clipboard unavailable

- **WHEN** the Clipboard API is unavailable (e.g. non-secure context)
- **THEN** activating the copy control has no effect and no stuck copied state is shown

### Requirement: QR code of the post URL

The share dialog SHALL render a QR code encoding the post URL, generated entirely client-side with no network requests to third parties. The QR code SHALL use a dark foreground on a light background regardless of the site theme, to keep scanner reliability in light and dark modes.

#### Scenario: QR code renders for the post URL

- **WHEN** the share dialog is opened
- **THEN** a scannable QR code encoding the post URL is displayed

#### Scenario: QR code readable in dark mode

- **WHEN** the share dialog is opened while the site is in dark theme
- **THEN** the QR code still renders with a dark foreground on a light background card

### Requirement: System share when available

The share dialog SHALL offer a system share control that invokes the Web Share API with the post URL, but only when the browser supports `navigator.share`. If sharing is cancelled or fails, the failure SHALL be silently ignored.

#### Scenario: System share offered on supporting browsers

- **WHEN** the share dialog is opened in a browser supporting the Web Share API
- **THEN** a system share control is displayed and, when activated, opens the device's share sheet with the post URL

#### Scenario: System share hidden on non-supporting browsers

- **WHEN** the share dialog is opened in a browser without Web Share API support
- **THEN** no system share control is displayed and the dialog remains fully usable via copy and QR code

#### Scenario: Share cancellation ignored

- **WHEN** the visitor dismisses the native share sheet
- **THEN** no error is surfaced and the share dialog remains usable

### Requirement: Share dialog is dismissible and accessible

The share dialog SHALL be closable via its close button, the Escape key, and activation of the backdrop, and SHALL present a localized dialog title. All share controls SHALL provide accessible names in the active locale.

#### Scenario: Escape closes the dialog

- **WHEN** the share dialog is open and the visitor presses Escape
- **THEN** the dialog closes

#### Scenario: Localized dialog title

- **WHEN** the share dialog is opened in the Chinese locale
- **THEN** the dialog title is displayed in Chinese

### Requirement: Post pages remain statically generated

Adding the share affordance SHALL NOT change the static generation status of post detail pages; all share logic SHALL execute client-side after the dialog opens.

#### Scenario: Post detail pages stay SSG

- **WHEN** the production site is built
- **THEN** post detail pages are statically generated (no new dynamic rendering is introduced by the share feature)
