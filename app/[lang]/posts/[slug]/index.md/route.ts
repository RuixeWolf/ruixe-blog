import { notFound } from 'next/navigation'
import type { NextRequest } from 'next/server'
import type { Locale } from '@/i18n/routing'
import { getAllPostSlugs, getPostBySlug } from '@/lib/posts'

/**
 * Pre-renders a static Markdown file for every existing `{slug}.{lang}.mdx`
 * post at build time.
 *
 * Mirrors the post detail page's `generateStaticParams`, returning every
 * `{ lang, slug }` combination from {@link getAllPostSlugs} so Next.js emits
 * `/{locale}/posts/{slug}/index.md` as a static file (marked `○` in build
 * output) rather than rendering on demand.
 */
export function generateStaticParams() {
  return getAllPostSlugs().map(({ slug, lang }) => ({ lang, slug }))
}

/**
 * Disables on-demand generation for unknown slugs/locales.
 *
 * With `dynamicParams = false`, requests like
 * `/zh/posts/nonexistent/index.md` (no matching `.mdx` file) or
 * `/fr/posts/hello-world/index.md` (unsupported locale) hit the 404 boundary
 * instead of being dynamically rendered, matching the behavior of the post
 * detail page segment.
 */
export const dynamicParams = false

/**
 * Returns the post's raw Markdown body (frontmatter stripped) as a
 * `text/markdown` response.
 *
 * The `lang` and `slug` segments are validated by `generateStaticParams` +
 * `dynamicParams = false`, so only existing combinations reach this handler at
 * runtime. The body is {@link getPostBySlug}'s `content` field (the markdown
 * source after `gray-matter` strips the YAML frontmatter), served with
 * `text/markdown; charset=utf-8` so LLMs and Markdown viewers parse it
 * correctly.
 *
 * @param _request - The incoming HTTP request (unused; only the route context
 *   is needed to resolve the locale and slug).
 * @param context - Route context containing the awaited `lang` and `slug`
 *   params.
 * @returns A `Response` whose body is the post's raw Markdown content.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lang: string; slug: string }> },
): Promise<Response> {
  const { lang, slug } = await params
  const post = getPostBySlug(slug, lang as Locale)
  if (!post) {
    notFound()
  }

  return new Response(post.content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
