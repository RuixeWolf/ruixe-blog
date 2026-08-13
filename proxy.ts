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
  //
  // The second entry lets next-intl middleware run locale detection
  // (cookie → Accept-Language → defaultLocale) on the root feed path and
  // 307 redirect to `/{locale}/feed.xml`, mirroring `/` → `/{locale}`. The
  // dot in `feed.xml` would otherwise exclude it from the regex matcher.
  //
  // NOTE: keep this as a plain string array — Prettier may rewrite regex
  // strings as `String.raw` tagged templates, which Next.js 16's static
  // analyzer rejects. Verify with `pnpm format-lint` after edits.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/feed.xml'],
}
