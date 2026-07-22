import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Locale-aware navigation APIs.
 *
 * These wrap Next.js' navigation primitives so that the current locale is
 * automatically prepended to every internal path. Always prefer these over
 * the raw `next/link` and `next/navigation` equivalents.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
