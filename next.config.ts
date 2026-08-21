import type { NextConfig } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import createMDX from '@next/mdx'
import createNextIntlPlugin from 'next-intl/plugin'
import YAML from 'yaml'

/** Absolute path to the redirect registry (managed by `scripts/delete-post.mjs`). */
const redirectsPath = path.join(process.cwd(), 'content', 'redirects.yaml')

/** Shape of a single redirect record in `content/redirects.yaml`. */
interface RedirectRecord {
  /** Post slug whose old URL should redirect. */
  slug: string
  /** Deletion date in `YYYY-MM-DD` format (audit trail). */
  deletedAt: string
  /** Locales affected by the deletion; each expands to one redirect rule. */
  locales: string[]
  /** Optional custom destination; omitted falls back to `/{locale}/posts`. */
  destination?: string
}

/**
 * Reads the redirect registry and expands it into Next.js redirect rules.
 *
 * Each record's locales are expanded into individual 308 permanent redirect
 * rules (`/{locale}/posts/{slug}` -> destination). A `destination` containing
 * the `{lang}` placeholder has it replaced with the current locale; a missing
 * destination defaults to `/{locale}/posts`. Returns an empty array when the
 * file does not exist or fails to parse (with a warning).
 *
 * @returns Array of `{ source, destination, permanent }` redirect rules.
 */
function readRedirectRules() {
  if (!fs.existsSync(redirectsPath)) return []

  let parsed: unknown
  try {
    parsed = YAML.parse(fs.readFileSync(redirectsPath, 'utf8'))
  } catch (error) {
    console.warn(`Failed to parse ${redirectsPath}:`, error)
    return []
  }

  if (!Array.isArray(parsed)) return []

  const records = parsed as RedirectRecord[]
  const rules: { source: string; destination: string; permanent: true }[] = []

  for (const record of records) {
    for (const locale of record.locales) {
      const source = `/${locale}/posts/${record.slug}`
      const destination = record.destination
        ? record.destination.replaceAll('{lang}', locale)
        : `/${locale}/posts`
      rules.push({ source, destination, permanent: true })
    }
  }

  return rules
}

/** Base Next.js configuration shared by all wrappers. */
const nextConfig: NextConfig = {
  // Allow .md/.mdx files to be treated as pages and routes
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactCompiler: true,
  images: {
    // Cloudflare R2 media + placehold.co for dev placeholders
    remotePatterns: [
      { protocol: 'https', hostname: 'blog-assets.ruixe.net' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
    // Cap generated srcset widths. The post body container is ~690px on
    // desktop (see `add-media-hosting` design Decision 2) and full viewport
    // width on mobile (<1024px). Capping `deviceSizes` at 828 ensures
    // `next/image` only generates 640/750/828 entries, avoiding 1080-3840
    // entries that the browser would never select but would inflate the `src`
    // fallback and contradict the `media-hosting` spec's srcset-width
    // constraint (see design Decision 5).
    deviceSizes: [640, 750, 828],
    // Allow next/image to fetch from private/local IPs. A local network proxy
    // (e.g. Clash) routes external domains through fake private IPs
    // (198.18.x.x / fdfe:dcba:...), which Next.js 16's SSRF protection would
    // otherwise reject with 400 `upstream image ... resolved to private ip`.
    dangerouslyAllowLocalIP: true,
  },
  async redirects() {
    return readRedirectRules()
  },
  /**
   * Sets HTTP response headers for special routes.
   *
   * `/sw.js` receives three headers per Next.js PWA documentation
   * recommendations:
   *   - `Content-Type: application/javascript; charset=utf-8` ensures the
   *     browser parses the file as JS (some servers default to
   *     `text/plain` for extensionless/unknown types under `public/`).
   *   - `Cache-Control: no-cache, no-store, must-revalidate` ensures the
   *     browser always fetches the latest SW so updates propagate without the
   *     24-hour spec delay.
   *   - `Content-Security-Policy: default-src 'self'; script-src 'self'`
   *     hardens the SW against loading off-origin scripts.
   *
   * @returns Array of `{ source, headers }` route-header mappings.
   */
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ]
  },
}

/**
 * Absolute path to the CJK autolink terminator remark plugin.
 *
 * `@next/mdx` under Turbopack only accepts plugins as serializable string
 * specifiers, resolved against the compiled MDX file's directory - so a
 * relative path would resolve differently per file. An absolute path
 * (computed from `process.cwd()`, where `next dev/build` runs) resolves
 * identically for every MDX resource.
 */
const cjkAutolinkPluginPath = path.join(process.cwd(), 'plugins', 'remark-cjk-autolink.mjs')

/** MDX compilation wrapper with remark/rehype plugins (string names for Turbopack). */
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm', cjkAutolinkPluginPath, 'remark-frontmatter'],
    rehypePlugins: ['rehype-slug'],
  },
})

/** next-intl App Router support (request config + RSC integration). */
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// Order: innermost MDX (file-level) -> outermost next-intl (request-level)
export default withNextIntl(withMDX(nextConfig))
