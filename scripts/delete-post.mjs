/**
 * Post deletion CLI for Ruixe Blog.
 *
 * Deletes all locale variants of an MDX post (`content/posts/{slug}.{locale}.mdx`),
 * appends a semantic redirect record to `content/redirects.yaml`, and prints
 * Giscus Discussion manual-lock guidance.
 *
 * Usage:
 *   pnpm delete-post <slug> [--force] [--dry-run] [--target <destination>]
 *
 * Zero external API calls; reuses the `yaml` package and Node builtins only.
 *
 * @module delete-post
 */

import fs from 'node:fs'
import path from 'node:path'
import process, { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
import YAML from 'yaml'

/** Absolute path to the project content directory. */
const contentDir = path.join(process.cwd(), 'content')

/** Absolute path to the posts directory. */
const postsDir = path.join(contentDir, 'posts')

/** Absolute path to the redirect registry (managed by this script). */
const redirectsPath = path.join(contentDir, 'redirects.yaml')

/** Absolute path to the site configuration file (source of `giscus.repo`). */
const siteConfigPath = path.join(contentDir, 'site.yaml')

/** Header prepended to every rewrite of `content/redirects.yaml`. */
const REDIRECTS_HEADER = `# This file is managed by \`scripts/delete-post.mjs\`.
# Do not manually edit entries - run \`pnpm delete-post <slug>\` instead.
`

/**
 * Parsed CLI arguments.
 *
 * @typedef {Object} CliArgs
 * @property {string|null} slug - Positional post slug, or `null` when omitted.
 * @property {boolean} force - Skip the interactive confirmation prompt.
 * @property {boolean} dryRun - Print the execution plan without writing changes.
 * @property {string|null} target - Custom redirect destination, or `null`.
 */

/**
 * Parses `process.argv` into structured CLI arguments.
 *
 * @returns {CliArgs} Parsed arguments.
 */
function parseArgs() {
  const argv = process.argv.slice(2)
  let slug = null
  let force = false
  let dryRun = false
  let target = null

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--force') {
      force = true
    } else if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--target') {
      target = argv[i + 1] ?? null
      if (target !== null) i++
    } else if (arg.startsWith('--target=')) {
      target = arg.slice('--target='.length)
    } else if (!arg.startsWith('--')) {
      slug = arg
    }
  }

  return { slug, force, dryRun, target }
}

/** Prints usage instructions to stderr. */
function printUsage() {
  process.stderr.write(
    [
      'Usage: pnpm delete-post <slug> [options]',
      '',
      'Deletes all locale variants of a post and registers a 308 redirect.',
      '',
      'Arguments:',
      '  slug                  Post slug (e.g. hello-world)',
      '',
      'Options:',
      '  --force               Skip the interactive y/N confirmation',
      '  --dry-run             Print the execution plan without writing changes',
      '  --target <destination>  Custom redirect destination (default: /{lang}/posts)',
      '                          Accepts internal paths (e.g. /{lang}/posts/other)',
      '                          or external URLs (e.g. https://example.com/moved)',
      '',
    ].join('\n'),
  )
}

/**
 * Validates a `--target` value.
 *
 * Accepts internal paths (starting with `/`, optionally containing `{lang}`)
 * or external URLs (starting with `http://` or `https://`). Rejects relative
 * paths and other formats.
 *
 * @param {string} target - Raw `--target` value.
 * @returns {string} The validated target value.
 * @throws When the value is neither an internal path nor an external URL.
 */
function validateTarget(target) {
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return target
  }
  if (target.startsWith('/')) {
    return target
  }
  throw new Error(
    `Invalid --target value "${target}": must be an internal path (starting with "/") ` +
      'or an external URL (starting with "http://" or "https://").',
  )
}

/**
 * Scans the posts directory for all locale variants of the given slug.
 *
 * Matches `{slug}.*.mdx` files and extracts the locale from the filename
 * (e.g. `hello-world.zh.mdx` -> `zh`). Locales are derived dynamically from
 * filenames so new locales require zero script changes.
 *
 * @param {string} slug - Post slug to scan for.
 * @returns {string[]} Sorted list of locales found on disk.
 */
function scanLocales(slug) {
  if (!fs.existsSync(postsDir)) return []

  const files = fs.readdirSync(postsDir)
  const prefix = `${slug}.`
  const suffix = '.mdx'

  const locales = files
    .filter((file) => file.startsWith(prefix) && file.endsWith(suffix))
    .map((file) => file.slice(prefix.length, file.length - suffix.length))

  return locales.sort()
}

/**
 * Extracts the title from an MDX file's YAML frontmatter.
 *
 * Reads the file and parses the YAML block between opening and closing `---`
 * delimiters. Returns `null` when the frontmatter is missing or malformed.
 *
 * @param {string} filePath - Absolute path to the MDX file.
 * @returns {string|null} The post title, or `null` when unavailable.
 */
function readPostTitle(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null

  try {
    const frontmatter = YAML.parse(match[1])
    if (frontmatter && typeof frontmatter.title === 'string') {
      return frontmatter.title
    }
  } catch {
    // Fall through to null for malformed frontmatter.
  }
  return null
}

/**
 * Reads the redirect registry as an array of records.
 *
 * Returns an empty array when the file does not exist. Throws on parse errors
 * so callers can surface them distinctly from "file not found".
 *
 * @returns {Array<Record<string, unknown>>} Parsed redirect records.
 */
function readRedirects() {
  if (!fs.existsSync(redirectsPath)) return []

  const raw = fs.readFileSync(redirectsPath, 'utf8')
  const parsed = YAML.parse(raw)
  if (parsed === null || parsed === undefined) return []
  if (!Array.isArray(parsed)) {
    throw new TypeError(`Expected ${redirectsPath} to contain a YAML array`)
  }
  return parsed
}

/**
 * Reads the GitHub repository full name (`owner/repo`) from site config.
 *
 * @returns {string|null} The repo string, or `null` when unavailable.
 */
function readGiscusRepo() {
  if (!fs.existsSync(siteConfigPath)) return null

  const raw = fs.readFileSync(siteConfigPath, 'utf8')
  try {
    const config = YAML.parse(raw)
    if (config?.giscus?.repo && typeof config.giscus.repo === 'string') {
      return config.giscus.repo
    }
  } catch {
    // Fall through to null for malformed site config.
  }
  return null
}

/**
 * Builds the new redirect record object for the deleted post.
 *
 * @param {string} slug - Post slug.
 * @param {string[]} locales - Locales affected by the deletion.
 * @param {string|null} target - Custom destination, or `null` for the default.
 * @returns {Object} The redirect record.
 */
function buildRecord(slug, locales, target) {
  const record = {
    slug,
    deletedAt: new Date().toISOString().slice(0, 10),
    locales,
  }
  if (target !== null) {
    record.destination = target
  }
  return record
}

/**
 * Renders the YAML block for a single redirect record (for recovery output).
 *
 * @param {Object} record - Redirect record.
 * @returns {string} YAML serialization of the record.
 */
function renderRecordYaml(record) {
  return YAML.stringify([record]).trimStart()
}

/**
 * Prints the Giscus manual-lock guidance to stdout.
 *
 * Includes the Discussions category URL, a slug search URL, and the
 * pathname + title for each affected locale. Does not call the GitHub API
 * and does not require `GITHUB_TOKEN`.
 *
 * @param {string} slug - Post slug.
 * @param {string[]} locales - Affected locales.
 * @param {Map<string, string|null>} titles - Locale to title map (may contain nulls).
 */
function printGiscusHints(slug, locales, titles) {
  const repo = readGiscusRepo()

  process.stdout.write('\n--- Giscus Discussion lock (manual) ---\n')

  if (repo) {
    const categoryUrl = `https://github.com/${repo}/discussions/categories/Comments`
    const searchUrl = `https://github.com/${repo}/discussions?discussions_q=${encodeURIComponent(slug)}`
    process.stdout.write(`Discussions category: ${categoryUrl}\n`)
    process.stdout.write(`Search by slug:       ${searchUrl}\n`)
  } else {
    process.stdout.write(
      'Could not read giscus.repo from content/site.yaml; skipping category/search URLs.\n',
    )
  }

  process.stdout.write('Affected discussions:\n')
  for (const locale of locales) {
    const pathname = `/${locale}/posts/${slug}`
    const title = titles.get(locale)
    const titleLabel = title ? `"${title}"` : '(title unavailable)'
    process.stdout.write(`  ${pathname}  ${titleLabel}\n`)
  }
  process.stdout.write('Lock each discussion in the GitHub UI to prevent new comments.\n')
}

/**
 * Prints the full execution plan without writing any changes.
 *
 * @param {string} slug - Post slug.
 * @param {string[]} locales - Affected locales.
 * @param {Object} record - Redirect record that would be appended.
 * @param {Map<string, string|null>} titles - Locale to title map.
 */
function printDryRunPlan(slug, locales, record, titles) {
  process.stdout.write('--- Dry-run execution plan ---\n')
  process.stdout.write('No files will be deleted and no registry will be written.\n\n')

  process.stdout.write('Files to delete:\n')
  for (const locale of locales) {
    const filePath = path.join(postsDir, `${slug}.${locale}.mdx`)
    process.stdout.write(`  ${filePath}\n`)
  }

  process.stdout.write('\nRedirect record to append to content/redirects.yaml:\n')
  process.stdout.write(renderRecordYaml(record))

  printGiscusHints(slug, locales, titles)
  process.stdout.write('\nDry-run complete. No changes were made.\n')
}

/**
 * Deletes all locale-variant MDX files for the given slug.
 *
 * Best-effort: if a deletion fails, the error is printed and the process exits
 * with a non-zero code; already-deleted files are not restored (Decision 8).
 *
 * @param {string} slug - Post slug.
 * @param {string[]} locales - Locales whose files should be deleted.
 */
function deletePostFiles(slug, locales) {
  for (const locale of locales) {
    const filePath = path.join(postsDir, `${slug}.${locale}.mdx`)
    try {
      fs.rmSync(filePath)
    } catch (error) {
      process.stderr.write(`Failed to delete ${filePath}: ${error.message}\n`)
      process.stderr.write('Already-deleted files were not restored.\n')
      process.exit(1)
    }
  }
}

/**
 * Appends a redirect record to `content/redirects.yaml`.
 *
 * Reads the existing array (or treats a missing file as empty), appends the
 * new record, and rewrites the file with the header comment. On write failure,
 * prints the YAML snippet for manual recovery and exits non-zero.
 *
 * @param {Object} record - Redirect record to append.
 */
function writeRedirects(record) {
  let existing
  try {
    existing = readRedirects()
  } catch (error) {
    process.stderr.write(`Failed to read existing redirects: ${error.message}\n`)
    process.stderr.write('Manual recovery YAML (append to content/redirects.yaml):\n')
    process.stderr.write(renderRecordYaml(record))
    process.exit(1)
  }

  const updated = [...existing, record]
  const body = YAML.stringify(updated)
  const content = REDIRECTS_HEADER + body

  try {
    fs.writeFileSync(redirectsPath, content, 'utf8')
  } catch (error) {
    process.stderr.write(`Failed to write ${redirectsPath}: ${error.message}\n`)
    process.stderr.write('Manual recovery YAML (append to content/redirects.yaml):\n')
    process.stderr.write(renderRecordYaml(record))
    process.exit(1)
  }
}

/**
 * Prompts the user for a y/N confirmation.
 *
 * @param {string} prompt - Confirmation prompt text.
 * @returns {Promise<boolean>} `true` when the user confirmed with `y` or `Y`.
 */
async function confirm(prompt) {
  const rl = readline.createInterface({ input, output })
  try {
    const answer = await rl.question(prompt)
    return answer.trim() === 'y' || answer.trim() === 'Y'
  } finally {
    rl.close()
  }
}

/**
 * Main entry point.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const { slug, force, dryRun, target } = parseArgs()

  if (!slug) {
    printUsage()
    process.exit(1)
  }

  let validatedTarget = null
  if (target !== null) {
    try {
      validatedTarget = validateTarget(target)
    } catch (error) {
      process.stderr.write(`${error.message}\n`)
      process.exit(1)
    }
  }

  const locales = scanLocales(slug)
  if (locales.length === 0) {
    process.stderr.write(`Post '${slug}' not found\n`)
    process.exit(1)
  }

  let existing
  try {
    existing = readRedirects()
  } catch (error) {
    process.stderr.write(`Failed to read ${redirectsPath}: ${error.message}\n`)
    process.exit(1)
  }

  const alreadyRegistered = existing.some((record) => record.slug === slug)
  if (alreadyRegistered) {
    process.stderr.write(`Redirect record for '${slug}' already exists\n`)
    process.exit(1)
  }

  // Cache titles before any deletion so Giscus hints stay accurate.
  /** @type {Map<string, string|null>} */
  const titles = new Map()
  for (const locale of locales) {
    const filePath = path.join(postsDir, `${slug}.${locale}.mdx`)
    titles.set(locale, readPostTitle(filePath))
  }

  const record = buildRecord(slug, locales, validatedTarget)

  if (dryRun) {
    printDryRunPlan(slug, locales, record, titles)
    process.exit(0)
  }

  if (!force) {
    const localesLabel = locales.join(', ')
    const ok = await confirm(`Delete '${slug}' (locales: ${localesLabel})? [y/N] `)
    if (!ok) {
      process.stdout.write('Operation cancelled.\n')
      process.exit(0)
    }
  }

  deletePostFiles(slug, locales)
  writeRedirects(record)
  printGiscusHints(slug, locales, titles)
  process.stdout.write(`\nDeleted post '${slug}' and registered redirect.\n`)
  process.exit(0)
}

await main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exit(1)
})
