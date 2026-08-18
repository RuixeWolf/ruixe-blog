/**
 * Post validation CLI for Ruixe Blog.
 *
 * Validates MDX posts in `content/posts/` against the project's content
 * conventions: file naming, frontmatter schema, date formats, and taxonomy
 * references (categories/tags YAML). Missing locale variants are reported as
 * warnings (single-locale publishing is allowed), while schema/taxonomy
 * violations are errors.
 *
 * Usage:
 *   pnpm validate-post           Validate every post in content/posts/
 *   pnpm validate-post <slug>    Validate all locale variants of one post
 *
 * Exit code 0 = no errors (warnings allowed), 1 = validation errors found,
 * 2 = usage/IO error. Zero external calls beyond project dependencies
 * (`gray-matter`, `yaml`) and Node builtins.
 *
 * @module validate-post
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import matter from 'gray-matter'
import YAML from 'yaml'

/** Absolute path to the content directory. */
const contentDir = path.join(process.cwd(), 'content')

/** Absolute path to the posts directory. */
const postsDir = path.join(contentDir, 'posts')

/** Absolute path to the categories taxonomy file. */
const categoriesPath = path.join(contentDir, 'taxonomy', 'categories.yaml')

/** Absolute path to the tags taxonomy file. */
const tagsPath = path.join(contentDir, 'taxonomy', 'tags.yaml')

/**
 * Supported locale codes. Hardcoded snapshot of `i18n/routing.ts` because that
 * module is TypeScript and cannot be imported from a plain `.mjs` script.
 *
 * @type {string[]}
 */
const LOCALES = ['zh', 'en']

/** Frontmatter fields that must be present on every post. */
const REQUIRED_FIELDS = ['title', 'description', 'publishedTime', 'category', 'tags']

/** Pattern a post slug must match: lowercase kebab-case. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Pattern a frontmatter date must match: `YYYY-MM-DD`. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** File name pattern capturing slug and locale, e.g. `hello-world.zh.mdx`. */
const POST_FILE_PATTERN = /^(.+)\.([a-z]+)\.mdx$/

/**
 * Converts an arbitrary frontmatter value to a readable string for messages
 * and ID lookups, avoiding `[object Object]` output for object values.
 *
 * @param {unknown} value - Raw frontmatter value (YAML may yield Date objects).
 * @returns {string} Readable representation of the value.
 */
function toDisplayString(value) {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

/**
 * Collected validation findings for a single run.
 *
 * @typedef {Object} Findings
 * @property {string[]} errors - Violations that must be fixed before publishing.
 * @property {string[]} warnings - Non-blocking notices (e.g. missing locales).
 */

/**
 * Creates an empty findings collector.
 *
 * @returns {Findings} Fresh `Findings` object with empty lists.
 */
function createFindings() {
  return { errors: [], warnings: [] }
}

/**
 * Parses a taxonomy YAML file into a plain ID-keyed object.
 *
 * @param {string} filePath - Absolute path to the taxonomy YAML file.
 * @param {string} label - Human-readable label used in error messages.
 * @returns {Record<string, {name: Record<string, string>}>} Parsed entries.
 * @throws When the file is missing or not a mapping of IDs to entries.
 */
function loadTaxonomy(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label} file: ${filePath}`)
  }
  const parsed = YAML.parse(fs.readFileSync(filePath, 'utf8'))
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} file must be a YAML mapping of IDs to entries: ${filePath}`)
  }
  return parsed
}

/**
 * Checks that a taxonomy entry provides translations for every supported locale.
 *
 * @param {Record<string, {name?: Record<string, string>}>} taxonomy - Parsed taxonomy.
 * @param {string} label - Human-readable label for messages.
 * @param {Findings} findings - Collector to append warnings to.
 * @returns {void}
 */
function checkTaxonomyTranslations(taxonomy, label, findings) {
  for (const [id, entry] of Object.entries(taxonomy)) {
    const names = entry?.name
    if (names === null || typeof names !== 'object' || Array.isArray(names)) {
      findings.errors.push(`${label} "${id}" has no "name" translation map`)
      continue
    }
    for (const locale of LOCALES) {
      if (!names[locale]) {
        findings.errors.push(`${label} "${id}" is missing a "${locale}" translation`)
      }
    }
  }
}

/**
 * Validates a `YYYY-MM-DD` date string and returns it for ordering checks.
 *
 * @param {string} value - Raw frontmatter value.
 * @param {string} field - Field name used in messages.
 * @param {string} filePath - Post file path used in messages.
 * @param {Findings} findings - Collector to append errors to.
 * @returns {string|null} The validated date string, or `null` when invalid.
 */
function validateDate(value, field, filePath, findings) {
  const str = toDisplayString(value)
  if (!DATE_PATTERN.test(str)) {
    findings.errors.push(`${filePath}: field "${field}" must match YYYY-MM-DD, got "${str}"`)
    return null
  }
  return str
}

/**
 * Validates the frontmatter object of a single post file.
 *
 * Mirrors the runtime checks in `lib/posts.ts` (duplicated here because that
 * module is `server-only` and cannot be imported by scripts) and adds script-
 * level checks for date formats and ordering.
 *
 * @param {Record<string, unknown>} data - Parsed frontmatter from `gray-matter`.
 * @param {string} filePath - Post file path used in messages.
 * @param {Record<string, unknown>} categories - Parsed categories taxonomy.
 * @param {Record<string, unknown>} tags - Parsed tags taxonomy.
 * @param {Findings} findings - Collector to append errors/warnings to.
 * @returns {void}
 */
/**
 * Checks that every required frontmatter field is present and non-empty.
 *
 * @param {Record<string, unknown>} data - Parsed frontmatter from `gray-matter`.
 * @param {string} filePath - Post file path used in messages.
 * @param {Findings} findings - Collector to append errors to.
 * @returns {void}
 */
function checkRequiredFields(data, filePath, findings) {
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      findings.errors.push(`${filePath}: missing required frontmatter field "${field}"`)
    }
  }
}

/**
 * Checks that `publishedTime`/`modifiedTime` are well-formed and ordered.
 *
 * @param {Record<string, unknown>} data - Parsed frontmatter from `gray-matter`.
 * @param {string} filePath - Post file path used in messages.
 * @param {Findings} findings - Collector to append errors to.
 * @returns {void}
 */
function checkDateFields(data, filePath, findings) {
  const published = data.publishedTime
    ? validateDate(data.publishedTime, 'publishedTime', filePath, findings)
    : null
  if (data.modifiedTime === undefined || data.modifiedTime === null) return

  const modified = validateDate(data.modifiedTime, 'modifiedTime', filePath, findings)
  if (published && modified && modified < published) {
    findings.errors.push(
      `${filePath}: "modifiedTime" (${modified}) is before "publishedTime" (${published})`,
    )
  }
}

/**
 * Checks that the `category` frontmatter field references a known category ID.
 *
 * @param {Record<string, unknown>} data - Parsed frontmatter from `gray-matter`.
 * @param {string} filePath - Post file path used in messages.
 * @param {Record<string, unknown>} categories - Parsed categories taxonomy.
 * @param {Findings} findings - Collector to append errors to.
 * @returns {void}
 */
function checkCategoryRef(data, filePath, categories, findings) {
  if (data.category === undefined || data.category === null) return

  const category = toDisplayString(data.category)
  if (!(category in categories)) {
    findings.errors.push(`${filePath}: category "${category}" not found in categories.yaml`)
  }
}

/**
 * Checks that the `tags` frontmatter field is an array of known tag IDs.
 *
 * @param {Record<string, unknown>} data - Parsed frontmatter from `gray-matter`.
 * @param {string} filePath - Post file path used in messages.
 * @param {Record<string, unknown>} tags - Parsed tags taxonomy.
 * @param {Findings} findings - Collector to append errors to.
 * @returns {void}
 */
function checkTagRefs(data, filePath, tags, findings) {
  if (data.tags === undefined || data.tags === null) return
  if (!Array.isArray(data.tags)) {
    findings.errors.push(`${filePath}: frontmatter field "tags" must be an array`)
    return
  }

  for (const tag of data.tags) {
    const id = toDisplayString(tag)
    if (!(id in tags)) {
      findings.errors.push(`${filePath}: tag "$glm-5.3_common" not found in tags.yaml`)
    }
  }
}

/**
 * Validates the frontmatter object of a single post file.
 *
 * Mirrors the runtime checks in `lib/posts.ts` (duplicated here because that
 * module is `server-only` and cannot be imported by scripts) and adds script-
 * level checks for date formats and ordering.
 *
 * @param {Record<string, unknown>} data - Parsed frontmatter from `gray-matter`.
 * @param {string} filePath - Post file path used in messages.
 * @param {Record<string, unknown>} categories - Parsed categories taxonomy.
 * @param {Record<string, unknown>} tags - Parsed tags taxonomy.
 * @param {Findings} findings - Collector to append errors/warnings to.
 * @returns {void}
 */
function validateFrontmatter(data, filePath, categories, tags, findings) {
  checkRequiredFields(data, filePath, findings)
  checkDateFields(data, filePath, findings)
  checkCategoryRef(data, filePath, categories, findings)
  checkTagRefs(data, filePath, tags, findings)
}

/**
 * Validates one post file: file name shape, frontmatter, taxonomy references.
 *
 * @param {string} fileName - Base file name, e.g. `hello-world.zh.mdx`.
 * @param {Record<string, unknown>} categories - Parsed categories taxonomy.
 * @param {Record<string, unknown>} tags - Parsed tags taxonomy.
 * @param {Findings} findings - Collector to append errors/warnings to.
 * @returns {void}
 */
function validatePostFile(fileName, categories, tags, findings) {
  const filePath = path.join(postsDir, fileName)
  const match = POST_FILE_PATTERN.exec(fileName)
  if (!match) {
    findings.errors.push(`${fileName}: unexpected file name; expected pattern {slug}.{locale}.mdx`)
    return
  }
  const [, slug, locale] = match

  if (!SLUG_PATTERN.test(slug)) {
    findings.errors.push(`${fileName}: slug "${slug}" must be lowercase kebab-case`)
  }
  if (!LOCALES.includes(locale)) {
    findings.errors.push(
      `${fileName}: unknown locale "${locale}" (supported: ${LOCALES.join(', ')})`,
    )
    return
  }

  let parsed
  try {
    parsed = matter(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    findings.errors.push(`${fileName}: failed to parse frontmatter - ${error.message}`)
    return
  }
  validateFrontmatter(parsed.data, fileName, categories, tags, findings)
}

/**
 * Validates the locale completeness and date consistency of a slug group.
 *
 * @param {string} slug - Post slug shared by the group.
 * @param {Map<string, Record<string, unknown>>} variants - Locale to frontmatter map.
 * @param {Findings} findings - Collector to append warnings to.
 * @returns {void}
 */
function validateSlugGroup(slug, variants, findings) {
  for (const locale of LOCALES) {
    if (!variants.has(locale)) {
      findings.warnings.push(`post "${slug}" has no "${locale}" variant`)
    }
  }
  const publishedTimes = new Set()
  for (const data of variants.values()) {
    if (data.publishedTime !== undefined && data.publishedTime !== null) {
      publishedTimes.add(toDisplayString(data.publishedTime))
    }
  }
  if (publishedTimes.size > 1) {
    findings.warnings.push(
      `post "${slug}" has inconsistent publishedTime across locales: ${[...publishedTimes].join(', ')}`,
    )
  }
}

/**
 * Groups post file names by slug.
 *
 * @param {string[]} fileNames - Post file base names from `readdirSync`.
 * @returns {Map<string, string[]>} Slug to file names map.
 */
function groupBySlug(fileNames) {
  /** @type {Map<string, string[]>} */
  const groups = new Map()
  for (const fileName of fileNames) {
    const match = POST_FILE_PATTERN.exec(fileName)
    const key = match ? match[1] : fileName
    const list = groups.get(key) ?? []
    list.push(fileName)
    groups.set(key, list)
  }
  return groups
}

/**
 * Loads the frontmatter of one post file, returning an empty object on failure
 * (parse errors are already reported by `validatePostFile`).
 *
 * @param {string} fileName - Post file base name.
 * @returns {Record<string, unknown>} Parsed frontmatter data, or `{}`.
 */
function readFrontmatter(fileName) {
  try {
    return matter(fs.readFileSync(path.join(postsDir, fileName), 'utf8')).data
  } catch {
    return {}
  }
}

/**
 * Validates a subset of posts (one slug group, or the whole corpus).
 *
 * @param {string[]} fileNames - Post file base names in scope.
 * @param {Record<string, unknown>} categories - Parsed categories taxonomy.
 * @param {Record<string, unknown>} tags - Parsed tags taxonomy.
 * @param {Findings} findings - Collector to append errors/warnings to.
 * @returns {void}
 */
function validatePosts(fileNames, categories, tags, findings) {
  for (const fileName of fileNames) {
    validatePostFile(fileName, categories, tags, findings)
  }

  const groups = groupBySlug(fileNames)
  for (const [slug, names] of groups) {
    /** @type {Map<string, Record<string, unknown>>} */
    const variants = new Map()
    for (const name of names) {
      const match = POST_FILE_PATTERN.exec(name)
      if (match && LOCALES.includes(match[2])) {
        variants.set(match[2], readFrontmatter(name))
      }
    }
    validateSlugGroup(slug, variants, findings)
  }
}

/**
 * Parses `process.argv` into a slug filter.
 *
 * @returns {string|null} Positional slug argument, or `null` when omitted.
 */
function parseArgs() {
  const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  if (positional.length > 1) {
    return undefined
  }
  return positional[0] ?? null
}

/**
 * Prints usage instructions to stderr.
 *
 * @returns {void}
 */
function printUsage() {
  process.stderr.write(
    [
      'Usage: pnpm validate-post [slug]',
      '',
      'Validates post frontmatter, file naming, and taxonomy references.',
      'With no slug, validates every post in content/posts/.',
      '',
      'Exit codes: 0 = ok (warnings allowed), 1 = validation errors, 2 = usage error.',
      '',
    ].join('\n'),
  )
}

/**
 * Entry point: loads taxonomy, resolves the post scope, runs validation,
 * and prints a summary.
 *
 * @returns {number} Process exit code.
 */
function main() {
  const slug = parseArgs()
  if (slug === undefined) {
    printUsage()
    return 2
  }

  let categories
  let tags
  try {
    categories = loadTaxonomy(categoriesPath, 'categories.yaml')
    tags = loadTaxonomy(tagsPath, 'tags.yaml')
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 2
  }

  const findings = createFindings()
  checkTaxonomyTranslations(categories, 'Category', findings)
  checkTaxonomyTranslations(tags, 'Tag', findings)

  const allFiles = fs.existsSync(postsDir)
    ? fs.readdirSync(postsDir).filter((file) => file.endsWith('.mdx'))
    : []
  const scopedFiles = slug === null ? allFiles : allFiles.filter((f) => f.startsWith(`${slug}.`))

  if (slug !== null && scopedFiles.length === 0) {
    process.stderr.write(`No post files found for slug "${slug}" in ${postsDir}\n`)
    return 2
  }

  validatePosts(scopedFiles, categories, tags, findings)

  for (const warning of findings.warnings) {
    process.stdout.write(`Warning: ${warning}\n`)
  }
  for (const error of findings.errors) {
    process.stdout.write(`Error: ${error}\n`)
  }
  process.stdout.write(
    `Validated ${scopedFiles.length} file(s): ` +
      `${findings.errors.length} error(s), ${findings.warnings.length} warning(s)\n`,
  )
  return findings.errors.length > 0 ? 1 : 0
}

process.exit(main())
