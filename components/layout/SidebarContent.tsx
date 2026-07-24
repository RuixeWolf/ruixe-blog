import 'server-only'
import { Chip } from '@heroui/react'
import { getTranslations } from 'next-intl/server'
import { Link as NavLink } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getCategoryPostCounts } from '@/lib/posts'
import { getCategories, getTags } from '@/lib/taxonomy'
import { ProfileCard } from './ProfileCard'

/**
 * Shared sidebar content used by both the desktop sidebar and the mobile drawer.
 *
 * Renders the GitHub profile card, the category list and the tag cloud, all
 * localized for the given locale. Keeping this as a single server component
 * avoids duplicating the data-fetching and rendering logic.
 *
 * @param locale - Active locale code used for translations and taxonomy names.
 */
export async function SidebarContent({ locale }: Readonly<{ locale: Locale }>) {
  const t = await getTranslations('Sidebar')
  const categories = getCategories(locale)
  const counts = getCategoryPostCounts(locale)
  const tags = getTags(locale)

  return (
    <div className="flex flex-col gap-6 p-4">
      <ProfileCard />

      <nav aria-label={t('Categories')} className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">{t('Categories')}</h2>
        <ul className="flex flex-col gap-1">
          {categories.map((category) => (
            <li key={category.id}>
              <NavLink
                href={`/categories/${category.id}`}
                className="flex items-center justify-between text-sm text-muted transition-colors hover:text-foreground"
              >
                {category.name}
                <span className="tabular-nums">{counts[category.id] ?? 0}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label={t('Tags')} className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">{t('Tags')}</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <NavLink key={tag.id} href={`/tags/${tag.id}`}>
              <Chip
                size="sm"
                variant="soft"
                className="bg-surface px-2 py-0.5 transition-opacity hover:opacity-80"
              >
                {tag.name}
              </Chip>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
