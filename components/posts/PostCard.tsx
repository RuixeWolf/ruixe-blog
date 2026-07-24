import 'server-only'
import { Card, Chip } from '@heroui/react'
import { Calendar, Folder } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import { Link as NavLink } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { PostMeta } from '@/lib/posts'
import { getCategory, getTag } from '@/lib/taxonomy'

/**
 * A single post summary card used in post lists.
 *
 * The entire card is clickable via a "stretched link": the title link carries
 * an `::after` pseudo-element that spans the whole card surface, so clicking
 * anywhere navigates to the post detail page. Nested links (category and tags)
 * are lifted above the stretched layer with `relative z-10` so they remain
 * independently clickable and route to their own destinations.
 *
 * All taxonomy names are resolved to the active locale via `lib/taxonomy.ts`.
 * Uses the HeroUI v3 `Card` compound component for consistent styling.
 *
 * @param post - Post metadata parsed from frontmatter.
 * @param locale - Active locale code for translations and taxonomy names.
 */
export async function PostCard({ post, locale }: Readonly<{ post: PostMeta; locale: Locale }>) {
  const t = await getTranslations('PostList')
  const format = await getFormatter()

  const category = getCategory(post.category, locale)
  const publishedDate = new Date(post.publishedTime)
  const formattedDate = format.dateTime(publishedDate, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Card className="group isolation-isolate w-full transition-colors hover:bg-surface-hover">
      <Card.Header>
        <Card.Title>
          <NavLink
            href={`/posts/${post.slug}`}
            className="group-hover:text-primary text-xl font-bold text-foreground transition-colors after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </NavLink>
        </Card.Title>
        <Card.Description>{post.description}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <NavLink
            href={`/categories/${category.id}`}
            className="relative z-10 flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Folder className="size-4" aria-hidden="true" />
            {category.name}
          </NavLink>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" aria-hidden="true" />
            {t('PublishedTime', { date: formattedDate })}
          </span>
        </div>
        {post.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {post.tags.map((tagId) => {
              const tag = getTag(tagId, locale)
              return (
                <NavLink key={tagId} href={`/tags/${tag.id}`} className="relative z-10">
                  <Chip
                    size="sm"
                    variant="soft"
                    className="px-2 py-0.5 transition-opacity hover:opacity-80"
                  >
                    {tag.name}
                  </Chip>
                </NavLink>
              )
            })}
          </div>
        ) : null}
      </Card.Content>
    </Card>
  )
}
