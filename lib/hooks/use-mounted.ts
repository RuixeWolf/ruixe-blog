import { useSyncExternalStore } from 'react'

/** No-op subscribe for `useSyncExternalStore` (no external updates needed). */
const emptySubscribe = () => () => {}

/**
 * Returns `false` during SSR and initial hydration, `true` after client mount.
 *
 * Uses `useSyncExternalStore` instead of `useEffect` + `setState` to avoid
 * cascading renders flagged by the React Compiler lint rule. Use this to guard
 * client-only rendering (e.g. platform-specific UI like ⌘K vs Ctrl+K) so the
 * server markup matches the first client render and avoids hydration mismatch.
 *
 * @returns `false` on the server and during hydration, `true` after mount.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}
