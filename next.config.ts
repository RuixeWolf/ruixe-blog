import type { NextConfig } from 'next'
import createMDX from '@next/mdx'
import createNextIntlPlugin from 'next-intl/plugin'

/** Base Next.js configuration shared by all wrappers. */
const nextConfig: NextConfig = {
  // Allow .md/.mdx files to be treated as pages and routes
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactCompiler: true,
  images: {
    // Placeholder image service (phase 2 replaces with Cloudflare R2)
    remotePatterns: [{ protocol: 'https', hostname: 'placehold.co' }],
  },
}

/** MDX compilation wrapper with remark/rehype plugins (string names for Turbopack). */
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm', 'remark-frontmatter'],
    rehypePlugins: ['rehype-slug'],
  },
})

/** next-intl App Router support (request config + RSC integration). */
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// Order: innermost MDX (file-level) -> outermost next-intl (request-level)
export default withNextIntl(withMDX(nextConfig))
