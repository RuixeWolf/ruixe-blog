'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, SearchField } from '@heroui/react'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import { SearchResultItem } from '@/components/search/SearchResultItem'
import { useRouter } from '@/i18n/navigation'
import type { SearchIndexItem } from '@/lib/search'

/** Maximum number of results shown in the dropdown (no pagination). */
const MAX_RESULTS = 10

/**
 * Props for the search dialog.
 *
 * `searchIndex` is the pre-localized, current-locale search data inlined from
 * the server. `isOpen`/`onOpenChange` make the dialog a controlled component
 * driven by `SearchProvider`'s state.
 */
export interface SearchDialogProps {
  /** Pre-localized search index for the current locale. */
  searchIndex: SearchIndexItem[]
  /** Whether the dialog is currently open. */
  isOpen: boolean
  /** Callback invoked to request a visibility change. */
  onOpenChange: (open: boolean) => void
}

/**
 * Fuzzy search dialog built on HeroUI v3 `Modal` + Fuse.js.
 *
 * Holds a Fuse instance in `useMemo` (rebuilt only when `searchIndex` changes,
 * i.e. on locale switch) and runs debounced queries via `useDeferredValue`
 * (React Compiler friendly). The result list is a native `<ul role="listbox">`
 * of `<li role="option">` items; keyboard navigation cycles `activeIndex` with
 * ↑/↓, Enter opens the active post, and ESC clears the query first then closes
 * the dialog (design decision 10). Modal's own ESC handler is disabled
 * (`isKeyboardDismissDisabled`) so the custom ESC gradient takes over.
 *
 * The input is a HeroUI `SearchField` and is focused when the dialog opens
 * (manual focus in a `useEffect` since Modal's focus trap may not honor
 * `autoFocus` reliably - see design risk 4). Navigation uses the locale-aware
 * `useRouter` from `next-intl/navigation`.
 *
 * React Compiler notes: `activeIndex` is clamped via a derived value (not a
 * setState-in-effect); query/active state is reset via the "store previous
 * prop" pattern (setState during render when `isOpen` flips to false); the ESC
 * handler reads `query` through a ref kept in sync inside an effect so the
 * listener registers once per open (not on every keystroke).
 *
 * @param props - See {@link SearchDialogProps}.
 */
export function SearchDialog({ searchIndex, isOpen, onOpenChange }: Readonly<SearchDialogProps>) {
  const t = useTranslations('Search')
  const router = useRouter()

  const [query, setQuery] = useState('')
  const debouncedQuery = useDeferredValue(query)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  // Mirrors `query` so the ESC keydown listener (registered once per open) can
  // read the latest value without re-registering on every keystroke. Updated in
  // an effect, never during render (React Compiler `react-hooks/refs` rule).
  const queryRef = useRef(query)

  // Fuse instance is rebuilt only when the search index changes (locale switch).
  const fuse = useMemo(
    () =>
      new Fuse(searchIndex, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'description', weight: 0.25 },
          { name: 'tagNames', weight: 0.2 },
          { name: 'categoryName', weight: 0.1 },
          { name: 'contentText', weight: 0.05 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true,
      }),
    [searchIndex],
  )

  // Recompute results only when the index or debounced query changes.
  const results = useMemo(() => {
    if (debouncedQuery.trim() === '') return []
    return fuse.search(debouncedQuery).slice(0, MAX_RESULTS)
  }, [fuse, debouncedQuery])

  // Derive the effective active index so it never points past the result set.
  // This replaces a setState-in-effect clamp (React Compiler friendly).
  const safeActiveIndex = activeIndex < results.length ? activeIndex : -1

  // Reset query/active state when the dialog closes so it reopens fresh.
  // Uses the "store previous prop" pattern (setState during render) instead of
  // a setState-in-effect.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (!isOpen) {
      setQuery('')
      setActiveIndex(-1)
    }
  }

  // Keep queryRef in sync with query inside an effect (not during render).
  useEffect(() => {
    queryRef.current = query
  }, [query])

  // Focus the input when the dialog opens (Modal focus trap may bypass autoFocus).
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  /**
   * Closes the dialog and navigates to a post's detail page.
   *
   * The locale-aware router prepends the current locale automatically. Query and
   * active index are reset here for immediate correctness (the reset-on-close
   * render-time pattern also handles this, but doing it here avoids a flash of
   * stale state before navigation commits).
   */
  const navigateToPost = (item: SearchIndexItem) => {
    onOpenChange(false)
    setQuery('')
    setActiveIndex(-1)
    router.push(`/posts/${item.slug}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        if (results.length === 0) return
        setActiveIndex((prev) => (prev + 1) % results.length)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        if (results.length === 0) return
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (safeActiveIndex >= 0) {
          navigateToPost(results[safeActiveIndex].item)
        }
        break
      }
    }
  }

  // ESC handling via a document-level capture listener. HeroUI v3's Modal
  // (React Aria under the hood) intercepts ESC at the overlay level; routing
  // ESC through the input's `onKeyDown` alone caused the first press to be
  // swallowed by the overlay, so the dialog needed a second ESC to close.
  // Listening on `document` during the capture phase fires before the overlay's
  // own handler, giving us reliable clear-then-close behavior: the first ESC
  // clears a non-empty query, the next ESC closes the dialog.
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (queryRef.current !== '') {
        setQuery('')
      } else {
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [isOpen, onOpenChange])

  // Scroll the active option into view as the user navigates with the keyboard.
  useEffect(() => {
    if (safeActiveIndex < 0 || !listRef.current) return
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-index="${safeActiveIndex}"]`)
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [safeActiveIndex])

  const hasQuery = debouncedQuery.trim() !== ''
  const shouldShowResults = hasQuery && results.length > 0
  const shouldShowEmpty = hasQuery && results.length === 0

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} isKeyboardDismissDisabled>
      {/* `size="cover"` makes the dialog fill the viewport on mobile (full-screen
          search). On desktop the `sm:` overrides restore a compact, top-anchored
          panel: the container is capped at `2xl` width and the dialog drops the
          cover's `height`/`min-height: 100%` for auto height with a sensible max.
          `sm:min-h-0` is required because `sm:h-auto` alone leaves cover's
          `min-height: 100%` in force, which (against the full-height container)
          re-stretches the dialog to the full viewport. */}
      <Modal.Container placement="top" scroll="inside" size="cover" className="sm:max-w-2xl">
        <Modal.Dialog
          aria-label={t('DialogTitle')}
          className="sm:h-auto sm:max-h-[85vh] sm:min-h-0"
        >
          <Modal.Body className="gap-0 p-1">
            <SearchField
              aria-label={t('DialogTitle')}
              value={query}
              onChange={setQuery}
              onClear={() => setQuery('')}
              autoFocus
            >
              <SearchField.Group className="border-b border-default">
                <SearchField.SearchIcon />
                <SearchField.Input
                  ref={inputRef}
                  placeholder={t('Placeholder')}
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-controls="search-results-listbox"
                  aria-activedescendant={
                    safeActiveIndex >= 0 ? `search-result-${safeActiveIndex}` : undefined
                  }
                  aria-autocomplete="list"
                  onKeyDown={handleKeyDown}
                  className="w-full"
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            {shouldShowResults && (
              <ul
                ref={listRef}
                id="search-results-listbox"
                role="listbox"
                aria-label={t('DialogTitle')}
                className="mt-4"
              >
                {results.map((result, index) => (
                  <li
                    key={result.item.slug}
                    id={`search-result-${index}`}
                    role="option"
                    aria-selected={index === safeActiveIndex}
                    data-index={index}
                    className={
                      index === safeActiveIndex
                        ? 'cursor-pointer border-b border-default bg-default/50 last:border-b-0'
                        : 'cursor-pointer border-b border-default last:border-b-0'
                    }
                    onClick={() => navigateToPost(result.item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigateToPost(result.item)
                      }
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <SearchResultItem
                      item={result.item}
                      isActive={index === safeActiveIndex}
                      onClick={() => navigateToPost(result.item)}
                    />
                  </li>
                ))}
              </ul>
            )}

            {shouldShowEmpty && (
              <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
                <p className="font-medium text-foreground">{t('EmptyState')}</p>
                <p className="text-sm text-muted">{t('EmptyStateHint')}</p>
              </div>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
