import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { hasLocale } from 'next-intl'
import { ImageResponse } from 'next/og'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { getAllPostSlugs, getPostBySlug } from '@/lib/posts'
import { siteConfig } from '@/lib/site-config'
import { getCategory } from '@/lib/taxonomy'

/** Alt text describing the generated social card. */
export const alt = 'Ruixe Blog social card'

/** OG image dimensions (1200×630 is the recommended size for social platforms). */
export const size = { width: 1200, height: 630 }

/** MIME type of the generated image. */
export const contentType = 'image/png'

/**
 * Pre-renders an OG image for every `{slug}.{lang}.mdx` post at build time.
 *
 * Mirrors the sibling `page.tsx` `generateStaticParams` so each post's social
 * card is statically generated rather than produced on-demand at request time.
 */
export function generateStaticParams() {
  return getAllPostSlugs().map(({ slug, lang }) => ({ lang, slug }))
}

// Load fonts once at module scope so repeated OG-image requests reuse the
// cached ArrayBuffers instead of re-reading from disk on every invocation.
const notoRegular = await readFile(join(process.cwd(), 'assets/NotoSansSC-Regular.subset.ttf'))
const notoBold = await readFile(join(process.cwd(), 'assets/NotoSansSC-Bold.subset.ttf'))
const geistSemiBold = await readFile(join(process.cwd(), 'assets/Geist-SemiBold.otf'))

/**
 * Formats a `YYYY-MM-DD` date string into a locale-friendly display date.
 *
 * @param dateStr - ISO date string from frontmatter (`publishedTime`).
 * @param locale - Target locale code.
 * @returns Human-readable date (e.g. `2026年7月21日` for zh, `July 21, 2026` for en).
 */
function formatDisplayDate(dateStr: string, locale: Locale): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * Generates a per-post Open Graph image at build time.
 *
 * Reads the post's frontmatter to render a 1200×630 PNG with the site name
 * (Geist SemiBold), the article title (Noto Sans SC Bold for Chinese), and the
 * category + publication date (Geist SemiBold with Noto Sans SC fallback).
 * Statically pre-rendered for every post via {@link generateStaticParams}.
 *
 * @param params - Promise resolving to `{ lang, slug }` route params.
 * @returns An `ImageResponse` rendering the social card PNG.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const locale = hasLocale(routing.locales, lang) ? lang : routing.defaultLocale

  const post = getPostBySlug(slug, locale)
  const categoryName = post ? getCategory(post.category, locale).name : ''
  const displayDate = post ? formatDisplayDate(post.publishedTime, locale) : ''
  const title = post?.title ?? 'Ruixe Blog'

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#0a0a0a',
        padding: '80px',
        fontFamily: 'GeistSemiBold, NotoSansSC',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: 36,
          color: '#a1a1aa',
          fontWeight: 600,
        }}
      >
        {siteConfig.siteTitle}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 72,
          fontWeight: 700,
          color: '#fafafa',
          lineHeight: 1.2,
          fontFamily: 'NotoSansSC, GeistSemiBold',
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 32,
          color: '#a1a1aa',
          fontWeight: 600,
        }}
      >
        {categoryName ? `${categoryName} · ${displayDate}` : displayDate}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'GeistSemiBold',
          data: geistSemiBold,
          style: 'normal',
          weight: 600,
        },
        {
          name: 'NotoSansSC',
          data: notoRegular,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'NotoSansSC',
          data: notoBold,
          style: 'normal',
          weight: 700,
        },
      ],
    },
  )
}
