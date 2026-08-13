import type { NextRequest } from 'next/server'
import { routing, type Locale } from '@/i18n/routing'
import { buildRssFeed } from '@/lib/feed'

/**
 * Pre-renders a static RSS feed for every supported locale at build time.
 *
 * Returns one `{ lang }` entry per locale in {@link routing.locales} so that
 * Next.js emits `/zh/feed.xml` and `/en/feed.xml` as static files (marked `○`
 * in the build output) rather than rendering them dynamically at request time.
 */
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

/**
 * Disables on-demand generation for unknown locales.
 *
 * With `dynamicParams = false`, requests like `/fr/feed.xml` (where `fr` is not
 * a supported locale) hit the 404 boundary instead of being dynamically
 * rendered, matching the behavior of other `[lang]` segments.
 */
export const dynamicParams = false

/**
 * Returns the RSS 2.0 feed for the requested locale as an XML response.
 *
 * The `lang` segment is validated by `generateStaticParams` +
 * `dynamicParams = false`, so only supported locales reach this handler at
 * runtime. The response uses `application/xml; charset=utf-8` so RSS readers
 * parse it correctly.
 *
 * @param _request - The incoming HTTP request (unused; only the route context
 *   is needed to resolve the locale).
 * @param context - Route context containing the awaited `lang` param.
 * @returns A `Response` whose body is the RSS 2.0 XML string.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lang: string }> },
): Promise<Response> {
  const { lang } = await params
  const xml = buildRssFeed(lang as Locale)
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
