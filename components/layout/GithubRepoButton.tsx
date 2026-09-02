import 'server-only'
import { Link } from '@heroui/react'
import { buttonVariants, type ButtonVariants } from '@heroui/styles'
import { getTranslations } from 'next-intl/server'
import { GithubMark } from '@/components/icons/GithubMark'
import { siteConfig } from '@/lib/site-config'

/** Button visual variant accepted by `buttonVariants`. */
type ButtonVariant = NonNullable<ButtonVariants['variant']>

/**
 * GitHub repository link for the header toolbar.
 *
 * Server Component - opens the blog's GitHub repository in a new tab. The
 * repository URL comes from `siteConfig.githubRepoUrl` (derived from the
 * `githubRepository` field in `content/site.yaml`), NOT `siteConfig.githubUrl`, which
 * points at the author's GitHub profile and is used by `NavLinks`. Rendered as
 * a native `<a>` (HeroUI `Link`) because the repository is an external URL and
 * client-side navigation does not apply. Styled with `buttonVariants` to match
 * the icon-only buttons in the same bar (e.g. `RssButton`). Uses the inline
 * `GithubMark` SVG because lucide-react v1.x removed brand icons.
 *
 * @param variant - Button visual variant; defaults to `tertiary`.
 */
export async function GithubRepoButton({
  variant = 'tertiary',
}: Readonly<{ variant?: ButtonVariant }>) {
  const t = await getTranslations('Header')

  return (
    <Link
      href={siteConfig.githubRepoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('Github')}
      className={buttonVariants({ variant, isIconOnly: true })}
    >
      <GithubMark className="size-5" />
    </Link>
  )
}
