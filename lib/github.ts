import 'server-only'

/** GitHub user data used by the profile card. */
export interface GitHubUser {
  /** GitHub login (username). */
  login: string
  /** Display name, may be null. */
  name: string | null
  /** Avatar URL. */
  avatar_url: string
  /** Bio text, may be null. */
  bio: string | null
  /** Profile URL on github.com. */
  html_url: string
  /** Personal website/blog URL, may be null or empty. */
  blog: string | null
  /** Geographic location, may be null. */
  location: string | null
  /** Company, may be null. */
  company: string | null
  /** Follower count. */
  followers: number
  /** Following count. */
  following: number
  /** Public repository count. */
  public_repos: number
}

/**
 * Fetches a GitHub user's profile data via the REST API.
 *
 * Uses Next.js ISR with a 1-hour revalidation window to stay within the
 * unauthenticated rate limit (60 requests/hour per IP). Returns `null` on
 * any error so callers can gracefully degrade to a static profile card.
 *
 * @param username - GitHub login to look up.
 * @returns GitHub user data, or `null` if the request fails.
 */
export async function getGitHubUser(username: string): Promise<GitHubUser | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'ruixe-blog',
        Accept: 'application/vnd.github+json',
      },
    })

    if (!res.ok) {
      return null
    }

    return (await res.json()) as GitHubUser
  } catch {
    return null
  }
}
