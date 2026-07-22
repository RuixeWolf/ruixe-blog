import 'server-only'
import { Avatar, Card, Link } from '@heroui/react'
import { ExternalLink } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getGitHubUser } from '@/lib/github'
import { siteConfig } from '@/lib/site-config'

/**
 * GitHub profile card shown in the sidebar and mobile drawer.
 *
 * Fetches the owner's GitHub profile via `lib/github.ts` (ISR-cached for 1h)
 * and renders the avatar, username, bio and a link to the GitHub profile.
 * Degrades gracefully to the configured username when the API is unreachable.
 */
export async function ProfileCard() {
  const t = await getTranslations('Sidebar')
  const user = await getGitHubUser(siteConfig.githubUsername)

  const login = user?.login ?? siteConfig.githubUsername
  const name = user?.name ?? login
  const bio = user?.bio ?? ''
  const avatarUrl = user?.avatar_url ?? ''
  const githubUrl = user?.html_url ?? siteConfig.githubUrl
  const initials = login.slice(0, 2).toUpperCase()

  return (
    <Card className="w-full">
      <Card.Header className="flex-col items-center gap-3">
        <Avatar className="size-20" aria-label={`${login}'s avatar`}>
          {avatarUrl ? <Avatar.Image alt={`${login}'s avatar`} src={avatarUrl} /> : null}
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col items-center gap-1 text-center">
          <Card.Title>{name}</Card.Title>
          <span className="text-sm text-muted">@{login}</span>
        </div>
      </Card.Header>
      {bio ? (
        <Card.Content>
          <p className="text-sm text-pretty text-muted">{bio}</p>
        </Card.Content>
      ) : null}
      <Card.Footer>
        <Link
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('FollowOnGithub')}
          className="flex w-full items-center justify-center gap-1.5 rounded-medium bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          {t('FollowOnGithub')}
        </Link>
      </Card.Footer>
    </Card>
  )
}
