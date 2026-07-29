import { createContext, useContext } from 'react'
import type { SearchIndexItem } from '@/lib/search'

/**
 * Shape of the search context exposed to consumer components.
 *
 * `isOpen` reflects whether the search dialog is currently shown. `setIsOpen`
 * toggles it (idempotent: calling `setIsOpen(true)` while already open is a
 * no-op, which lets the global ⌘K/Ctrl+K listener fire safely even when the
 * dialog is already open). `searchIndex` carries the pre-localized, current
 * locale's search data inlined from the server so client components never
 * import the server-only `lib/search` module.
 */
export interface SearchContextValue {
  /** Whether the search dialog is currently open. */
  isOpen: boolean
  /** Toggles dialog visibility; idempotent for `true`. */
  setIsOpen: (open: boolean) => void
  /** Pre-localized search index for the current locale. */
  searchIndex: SearchIndexItem[]
}

/**
 * React Context backing the search feature.
 *
 * Defaults to `null` so that {@link useSearch} can detect usage outside a
 * `SearchProvider` and throw a clear error rather than silently returning
 * undefined.
 */
export const SearchContext = createContext<SearchContextValue | null>(null)

/**
 * Consumes the search context.
 *
 * @returns The current search context value.
 * @throws When called outside a `SearchProvider` (context is `null`).
 */
export function useSearch(): SearchContextValue {
  const value = useContext(SearchContext)
  if (value === null) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return value
}
