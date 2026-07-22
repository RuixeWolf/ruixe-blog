import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

/**
 * Locale-detection middleware (Next.js 16 renames `middleware.ts` to `proxy.ts`).
 *
 * Detects the preferred locale from the `Accept-Language` header and redirects
 * accordingly. Already-prefixed paths (e.g. `/en/posts/...`) are passed through
 * without a second redirect.
 */
export default createMiddleware(routing)

export const config = {
  // Match all pathnames except for:
  // - API and internal routes (`/api`, `/_next`, `/_vercel`)
  // - Pathnames containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
