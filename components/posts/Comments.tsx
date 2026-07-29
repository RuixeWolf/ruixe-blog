'use client'

import { useEffect } from 'react'
import Giscus from '@giscus/react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import type { GiscusConfig } from '@/lib/site-config'

/** Maps blog locale codes to Giscus `lang` values (Giscus has no bare `zh`). */
const LOCALE_TO_LANG: Record<string, string> = {
  zh: 'zh-CN',
  en: 'en',
}

/** Maps `next-themes` resolved themes to Giscus built-in themes. */
const THEME_TO_GISCUS: Record<string, string> = {
  light: 'light',
  dark: 'dark_dimmed',
}

/** Origin of the Giscus iframe - the postMessage `targetOrigin`. */
const GISCUS_ORIGIN = 'https://giscus.app'

/**
 * Resolves a blog locale to a Giscus `lang` value, falling back to `en`.
 *
 * @param locale - Active blog locale code (`zh` or `en`).
 * @returns Giscus language code (e.g. `zh-CN`, `en`).
 */
function resolveLang(locale: string): string {
  return LOCALE_TO_LANG[locale] ?? 'en'
}

/**
 * Resolves a `next-themes` resolved theme to a Giscus theme, defaulting to
 * `light` when the theme is not yet ready (before hydration).
 *
 * @param resolvedTheme - The actual resolved theme (`light`/`dark`) or undefined.
 * @returns Giscus theme name.
 */
function resolveGiscusTheme(resolvedTheme: string | undefined): string {
  return (resolvedTheme && THEME_TO_GISCUS[resolvedTheme]) ?? 'light'
}

/**
 * Giscus-powered comments section rendered after the post body.
 *
 * Receives the Giscus configuration and active locale as props from the
 * server-rendered `PostLayout` (the `site-config` module is server-only, so the
 * config crosses the RSC->Client boundary via props rather than a direct
 * import). The `<Giscus>` iframe is lazy-loaded so it never blocks first paint.
 *
 * Theme sync: the `theme` prop only sets the initial iframe theme. On theme
 * changes a `postMessage({ giscus: { setConfig: { theme } } })` is sent to the
 * Giscus iframe, switching themes without reloading the iframe (preserving the
 * comment scroll position). The message is skipped while the iframe has not
 * loaded (`contentWindow` is null), in which case the iframe picks up the
 * current `resolvedTheme` when it mounts. The iframe is nested inside the
 * `<giscus-widget>` custom element's shadow DOM (`@giscus/react` v3), so the
 * selector pierces `shadowRoot` to reach it.
 *
 * Locale sync: the blog locale maps to a Giscus `lang` (`zh`->`zh-CN`,
 * `en`->`en`). A locale change re-renders the layout, updating `lang` and
 * reloading the iframe UI language - acceptable since locale switches are
 * page-level changes.
 *
 * @param config - Giscus configuration from `content/site.yaml`.
 * @param locale - Active blog locale code.
 */
export function Comments({ config, locale }: Readonly<{ config: GiscusConfig; locale: string }>) {
  const { resolvedTheme } = useTheme()
  const t = useTranslations('Comment')

  const lang = resolveLang(locale)
  const theme = resolveGiscusTheme(resolvedTheme)

  // Push theme changes to the already-loaded Giscus iframe via postMessage so
  // the iframe swaps themes in place instead of reloading (which would reset
  // scroll position). Skipped when the iframe is not yet mounted/lazy-loaded.
  // The iframe lives inside the `<giscus-widget>` shadow DOM (`@giscus/react`
  // v3 renders a custom element, not a bare iframe), so we pierce the shadow
  // root rather than querying the document.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const iframe = document
      .querySelector('giscus-widget')
      ?.shadowRoot?.querySelector<HTMLIFrameElement>('iframe')
    iframe?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, GISCUS_ORIGIN)
  }, [theme])

  return (
    <section aria-labelledby="comments-heading" className="flex flex-col gap-3">
      <h2 id="comments-heading" className="text-xl font-bold text-foreground">
        {t('Title')}
      </h2>
      <div className="prose max-w-none dark:prose-invert">
        <Giscus
          repo={config.repo as `${string}/${string}`}
          repoId={config.repoId}
          category={config.category}
          categoryId={config.categoryId}
          mapping={config.mapping as 'pathname'}
          reactionsEnabled={config.reactionsEnabled}
          inputPosition={config.inputPosition}
          strict={config.strict}
          emitMetadata={config.emitMetadata}
          theme={theme}
          lang={lang}
          loading="lazy"
        />
      </div>
      <p className="text-sm text-muted">{t('Loading')}</p>
    </section>
  )
}
