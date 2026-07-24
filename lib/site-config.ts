import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

/** Absolute path to the site configuration file (committed to Git). */
const siteConfigPath = path.join(process.cwd(), 'content', 'site.yaml')

/** Raw shape of `content/site.yaml` - static site identifiers. */
interface SiteConfigRaw {
  /** GitHub login used by the profile card and external links. */
  githubUsername: string
  /** Site title shown in the header, mobile drawer, and browser tab metadata. */
  siteTitle: string
  /** Default site description for SEO metadata and Open Graph. */
  siteDescription: string
}

/** Resolved site configuration, including derived and environment-sourced fields. */
export interface SiteConfig extends SiteConfigRaw {
  /** Full GitHub profile URL, derived from `githubUsername`. */
  githubUrl: string
  /** Public site URL (from `NEXT_PUBLIC_SITE_URL`), used for SEO metadata and Open Graph. */
  siteUrl: string
}

/**
 * Validates that every required field is a non-empty string.
 *
 * @param raw - Parsed raw site configuration.
 * @throws When any required field is missing, non-string, or empty.
 */
function validateSiteConfig(raw: unknown): asserts raw is SiteConfigRaw {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Failed to parse ${siteConfigPath}: expected a YAML mapping at the top level`)
  }

  const candidate = raw as Record<string, unknown>
  const requiredKeys: (keyof SiteConfigRaw)[] = ['githubUsername', 'siteTitle', 'siteDescription']

  for (const key of requiredKeys) {
    const value = candidate[key]
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(
        `Invalid site config: field "${key}" in ${siteConfigPath} must be a non-empty string`,
      )
    }
  }
}

/**
 * Loads, parses, and validates `content/site.yaml`.
 *
 * @returns Resolved raw site configuration.
 * @throws When the file is missing, unparseable, or fails field validation.
 */
function loadSiteConfigRaw(): SiteConfigRaw {
  let raw: string
  try {
    raw = fs.readFileSync(siteConfigPath, 'utf8')
  } catch {
    throw new Error(`Site config not found: ${siteConfigPath} is missing`)
  }

  const parsed = YAML.parse(raw)
  validateSiteConfig(parsed)
  return parsed
}

/** Cached site configuration (loaded once per process lifetime). */
let cached: SiteConfig | null = null

/**
 * Loads site configuration, caching the result at module scope.
 *
 * @returns Fully resolved site configuration (raw fields + derived/env fields).
 */
function loadSiteConfig(): SiteConfig {
  if (cached) return cached

  const raw = loadSiteConfigRaw()
  cached = {
    ...raw,
    githubUrl: `https://github.com/${raw.githubUsername}`,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ruixe-blog.vercel.app',
  }
  return cached
}

/**
 * Central site-wide configuration.
 *
 * Eagerly loaded and validated at module evaluation time (fail-fast) from
 * `content/site.yaml`. `siteUrl` is sourced from the `NEXT_PUBLIC_SITE_URL`
 * environment variable because preview and production deployments may differ.
 */
export const siteConfig: SiteConfig = loadSiteConfig()
