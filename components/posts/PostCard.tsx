import 'server-only'
import { Card } from '@heroui/react'
import { Calendar } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import { Link as NavLink } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { PostMeta } from '@/lib/posts'
import { getCategory, getTag } from '@/lib/taxonomy'

/**
 * A single post summary card used in post lists.
 *
 * Renders the post title (linked to the detail page), description, publication
 * date, category name and tag chips. All taxonomy names are resolved to the
 * active locale via `lib/taxonomy.ts`. Uses the HeroUI v3 `Card` compound
 * component for consistent styling with the rest of the site.
 *
 * @param post - Post metadata parsed from frontmatter.
 * @param locale - Active locale code for translations and taxonomy names.
 */
export async function PostCard({ post, locale }: Readonly<{ post: PostMeta; locale: Locale }>) {
  const t = await getTranslations('PostList')
  const format = await getFormatter()

  const category = getCategory(post.category, locale)
  const publishedDate = new Date(post.publishedAt)
  const formattedDate = format.dateTime(publishedDate, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>
          <NavLink
            href={`/posts/${post.slug}`}
            className="text-xl font-bold text-foreground transition-colors hover:text-primary"
          >
            {post.title}
          </NavLink>
        </Card.Title>
        <Card.Description>{post.description}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" aria-hidden="true" />
            {t('PublishedAt', { date: formattedDate })}
          </span>
          <span aria-hidden="true">·</span>
          <NavLink
            href={`/categories/${category.id}`}
            className="transition-colors hover:text-foreground"
          >
            {category.name}
          </NavLink>
        </div>
        {post.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tagId) => {
              const tag = getTag(tagId, locale)
              return (
                <NavLink
                  key={tagId}
                  href={`/tags/${tag.id}`}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  {tag.name}
                </NavLink>
              )
            })}
          </div>
        ) : null}
      </Card.Content>
      <Card.Footer>
        <NavLink
          href={`/posts/${post.slug}`}
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {t('ReadMore')}
        </NavLink>
      </Card.Footer>
    </Card>
  )
}
