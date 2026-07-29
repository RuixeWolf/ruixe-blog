'use client'

import { Calendar, Folder } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { SearchIndexItem } from '@/lib/search'

/**
 * Props for a single search result list item.
 */
export interface SearchResultItemProps {
  /** Pre-localized post data to render (no taxonomy lookups on the client). */
  item: SearchIndexItem
  /** Whether this item is the keyboard-active option (drives the visual highlight). */
  isActive: boolean
  /** Click handler; the parent closes the dialog and navigates. */
  onClick: () => void
}

/**
 * Renders one search result inside the result listbox.
 *
 * Visual language mirrors `PostCard` (title + description + category/date meta
 * row + tag chips) but is more compact (smaller padding/font) to suit a dense
 * dropdown list. All taxonomy data is already localized server-side and arrives
 * via `item`, so this client component never imports `lib/taxonomy` or
 * `lib/posts`. The date is formatted client-side with `useFormatter` reusing
 * the `PostList.PublishedTime` message key for consistency with post lists.
 *
 * @param props - See {@link SearchResultItemProps}.
 */
export function SearchResultItem({ item, isActive, onClick }: Readonly<SearchResultItemProps>) {
  const t = useTranslations('PostList')
  const format = useFormatter()

  const publishedDate = new Date(item.publishedTime)
  const formattedDate = format.dateTime(publishedDate, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <button
      className={`flex w-full flex-col gap-1.5 px-4 py-2.5 text-left ${isActive ? 'border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
      onClick={onClick}
      type="button"
    >
      <span className="line-clamp-1 font-semibold text-foreground">{item.title}</span>
      {item.description ? (
        <span className="line-clamp-2 text-sm text-muted">{item.description}</span>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Folder className="size-3.5" aria-hidden="true" />
          {item.categoryName}
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <Calendar className="size-3.5" aria-hidden="true" />
          {t('PublishedTime', { date: formattedDate })}
        </span>
      </div>
      {item.tagNames.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {item.tagNames.map((tagName) => (
            <span key={tagName} className="text-xs text-muted">
              #{tagName}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  )
}
