import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { routing, type Locale } from '../i18n/routing'

/** Absolute path to the taxonomy directory. */
const taxonomyDirectory = path.join(process.cwd(), 'content', 'taxonomy')

/** A localized taxonomy entry (category or tag). */
export interface TaxonomyEntry {
  /** Unique identifier referenced by post frontmatter and URLs. */
  id: string
  /** Display name in the requested locale. */
  name: string
}

/** Raw shape of a taxonomy YAML entry: ID -> { name: { zh, en } }. */
type TaxonomyMap = Record<string, { name: Record<Locale, string> }>

/**
 * Loads and parses a taxonomy YAML file.
 *
 * @param fileName - File name within the taxonomy directory (e.g. `categories.yaml`).
 * @returns Parsed taxonomy map.
 * @throws When the file cannot be read or parsed.
 */
function loadTaxonomy(fileName: string): TaxonomyMap {
  const filePath = path.join(taxonomyDirectory, fileName)
  const raw = fs.readFileSync(filePath, 'utf8')
  return YAML.parse(raw) as TaxonomyMap
}

/** Cached taxonomy maps (loaded once per process lifetime). */
let categoriesCache: TaxonomyMap | null = null
let tagsCache: TaxonomyMap | null = null

/**
 * Validates that every taxonomy entry has translations for all supported locales.
 *
 * @param map - Parsed taxonomy map.
 * @param fileName - YAML file name, used in error messages.
 * @throws When a translation is missing for any supported locale.
 */
function validateTaxonomy(map: TaxonomyMap, fileName: string): void {
  for (const [id, entry] of Object.entries(map)) {
    for (const locale of routing.locales) {
      if (!entry.name?.[locale]) {
        throw new Error(`Taxonomy entry "${id}" is missing "${locale}" translation in ${fileName}`)
      }
    }
  }
}

/**
 * Loads and validates the categories map, caching the result.
 *
 * @returns Validated categories map.
 * @throws When any category ID is missing a translation for a supported locale.
 */
function getCategoriesMap(): TaxonomyMap {
  if (categoriesCache) return categoriesCache

  const map = loadTaxonomy('categories.yaml')
  validateTaxonomy(map, 'categories.yaml')
  categoriesCache = map
  return map
}

/**
 * Loads and validates the tags map, caching the result.
 *
 * @returns Validated tags map.
 * @throws When any tag ID is missing a translation for a supported locale.
 */
function getTagsMap(): TaxonomyMap {
  if (tagsCache) return tagsCache

  const map = loadTaxonomy('tags.yaml')
  validateTaxonomy(map, 'tags.yaml')
  tagsCache = map
  return map
}

/**
 * Retrieves all categories localized for the given locale.
 *
 * @param lang - Target locale code.
 * @returns Array of category entries (id + localized name).
 */
export function getCategories(lang: Locale): TaxonomyEntry[] {
  const map = getCategoriesMap()
  return Object.entries(map).map(([id, entry]) => ({ id, name: entry.name[lang] }))
}

/**
 * Retrieves a single category by ID.
 *
 * @param id - Category ID referencing `categories.yaml`.
 * @param lang - Target locale code.
 * @returns Localized category entry.
 * @throws When the category ID does not exist.
 */
export function getCategory(id: string, lang: Locale): TaxonomyEntry {
  const map = getCategoriesMap()
  const entry = map[id]
  if (!entry) {
    throw new Error(`Category "${id}" not found in categories.yaml`)
  }
  return { id, name: entry.name[lang] }
}

/**
 * Retrieves all tags localized for the given locale.
 *
 * @param lang - Target locale code.
 * @returns Array of tag entries (id + localized name).
 */
export function getTags(lang: Locale): TaxonomyEntry[] {
  const map = getTagsMap()
  return Object.entries(map).map(([id, entry]) => ({ id, name: entry.name[lang] }))
}

/**
 * Retrieves a single tag by ID.
 *
 * @param id - Tag ID referencing `tags.yaml`.
 * @param lang - Target locale code.
 * @returns Localized tag entry.
 * @throws When the tag ID does not exist.
 */
export function getTag(id: string, lang: Locale): TaxonomyEntry {
  const map = getTagsMap()
  const entry = map[id]
  if (!entry) {
    throw new Error(`Tag "${id}" not found in tags.yaml`)
  }
  return { id, name: entry.name[lang] }
}
