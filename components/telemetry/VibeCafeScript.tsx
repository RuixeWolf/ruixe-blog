'use client'

import { useEffect, useState } from 'react'

/** Props for `VibeCafeScript`, sourced from the `vibecafe` block of `content/site.yaml`. */
interface VibeCafeScriptProps {
  /** VibeCafé product ID (`data-vc-product-id`); empty/undefined disables telemetry. */
  productId?: string
  /** Web auth key (`data-vc-auth-key`); empty/undefined disables telemetry. */
  authKey?: string
}

/**
 * Whether the telemetry `<script>` has already been mounted once in this
 * browser session.
 *
 * Module-level (not state) so it survives client-side remounts of the root
 * layout. It is deliberately ONLY flipped inside `useEffect`, which never runs
 * on the server - so server renders always see `false` and keep emitting the
 * script in the SSR HTML for every request.
 */
let hasMountedTelemetryScript = false

/**
 * Renders the VibeCafé telemetry `<script>` in the shared document `<head>`
 * of every page (mounted once from the root layout).
 *
 * Renders nothing unless BOTH `productId` and `authKey` are configured in
 * `content/site.yaml` - clearing either field (or the whole `vibecafe` block)
 * disables telemetry with no code change. The auth key is an origin-whitelisted
 * browser integration identifier: public by design (it appears in the page
 * source) and used ONLY as a `data-` attribute here - never for management
 * APIs or in URL query parameters.
 *
 * **Remount semantics** (mirrors the `next-themes@0.4.6` patch pattern):
 * switching locale changes the root `[lang]` segment, which makes Next.js
 * remount the whole root-layout subtree. React 19.2 creates client-rendered
 * `<script>` elements as inert nodes (they never execute) and logs
 * "Encountered a script tag while rendering React component". This component
 * therefore renders the script only for SSR + the first hydration mount
 * (`hasMountedTelemetryScript` guard); remounts render `null`, and the already
 * executed vendor script keeps running from its initial page-load execution
 * (it tracks SPA navigations on its own).
 *
 * @param props - Telemetry identifiers; see `VibeCafeScriptProps`.
 * @returns The telemetry `<script>` element, or `null` when unconfigured or
 * on post-hydration remounts.
 */
export function VibeCafeScript({ productId, authKey }: Readonly<VibeCafeScriptProps>) {
  // Decided once per mount (lazy initializer): true only when configured AND
  // no earlier mount in this session already rendered the script. State (not a
  // render-time flag) so re-renders of the SAME instance keep the hydrated
  // `<script>` element in the DOM instead of unmounting it.
  const [shouldRender] = useState(() => Boolean(productId && authKey) && !hasMountedTelemetryScript)

  // Flip the module flag after the script element exists in the DOM, so any
  // later root-layout remount (locale switch) skips re-creating it.
  useEffect(() => {
    if (shouldRender) hasMountedTelemetryScript = true
  }, [shouldRender])

  if (!shouldRender) return null

  return (
    <script
      defer
      src="https://vibecafe.ai/telemetry/v1.js"
      data-vc-product-id={productId}
      data-vc-auth-key={authKey}
    />
  )
}
