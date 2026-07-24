import 'server-only'
import { getTranslations } from 'next-intl/server'
import type { TocItem } from '@/lib/toc'

/**
 * Desktop table-of-contents navigation for the post detail page.
 *
 * Renders a sticky `nav` listing h2/h3 headings as anchor links. Indentation
 * reflects the heading level (h3 is nested under h2). Hidden on mobile
 * (`hidden lg:block`) -- the mobile TOC is rendered as an `Accordion` by
 * `PostLayout`.
 *
 * @param items - TOC entries extracted from the post's markdown source.
 */
export async function TableOfContents({ items }: Readonly<{ items: TocItem[] }>) {
  const t = await getTranslations('PostDetail')

  if (items.length === 0) {
    return null
  }

  return (
    <nav
      aria-label={t('TableOfContents')}
      className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto lg:block"
    >
      <h2 className="mb-3 text-sm font-semibold text-foreground">{t('TableOfContents')}</h2>
      <ul className="flex flex-col gap-1 border-l border-default">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={
                item.level === 3
                  ? 'hover:border-primary block border-l-2 border-transparent pl-6 text-sm text-muted transition-colors hover:text-foreground'
                  : 'hover:border-primary block border-l-2 border-transparent pl-3 text-sm text-muted transition-colors hover:text-foreground'
              }
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
