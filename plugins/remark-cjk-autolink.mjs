/**
 * Remark plugin that terminates GFM autolink literals at CJK characters.
 *
 * `remark-gfm`'s autolink literal extension only ends a bare URL (`https://…`)
 * at whitespace or `<` (and trims trailing ASCII punctuation). CJK ideographs
 * and full-width punctuation (，。、）etc.) are neither, so a URL written
 * directly before Chinese text absorbs the text into the link until the next
 * space/newline - e.g. `https://example.com。正文继续` renders the whole
 * sentence as one underlined anchor with a corrupted `href`.
 *
 * This plugin runs after `remark-gfm` and splits such links at the first CJK
 * character: the link keeps the clean URL, and the absorbed text is re-emitted
 * as a plain text sibling node. Only autolink literals are touched (link node
 * whose single text child equals its `url`); explicit `[text](url)` links and
 * `<url>` autolinks are left untouched. To intentionally embed CJK characters
 * in a URL, authors should use an explicit markdown link.
 */

/**
 * Matches the first character that should terminate a bare URL autolink:
 * Hangul Jamo, CJK radicals/symbols/punctuation, kana, CJK ideographs,
 * Hangul syllables, CJK compatibility ideographs, full-width forms, and
 * curly quotes/ellipsis commonly adjacent to URLs in CJK prose.
 */
const CJK_TERMINATOR =
  /[\u1100-\u11FF\u2E80-\u9FFF\uA960-\uA97C\uAC00-\uD7A3\uF900-\uFAFF\uFF00-\uFFEF\u2018\u2019\u201C\u201D\u2026]/

/**
 * Splits one autolink-literal link at its first CJK terminator character.
 *
 * Only autolink literals are candidates (link node whose single text child
 * equals its `url`); explicit `[text](url)` links are left untouched.
 *
 * @param {import('mdast').Link} link - Candidate link node.
 * @returns {import('mdast').Text | null} Text node holding the absorbed
 *   trailing characters (to be re-emitted as a plain sibling), or `null`
 *   when no split occurred. Mutates `link` in place when splitting.
 */
function splitAutolinkAtCjk(link) {
  const text = link.children?.length === 1 ? link.children[0] : undefined

  // Autolink literal: the link text is the URL itself.
  if (text?.type !== 'text' || text.value !== link.url) return null

  const match = CJK_TERMINATOR.exec(link.url)
  if (!match || match.index === 0) return null

  const cleanUrl = link.url.slice(0, match.index)
  const absorbed = text.value.slice(match.index)

  link.url = cleanUrl
  text.value = cleanUrl
  return { type: 'text', value: absorbed }
}

/**
 * Splits autolink-literal links at their first CJK character.
 *
 * @param {import('mdast').Parent} node - Tree node whose children are scanned.
 * @returns {void} Mutates `node.children` in place when a split occurs.
 */
function terminateLinksAtCjk(node) {
  const children = node.children
  if (!Array.isArray(children)) return

  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    if (child.type === 'link') {
      const absorbed = splitAutolinkAtCjk(child)

      if (absorbed) {
        children.splice(i + 1, 0, absorbed)
        i++ // Skip the inserted text node.
      }
      continue
    }

    // Recurse into nested containers (blockquotes, list items, table cells…).
    terminateLinksAtCjk(child)
  }
}

/**
 * Remark plugin entry point.
 *
 * @returns {(tree: import('mdast').Root) => void} Unified transformer.
 */
export default function remarkCjkAutolink() {
  return (tree) => {
    terminateLinksAtCjk(tree)
  }
}
