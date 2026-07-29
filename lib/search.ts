import 'server-only'
import type { Locale } from '@/i18n/routing'
import { getAllPosts, type PostMeta } from '@/lib/posts'
import { getCategory, getTag } from '@/lib/taxonomy'

/**
 * A single post's searchable fields, pre-localized on the server.
 *
 * Built by {@link buildSearchIndex} and inlined into RSC props for the client
 * search components. Category/tag names are pre-localized so client components
 * never need to import the server-only taxonomy module. The raw markdown body
 * is NOT included - only the `stripMarkdown`-processed `contentText` - to keep
 * the RSC payload lean and remove markdown syntax noise from Fuse matching.
 */
export interface SearchIndexItem {
  /** URL-safe identifier shared across all language variants of the same post. */
  slug: string
  /** Post title from frontmatter. */
  title: string
  /** Short description from frontmatter. */
  description: string
  /** Post body with markdown syntax stripped, for full-text matching. */
  contentText: string
  /** Category display name localized for the target locale. */
  categoryName: string
  /** Tag display names localized for the target locale. */
  tagNames: string[]
  /** Publication date in `YYYY-MM-DD` format. */
  publishedTime: string
}

/**
 * Strips markdown syntax from a post body, returning plain searchable text.
 *
 * Applies a zero-dependency regex chain in a fixed order (block-level ->
 * inline -> marker symbols -> cleanup) so earlier steps don't leave artifacts
 * that later steps would mishandle. Frontmatter is already removed by
 * `gray-matter` before this runs, so the input is the bare body.
 *
 * @param content - Raw markdown body (frontmatter already stripped).
 * @returns Plain text with markdown syntax removed; whitespace collapsed.
 */
function stripMarkdown(content: string): string {
  return (
    content
      // 1. Fenced code blocks: ```lang ... ``` and ~~~ ... ~~~ (with content)
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      // 2. Inline code: `code`
      .replace(/`[^`]*`/g, ' ')
      // 3. Images: ![alt](url) -> removed (alt text is rarely useful for search)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      // 4. Links: [text](url) -> text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // 5. HTML tags: <...>
      .replace(/<[^>]+>/g, ' ')
      // 6. Heading/list/quote markers: #, -, *, >, and "1." list prefixes
      .replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
      .replace(/^\s{0,3}[-*+]\s+/gm, ' ')
      .replace(/^\s{0,3}>\s*/gm, ' ')
      .replace(/^\s{0,3}\d+\.\s+/gm, ' ')
      // 7. Emphasis markers: **bold**, *italic*, __bold__, _italic_
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // 8. Escaped characters: \x -> x
      .replace(/\\(.)/g, '$1')
      // 9. Collapse all whitespace runs into a single space
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * Builds the search index for the given locale from all published posts.
 *
 * Iterates over {@link getAllPosts} (which is production-cached per locale),
 * strips markdown from each post's body, and pre-localizes the category and
 * tag names via {@link getCategory}/{@link getTag}. The returned array reuses
 * `getAllPosts`'s module-level cache in production - this function adds no
 * caching of its own.
 *
 * @param lang - Target locale code.
 * @returns Search index items for every post in the locale, newest-first
 *   (inheriting `getAllPosts` sort order).
 */
export function buildSearchIndex(lang: Locale): SearchIndexItem[] {
  return getAllPosts(lang).map((post: PostMeta) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    contentText: stripMarkdown(post.content),
    categoryName: getCategory(post.category, lang).name,
    tagNames: post.tags.map((tagId) => getTag(tagId, lang).name),
    publishedTime: post.publishedTime,
  }))
}
