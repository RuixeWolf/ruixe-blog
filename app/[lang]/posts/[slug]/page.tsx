import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PostLayout } from '@/components/posts/PostLayout'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { getAllPostSlugs, getPostBySlug } from '@/lib/posts'
import { extractToc } from '@/lib/toc'

/** Pre-render every `{slug}.{lang}.mdx` post at build time. */
export function generateStaticParams() {
  return getAllPostSlugs().map(({ slug, lang }) => ({ lang, slug }))
}

/** Unmatched dynamic segments return 404 instead of attempting on-demand rendering. */
export const dynamicParams = false

/**
 * Generates SEO metadata for the post detail page from frontmatter.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  if (!hasLocale(routing.locales, lang)) {
    return {}
  }

  const post = getPostBySlug(slug, lang as Locale)
  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  }
}

/**
 * Post detail page (`/[lang]/posts/[slug]`).
 *
 * Validates the locale and slug, loads the post metadata, extracts the TOC from
 * the markdown source, dynamically imports the MDX module, and renders
 * everything through `PostLayout`.
 */
export default async function PostDetailPage({
  params,
}: Readonly<{ params: Promise<{ lang: string; slug: string }> }>) {
  const { lang, slug } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const locale = lang as Locale
  setRequestLocale(locale)

  const post = getPostBySlug(slug, locale)
  if (!post) {
    notFound()
  }

  const toc = extractToc(post.content)

  // Dynamic import so Turbopack can code-split each MDX post. The template
  // string is required -- a static import would break per-post splitting.
  const { default: Post } = await import(`@/content/posts/${slug}.${locale}.mdx`)

  return (
    <PostLayout meta={post} toc={toc} locale={locale}>
      <Post />
    </PostLayout>
  )
}
