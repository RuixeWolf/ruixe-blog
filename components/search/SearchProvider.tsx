'use client'

import { useEffect, useMemo, useState } from 'react'
import { SearchContext, type SearchContextValue } from '@/components/search/SearchContext'
import { SearchDialog } from '@/components/search/SearchDialog'
import type { SearchIndexItem } from '@/lib/search'

/**
 * Props for the search provider wrapper.
 */
export interface SearchProviderProps {
  /** Pre-localized search index for the current locale, inlined from the RSC. */
  searchIndex: SearchIndexItem[]
  /** Descendants that may consume `useSearch()` (Header, MobileHeader, etc.). */
  children: React.ReactNode
}

/**
 * Client-side provider that owns the search dialog state and ⌘K/Ctrl+K trigger.
 *
 * Holds `isOpen` in `useState` (stable `setIsOpen` reference) and registers a
 * single global `keydown` listener on mount. The listener calls
 * `setIsOpen(true)` when the user presses ⌘K (macOS) or Ctrl+K (elsewhere);
 * this is idempotent, so pressing the shortcut while the dialog is already
 * open is a safe no-op (design decision 7). The effect has an empty dependency
 * array because `setIsOpen` is a stable `useState` setter - the React Compiler
 * won't over-optimize it away.
 *
 * Renders exactly one `SearchDialog` instance (controlled by `isOpen`) so the
 * app never shows duplicate dialogs.
 *
 * @param props - See {@link SearchProviderProps}.
 */
export function SearchProvider({ searchIndex, children }: Readonly<SearchProviderProps>) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const value = useMemo<SearchContextValue>(
    () => ({ isOpen, setIsOpen, searchIndex }),
    [isOpen, searchIndex],
  )

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchDialog searchIndex={searchIndex} isOpen={isOpen} onOpenChange={setIsOpen} />
    </SearchContext.Provider>
  )
}
