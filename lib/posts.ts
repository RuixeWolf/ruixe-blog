import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { routing, type Locale } from '../i18n/routing'

/** Absolute path to the directory containing MDX post files. */
const postsDirectory = path.join(process.cwd(), 'content', 'posts')

/** Per-locale cache of parsed post metadata, used only in production builds. */
const postsCache = new Map<Locale, PostMeta[]>()

/** Metadata for a single blog post, parsed from MDX frontmatter. */
export interface PostMeta {
  /** URL-safe identifier shared across all language variants of the same post. */
  slug: string
  /** Language code of this post variant (e.g. `'zh'`, `'en'`). */
  lang: Locale
  /** Post title from frontmatter. */
  title: string
  /** Short description from frontmatter, used in listings and SEO meta. */
  description: string
  /** Publication date in `YYYY-MM-DD` format. */
  publishedTime: string
  /** Optional last-updated date in `YYYY-MM-DD` format. */
  modifiedTime?: string
  /** Category ID referencing `categories.yaml`. */
  category: string
  /** Tag IDs referencing `tags.yaml`. */
  tags: string[]
  /** Raw markdown body (frontmatter stripped), used for TOC extraction. */
  content: string
}

/** Frontmatter fields that must be present on every post. */
const REQUIRED_FIELDS = ['title', 'description', 'publishedTime', 'category', 'tags'] as const

/**
 * Validates that a frontmatter object contains all required fields with correct types.
 *
 * @param data - Parsed frontmatter object from `gray-matter`.
 * @param filePath - File path used in the error message for easy debugging.
 * @throws When a required field is missing or `tags` is not an array.
 */
function validateFrontmatter(data: Record<string, unknown>, filePath: string): void {
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required frontmatter field "${field}" in ${filePath}`)
    }
  }

  if (!Array.isArray(data.tags)) {
    throw new TypeError(`Frontmatter field "tags" must be an array in ${filePath}`)
  }
}

/**
 * Retrieves a single post's metadata by slug and locale.
 *
 * Reads `{slug}.{lang}.mdx` from the content directory, parses its frontmatter
 * with `gray-matter`, and validates required fields. Returns `null` when the
 * file does not exist so callers can trigger `notFound()`.
 *
 * @param slug - URL-safe post identifier.
 * @param lang - Target locale code.
 * @returns Post metadata, or `null` if the file is not found.
 * @throws When frontmatter is missing required fields.
 */
export function getPostBySlug(slug: string, lang: Locale): PostMeta | null {
  const filePath = path.join(postsDirectory, `${slug}.${lang}.mdx`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  validateFrontmatter(data, filePath)

  return {
    slug,
    lang,
    title: String(data.title),
    description: String(data.description),
    publishedTime: String(data.publishedTime),
    modifiedTime: data.modifiedTime ? String(data.modifiedTime) : undefined,
    category: String(data.category),
    tags: data.tags as string[],
    content,
  }
}

/**
 * Retrieves all posts for the given locale, sorted newest-first.
 *
 * In production, the parsed list is cached per locale in a module-level `Map`
 * so the filesystem is scanned only once per locale during SSG builds; callers
 * receive the cached array reference and MUST NOT mutate it. In development,
 * caching is skipped so newly added or edited posts are visible immediately.
 *
 * @param lang - Target locale code.
 * @returns Array of post metadata sorted by `publishedTime` descending. In
 *   production this is a shared cached reference - do not mutate.
 */
export function getAllPosts(lang: Locale): PostMeta[] {
  if (process.env.NODE_ENV === 'production') {
    const cached = postsCache.get(lang)
    if (cached) {
      return cached
    }
  }

  const posts: PostMeta[] = []

  if (fs.existsSync(postsDirectory)) {
    const files = fs.readdirSync(postsDirectory)

    for (const file of files) {
      if (!file.endsWith(`.${lang}.mdx`)) continue

      const slug = file.replace(`.${lang}.mdx`, '')
      const post = getPostBySlug(slug, lang)
      if (post) {
        posts.push(post)
      }
    }
  }

  const sorted = posts.toSorted((a, b) => b.publishedTime.localeCompare(a.publishedTime))

  if (process.env.NODE_ENV === 'production') {
    postsCache.set(lang, sorted)
  }

  return sorted
}

/**
 * Aggregates post counts per category for the given locale.
 *
 * Iterates over `getAllPosts(lang)` and counts posts grouped by their
 * `category` field. Categories with no posts are omitted from the result;
 * callers should fall back to `0` via `counts[categoryId] ?? 0`.
 *
 * @param lang - Target locale code.
 * @returns Map of category ID to post count. Categories with zero posts are
 *   absent - use `?? 0` when reading.
 */
export function getCategoryPostCounts(lang: Locale): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const post of getAllPosts(lang)) {
    counts[post.category] = (counts[post.category] ?? 0) + 1
  }

  return counts
}

/**
 * Filters posts by category ID.
 *
 * @param categoryId - Category ID referencing `categories.yaml`.
 * @param lang - Target locale code.
 * @returns Matching posts sorted by `publishedTime` descending.
 */
export function getPostsByCategory(categoryId: string, lang: Locale): PostMeta[] {
  return getAllPosts(lang).filter((post) => post.category === categoryId)
}

/**
 * Filters posts by tag ID.
 *
 * @param tagId - Tag ID referencing `tags.yaml`.
 * @param lang - Target locale code.
 * @returns Matching posts sorted by `publishedTime` descending.
 */
export function getPostsByTag(tagId: string, lang: Locale): PostMeta[] {
  return getAllPosts(lang).filter((post) => post.tags.includes(tagId))
}

/**
 * Enumerates every `{ slug, lang }` pair in the content directory.
 *
 * Used by `generateStaticParams` in the post detail page so that every MDX
 * file is pre-rendered at build time. Unlike `getAllPosts`, this only scans
 * file names (no frontmatter parsing) and covers all locales in one call.
 *
 * @returns Array of `{ slug, lang }` objects for every `*.mdx` post file.
 */
export function getAllPostSlugs(): { slug: string; lang: Locale }[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const files = fs.readdirSync(postsDirectory)
  const result: { slug: string; lang: Locale }[] = []

  for (const file of files) {
    if (!file.endsWith('.mdx')) continue

    for (const locale of routing.locales) {
      const suffix = `.${locale}.mdx`
      if (file.endsWith(suffix)) {
        result.push({ slug: file.slice(0, -suffix.length), lang: locale })
        break
      }
    }
  }

  return result
}
