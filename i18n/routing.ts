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
  /**
   * Persist the user's locale choice in the `NEXT_LOCALE` cookie for one
   * year. Without `maxAge` the cookie is session-scoped, so the preference
   * was lost when the browser closed and `/` fell back to `Accept-Language`
   * detection. Applies to both cookie write paths: the middleware
   * (`Set-Cookie` on redirects) and client-side soft navigations from
   * `useLocaleSwitch` (`document.cookie` via next-intl's `syncLocaleCookie`).
   */
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
})

/** Convenience type alias for the supported locale codes. */
export type Locale = (typeof routing.locales)[number]
