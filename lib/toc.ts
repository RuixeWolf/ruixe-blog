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
 * Lines inside fenced code blocks (``` or ~~~, including nested fences like
 * the `````markdown blocks used to quote markdown inside markdown) are
 * skipped, mirroring how remark parses the document.
 *
 * @param markdownContent - Raw markdown body (frontmatter already stripped).
 * @returns Ordered list of TOC entries.
 */
export function extractToc(markdownContent: string): TocItem[] {
  const items: TocItem[] = []
  const slugger = new GithubSlugger()
  const headingRegex = /^(#{2,3})\s+([^\n]+)/

  // Active fence marker (backtick or tilde) plus its minimum length; null
  // when not inside a fenced code block. A closing fence must use the same
  // character and be at least as long as the opening fence.
  let fenceChar: '`' | '~' | null = null
  let fenceLength = 0

  for (const line of markdownContent.split('\n')) {
    const fence = /^ {0,3}(`{3,}|~{3,})/.exec(line)

    if (fence) {
      const char = fence[1][0] as '`' | '~'
      const length = fence[1].length

      if (fenceChar === null) {
        fenceChar = char
        fenceLength = length
      } else if (char === fenceChar && length >= fenceLength) {
        fenceChar = null
        fenceLength = 0
      }
      // A fence line with the wrong char or too few markers is just content
      // inside the current code block -- keep scanning.
      continue
    }

    if (fenceChar !== null) {
      continue
    }

    const match = headingRegex.exec(line)
    if (match) {
      const level = match[1].length as 2 | 3
      const text = match[2].trim()
      items.push({
        level,
        text,
        id: slugger.slug(text),
      })
    }
  }

  return items
}
