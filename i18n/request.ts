import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

/**
 * Request-scoring i18n configuration.
 *
 * Resolves the locale for the current request (typically from the `[lang]`
 * segment populated by the middleware) and loads the corresponding messages
 * JSON. Falls back to the default locale when the requested value is invalid
 * or missing.
 *
 * @param requestLocale - Locale resolved by next-intl middleware.
 * @returns The locale and its messages for the current request.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
