import { defineRouting } from 'next-intl/routing'

/**
 * Central i18n routing configuration for the blog.
 *
 * Defines the supported locales and the default locale used when the
 * browser preference can't be matched. All `next-intl` navigation and
 * middleware APIs consume this single source of truth.
 */
export const routing = defineRouting({
  /** Supported locale codes, mirrored by the `[lang]` URL segment. */
  locales: ['zh', 'en'],
  /** Locale used when no match is found (e.g. unsupported Accept-Language). */
  defaultLocale: 'zh',
})

/** Convenience type alias for the supported locale codes. */
export type Locale = (typeof routing.locales)[number]
