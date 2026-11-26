import 'server-only'
import { Avatar } from '@heroui/react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import heroArt from '@/assets/ruixe-home-hero.webp'
import { Link } from '@/i18n/navigation'
import { getGitHubUser } from '@/lib/github'
import { siteConfig } from '@/lib/site-config'

/** Shared spacing and visible keyboard focus for the profile links. */
const profileLinkClass =
  'max-w-full rounded-md wrap-anywhere focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus'

/**
 * Renders the author's standalone homepage profile and contact links.
 *
 * @returns The localized introduction with the GitHub avatar or an initial.
 */
export async function HomeProfile() {
  const [t, nav, user] = await Promise.all([
    getTranslations('Profile'),
    getTranslations('Nav'),
    getGitHubUser(siteConfig.githubUsername),
  ])
  const { displayName, email } = siteConfig.profile
  const [initial] = displayName.trim()
  // Encode mailto delimiters that can occur in an otherwise valid local part.
  const emailHref = `mailto:${encodeURI(email).replace(/[&=#?]/g, encodeURIComponent)}`

  return (
    <section
      aria-labelledby="profile-name"
      className="relative isolate md:flex md:min-h-84 md:items-center lg:min-h-96"
    >
      <div
        aria-hidden="true"
        className="relative h-32 overflow-hidden rounded-2xl max-[360px]:h-24 sm:h-44 md:absolute md:inset-0 md:-z-10 md:h-auto"
      >
        <Image
          src={heroArt}
          alt=""
          fill
          unoptimized
          preload
          className="object-cover object-[82%_32%] md:object-[80%_center] dark:brightness-75"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent via-35% to-transparent md:bg-linear-to-r md:from-background/95 md:via-background/85 md:via-35% md:to-transparent md:to-65%" />
      </div>
      <div className="relative md:w-[54%] md:px-8 md:py-8 lg:px-12">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar
            aria-hidden="true"
            className="size-12 shrink-0 rounded-xl ring-1 ring-border sm:size-16"
          >
            {user?.avatar_url ? <Avatar.Image src={user.avatar_url} alt="" /> : null}
            <Avatar.Fallback className="bg-accent-soft text-xl font-semibold text-accent-soft-foreground">
              {initial.toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <h1
            id="profile-name"
            className="text-4xl font-bold tracking-tight wrap-anywhere text-foreground sm:text-5xl lg:text-6xl"
          >
            {displayName}
          </h1>
        </div>
        <p className="mt-3 text-xl font-medium text-foreground sm:text-2xl">{t('Role')}</p>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-pretty text-foreground/80">
          {t('Bio')}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-5">
          <Link
            href="/posts"
            className={`${profileLinkClass} inline-flex min-h-11 items-center gap-2 bg-foreground px-4 py-2 text-sm font-semibold text-background hover:underline`}
          >
            <span>{t('BrowseArticles')}</span>
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
          <Link
            href="/about"
            className={`${profileLinkClass} py-2 text-sm font-medium text-foreground underline-offset-4 hover:underline`}
          >
            {t('AboutMe')}
          </Link>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${profileLinkClass} inline-flex items-center gap-1.5 py-2 text-sm font-medium text-foreground underline-offset-4 hover:underline`}
          >
            <span>{nav('Github')}</span>
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <p className="font-medium text-foreground/80">{t('Contact')}</p>
          <a
            href={emailHref}
            className={`${profileLinkClass} font-medium text-foreground underline underline-offset-4`}
          >
            {email}
          </a>
        </div>
      </div>
    </section>
  )
}
