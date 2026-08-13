import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

/**
 * Localized 404 page for `/[lang]/...` routes.
 *
 * Rendered when any route segment under `[lang]` calls `notFound()` (e.g. invalid
 * locale, non-existent post slug, unknown category/tag). Reuses the locale
 * layout chrome (Header, Sidebar) since Next.js renders the closest `not-found`
 * boundary within the already-mounted layout.
 *
 * Uses `useTranslations` (not `getTranslations`) following next-intl's official
 * not-found pattern: this is a non-async Server Component, and the not-found
 * boundary may render with an incomplete request context (e.g. when the locale
 * layout itself calls `notFound()` before `NextIntlClientProvider` mounts),
 * making the hook-based API - which reads from React Context - more robust than
 * the async `getTranslations` server API. `i18n/request.ts` falls back to the
 * default locale when `rootParams.lang()` is invalid, so messages are always
 * available.
 */
export default function NotFound() {
  const t = useTranslations('NotFound')

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">{t('Title')}</h1>
      <p className="text-muted">{t('Description')}</p>
      <Link
        href="/"
        className="rounded-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 transition-colors"
      >
        {t('BackHome')}
      </Link>
    </div>
  )
}
