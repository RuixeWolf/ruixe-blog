import 'server-only'
import { Accordion } from '@heroui/react'
import { ChevronDown } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import { Link as NavLink } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { PostMeta } from '@/lib/posts'
import { getCategory, getTag } from '@/lib/taxonomy'
import type { TocItem } from '@/lib/toc'
import { TableOfContents } from './TableOfContents'

/**
 * Layout wrapper for the post detail page.
 *
 * Renders the post metadata (title, publication/update dates, category, tags),
 * the MDX article body, and the table of contents. On desktop (`lg+`) the TOC
 * is a sticky sidebar on the right; on mobile (`<lg`) it collapses into an
 * `Accordion` between the metadata and the article body.
 *
 * @param meta - Post metadata parsed from frontmatter.
 * @param toc - TOC entries extracted from the post's markdown source.
 * @param locale - Active locale code for translations and taxonomy names.
 * @param children - The rendered MDX article body.
 */
export async function PostLayout({
  meta,
  toc,
  locale,
  children,
}: Readonly<{
  meta: PostMeta
  toc: TocItem[]
  locale: Locale
  children: React.ReactNode
}>) {
  const t = await getTranslations('PostDetail')
  const format = await getFormatter()

  const category = getCategory(meta.category, locale)
  const publishedDate = new Date(meta.publishedAt)
  const formattedPublished = format.dateTime(publishedDate, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedUpdated = meta.updatedAt
    ? format.dateTime(new Date(meta.updatedAt), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-pretty text-foreground">{meta.title}</h1>
        <p className="text-base text-muted">{meta.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>{t('PublishedAt', { date: formattedPublished })}</span>
          {formattedUpdated ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{t('UpdatedAt', { date: formattedUpdated })}</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <NavLink
            href={`/categories/${category.id}`}
            className="transition-colors hover:text-foreground"
          >
            {category.name}
          </NavLink>
        </div>
        {meta.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tagId) => {
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
      </header>

      {toc.length > 0 ? (
        <Accordion className="lg:hidden" hideSeparator>
          <Accordion.Item>
            <Accordion.Heading>
              <Accordion.Trigger>
                {t('TableOfContents')}
                <Accordion.Indicator>
                  <ChevronDown />
                </Accordion.Indicator>
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <ul className="flex flex-col gap-1">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={
                          item.level === 3
                            ? 'block pl-4 text-sm text-muted transition-colors hover:text-foreground'
                            : 'block text-sm text-muted transition-colors hover:text-foreground'
                        }
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      ) : null}

      <div className="flex gap-8">
        <article className="prose max-w-none dark:prose-invert min-w-0 flex-1">{children}</article>
        <div className="hidden w-56 shrink-0 lg:block">
          <TableOfContents items={toc} />
        </div>
      </div>
    </div>
  )
}
