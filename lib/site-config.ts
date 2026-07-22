/** GitHub username for the profile card and external links. */
const githubUsername = process.env.GITHUB_USERNAME ?? 'RuixeWolf'

/** Central site-wide configuration. */
export const siteConfig = {
  /** GitHub login used by the profile card (from `GITHUB_USERNAME` env var). */
  githubUsername,
  /** Full GitHub profile URL. */
  githubUrl: `https://github.com/${githubUsername}`,
  /** Public site URL, used for SEO metadata and Open Graph. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ruixe-blog.vercel.app',
  /** Site title shown in the header. */
  siteTitle: 'Ruixe Blog',
  /** Default site description for SEO. */
  siteDescription: 'A personal blog by Ruixe, sharing web development insights and project notes.',
} as const
