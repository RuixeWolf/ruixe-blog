import 'server-only'
import { routing, type Locale } from '../i18n/routing'
import { buildFeedUrl } from './feed'
import { getAllPosts } from './posts'
import { buildPostMarkdownUrl } from './seo'
import { siteConfig } from './site-config'

/**
 * Localized H2 section headings for each supported locale in `llms.txt`.
 *
 * The heading uses the locale's own language so a human (or LLM) scanning the
 * file immediately knows which section lists posts in which language.
 */
const LLM_TXT_SECTION_HEADINGS: Record<Locale, string> = {
  zh: '中文文章',
  en: 'English Posts',
}

/**
 * Builds the `llms.txt` v2 index file for the site.
 *
 * Produces a Markdown document following the llms.txt v2 convention:
 *
 * 1. H1 title (`siteConfig.siteTitle`)
 * 2. Blockquote summary (`siteConfig.siteDescription`) plus a note about
 *    multilingual support and the `/index.md` Markdown URL convention
 * 3. One H2 section per supported locale, each listing the locale's posts as
 *    `- [{title}]({markdownUrl}): {description}` (markdown URLs built via
 *    {@link buildPostMarkdownUrl}, so only posts that actually exist in a
 *    locale appear under that locale's section)
 * 4. An `## Optional` section with the GitHub repository link and per-locale
 *    RSS feed links (via {@link buildFeedUrl})
 *
 * The file is language-neutral English (except post titles, which keep their
 * original language) because the primary audience is LLMs/agents.
 *
 * @returns The complete `llms.txt` file content as a Markdown string.
 */
export function buildLlmsTxt(): string {
  const sections = routing.locales.flatMap((locale) => {
    const items = getAllPosts(locale).map(
      (post) =>
        `- [${post.title}](${buildPostMarkdownUrl(post.slug, locale)}): ${post.description}`,
    )
    return [`## ${LLM_TXT_SECTION_HEADINGS[locale]}`, ...items, '']
  })

  const optionalItems = [
    `- [GitHub Repository](${siteConfig.githubUrl})`,
    ...routing.locales.map((locale) => `- [RSS Feed (${locale})](${buildFeedUrl(locale)})`),
  ]

  return [
    `# ${siteConfig.siteTitle}`,
    '',
    `> ${siteConfig.siteDescription} Posts are available in Chinese and English; ` +
      `append \`/index.md\` to any post URL to fetch its raw Markdown source.`,
    '',
    ...sections,
    '## Optional',
    ...optionalItems,
  ].join('\n')
}
