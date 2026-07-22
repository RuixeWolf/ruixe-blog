import GithubSlugger from 'github-slugger'

/** A single table-of-contents entry extracted from markdown headings. */
export interface TocItem {
  /** Heading level: `2` for h2, `3` for h3. */
  level: 2 | 3
  /** Original heading text from the markdown source. */
  text: string
  /** Anchor id matching the `rehype-slug` output for the same heading. */
  id: string
}

/**
 * Extracts a table of contents from markdown content.
 *
 * Scans for h2 and h3 headings (h1 is reserved for the post title) and
 * generates anchor ids using `github-slugger` -- the same library that
 * `rehype-slug` uses internally -- so TOC links match the rendered heading
 * ids exactly.
 *
 * @param markdownContent - Raw markdown body (frontmatter already stripped).
 * @returns Ordered list of TOC entries.
 */
export function extractToc(markdownContent: string): TocItem[] {
  const items: TocItem[] = []
  const slugger = new GithubSlugger()
  const headingRegex = /^(#{2,3})\s+([^\n]+)/gm

  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(markdownContent)) !== null) {
    const level = match[1].length as 2 | 3
    const text = match[2].trim()
    items.push({
      level,
      text,
      id: slugger.slug(text),
    })
  }

  return items
}
