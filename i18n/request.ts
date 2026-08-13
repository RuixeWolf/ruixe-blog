import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import * as rootParams from 'next/root-params'
import { routing } from './routing'

/**
 * Request-scoped i18n configuration.
 *
 * Resolves the locale for the current request from the `[lang]` URL segment via
 * `next/root-params` (Next.js 16.3+) and loads the corresponding messages JSON.
 * Because `[lang]` is a root parameter (the root layout lives at
 * `app/[lang]/layout.tsx`), `rootParams.lang()` is available in every Server
 * Component without prop drilling and works with static rendering - no per-page
 * `setRequestLocale` calls are needed.
 *
 * Falls back to the default locale when the segment value is invalid or missing
 * (e.g. when the locale layout itself calls `notFound()` before the segment is
 * fully resolved), so `useTranslations` in `not-found.tsx` always has messages.
 *
 * @returns The locale and its messages for the current request.
 */
export default getRequestConfig(async () => {
  const requested = await rootParams.lang()
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
