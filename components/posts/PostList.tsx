import 'server-only'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import type { PostMeta } from '@/lib/posts'
import { PostCard } from './PostCard'

/**
 * Renders a list of post cards with an empty-state fallback.
 *
 * Maps each `PostMeta` entry to a `PostCard`. When the list is empty, displays
 * a localized empty-state message so the page layout doesn't collapse.
 *
 * @param posts - Array of post metadata to render.
 * @param locale - Active locale code passed through to each `PostCard`.
 */
export async function PostList({ posts, locale }: Readonly<{ posts: PostMeta[]; locale: Locale }>) {
  const t = await getTranslations('PostList')

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-lg font-medium text-foreground">{t('Empty')}</p>
        <p className="text-sm text-muted">{t('EmptyHint')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.map((post) => (
        <PostCard key={`${post.slug}-${post.lang}`} post={post} locale={locale} />
      ))}
    </div>
  )
}
