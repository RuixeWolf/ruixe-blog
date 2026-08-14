import { buildLlmsTxt } from '@/lib/llms-txt'

/**
 * Forces static rendering so the file is generated at build time.
 *
 * `GET` Route Handlers are dynamic by default in Next.js 15+. Since `llms.txt`
 * has no dynamic segments and its content is fully derived from committed
 * content files, `force-static` makes Next.js emit it as a static `○` file
 * (served from the CDN edge) rather than rendering on demand.
 */
export const dynamic = 'force-static'

/**
 * Returns the root `llms.txt` index file as a `text/markdown` response.
 *
 * `llms.txt` is a convention for LLM/agent content discovery (analogous to
 * `robots.txt`). The file is generated at build time by {@link buildLlmsTxt}
 * and served statically. Because the path contains a dot (`llms.txt`), the
 * `proxy.ts` matcher (`/((?!api|_next|_vercel|.*\\..*).*)`) excludes it, so
 * locale-detection middleware does not intercept or redirect the request.
 *
 * @returns A `Response` whose body is the `llms.txt` Markdown content.
 */
export async function GET(): Promise<Response> {
  const content = buildLlmsTxt()
  return new Response(content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
