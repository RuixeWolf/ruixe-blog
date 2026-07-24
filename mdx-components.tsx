import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'
import { CodeBlock } from '@/components/posts/CodeBlock'

/**
 * Determines whether a URL points to an external resource.
 *
 * @param href - The `href` attribute value to check.
 * @returns `true` when the URL starts with `http://` or `https://`.
 */
function isExternalUrl(href: string | undefined): boolean {
  return !!href && /^https?:\/\//i.test(href)
}

/**
 * Custom anchor that opens external links in a new tab with safe rel attributes.
 *
 * Internal links (including relative paths and hash anchors) render normally so
 * client-side navigation and in-page scrolling still work.
 */
function Anchor({
  href,
  children,
  ...rest
}: Readonly<React.AnchorHTMLAttributes<HTMLAnchorElement>>) {
  const external = isExternalUrl(href)

  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}

/**
 * MDX image component backed by `next/image`.
 *
 * Forces `width`/`height` to `100%`/`auto` so images scale responsively within
 * the prose container without requiring explicit dimensions in every MDX file.
 * Remote images must be whitelisted via `images.remotePatterns` in `next.config.ts`.
 */
function MDXImage({ alt, src, ...rest }: ImageProps) {
  return (
    <Image
      alt={alt}
      src={src}
      width={0}
      height={0}
      sizes="100vw"
      style={{ width: '100%', height: 'auto' }}
      {...rest}
    />
  )
}

/**
 * Global MDX component mapping consumed by `@next/mdx`.
 *
 * - `img` -> `next/image` for automatic optimization and responsive sizing
 * - `a` -> external links open in a new tab with `rel="noopener noreferrer"`
 * - `pre` -> `CodeBlock` client component (theme-aware `bg-surface-tertiary`
 *   background + copy-to-clipboard button)
 * - `code` -> inline code highlighted with `bg-muted`; block code (inside `pre`,
 *   detected via `language-xxx` className) is transparent so the `CodeBlock`
 *   background shows through
 *
 * All remaining HTML elements use their default tags; prose typography is
 * applied at the page level via the `prose` class.
 *
 * @param components - Existing components provided by the MDX consumer.
 * @returns The components map to use when rendering MDX content.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    img: MDXImage,
    a: Anchor,
    pre: ({ children, ...rest }: React.HTMLAttributes<HTMLPreElement>) => (
      <CodeBlock {...rest}>{children}</CodeBlock>
    ),
    code: ({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) => {
      const isBlockCode = typeof className === 'string' && className.startsWith('language-')
      // Block <code> lives inside <pre>; preserve the language-xxx class for
      // future syntax highlighting and let the CodeBlock background show through.
      if (isBlockCode) {
        return (
          <code className={className} {...rest}>
            {children}
          </code>
        )
      }
      // Inline <code>: highlighted background for inline code references.
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...rest}>
          {children}
        </code>
      )
    },
  }
}
