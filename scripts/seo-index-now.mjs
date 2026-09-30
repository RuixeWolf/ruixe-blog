/**
 * IndexNow submission CLI for Ruixe Blog.
 *
 * Fetches the live production sitemap.xml, extracts every `<loc>` URL, and
 * submits them in one batch JSON POST to the IndexNow API, so Bing-powered
 * search engines (Bing, ChatGPT Search, Copilot) pick up new posts in
 * minutes instead of waiting for the next crawler visit.
 *
 * Usage:
 *   pnpm seo-index-now [--sitemap <url>]
 *
 * The sitemap URL defaults to `https://blog.ruixe.net/sitemap.xml` and can be
 * overridden with `--sitemap` or the `SITEMAP_URL` environment variable — but
 * the host MUST be the production domain `blog.ruixe.net`; anything else
 * (preview deployments, localhost) is rejected before any request is sent.
 * The URL list is read from the live sitemap (the exact document crawlers
 * see), never rebuilt from local `content/` — `lib/` modules are `server-only`
 * and local content may be out of sync with the deployment.
 *
 * The key is the `public/<32-hex>.txt` filename (same public-token shape as
 * the Google Search Console verification file); the file content must equal
 * the key so IndexNow can validate ownership at `<siteUrl>/<key>.txt`.
 *
 * Before submitting, the script fetches the deployed key file and requires
 * it to return 200 with the key as its body. IndexNow rejects (403) a
 * submission sent while the file is not yet reachable, and that failure can
 * stick to the host/key as a cached negative verification that outlives the
 * deployment — so a submission is only ever sent once the file is confirmed
 * live.
 *
 * Zero dependencies beyond Node builtins (`fetch` requires Node 18+).
 *
 * @module seo-index-now
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/** Only host this script is ever allowed to submit for. */
const PRODUCTION_HOST = 'blog.ruixe.net'

/** IndexNow batch JSON endpoint. */
const SEO_INDEX_NOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/** Default live sitemap to read the URL list from. */
const DEFAULT_SITEMAP_URL = `https://${PRODUCTION_HOST}/sitemap.xml`

/** Absolute path to the directory containing the key file. */
const publicDir = path.join(process.cwd(), 'public')

/** Shape of a hex IndexNow key file name: exactly 32 lowercase hex chars. */
const KEY_FILE_PATTERN = /^[0-9a-f]{32}\.txt$/

/**
 * Parsed CLI arguments.
 *
 * @typedef {Object} CliArgs
 * @property {string|null} sitemap - Sitemap URL override, or `null`.
 */

/**
 * Parses `process.argv` into structured CLI arguments.
 *
 * @returns {CliArgs} Parsed arguments.
 */
function parseArgs() {
  const argv = process.argv.slice(2)
  let sitemap = null

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--sitemap') {
      sitemap = argv[i + 1] ?? null
      if (sitemap !== null) i++
    } else if (arg.startsWith('--sitemap=')) {
      sitemap = arg.slice('--sitemap='.length)
    }
  }

  return { sitemap }
}

/**
 * Resolves the sitemap target URL (CLI flag > `SITEMAP_URL` env > default).
 *
 * @param {string|null} cliSitemap - `--sitemap` value, or `null`.
 * @returns {string} The sitemap URL to fetch.
 */
function resolveSitemapUrl(cliSitemap) {
  return cliSitemap ?? process.env.SITEMAP_URL ?? DEFAULT_SITEMAP_URL
}

/**
 * Finds the IndexNow key file under `public/`.
 *
 * The key file is the single `*.txt` file whose base name is a 32-char hex
 * token. Its content must equal the token (the file body is what IndexNow
 * fetches to verify ownership).
 *
 * @returns {string} The 32-hex key.
 * @throws When no matching file exists, when multiple exist, or when the
 *   file content does not equal its name.
 */
function findKey() {
  const candidates = fs.existsSync(publicDir)
    ? fs.readdirSync(publicDir).filter((file) => KEY_FILE_PATTERN.test(file))
    : []

  if (candidates.length === 0) {
    throw new Error(
      `No IndexNow key file found in ${publicDir}: expected a single "<32-hex>.txt" file ` +
        '(see openspec change seo-index-infrastructure, task 3.1).',
    )
  }
  if (candidates.length > 1) {
    throw new Error(
      `Multiple IndexNow key files found in ${publicDir}: ${candidates.join(', ')}. ` +
        'Keep exactly one.',
    )
  }

  const key = candidates[0].slice(0, -'.txt'.length)
  const body = fs.readFileSync(path.join(publicDir, candidates[0]), 'utf8').trim()
  if (body !== key) {
    throw new Error(
      `IndexNow key file content mismatch for ${candidates[0]}: the file body must be ` +
        'the key itself.',
    )
  }

  return key
}

/**
 * Verifies the deployed key file before any submission is sent.
 *
 * IndexNow validates ownership by fetching `<keyLocation>`. Submitting while
 * the file is not yet reachable (e.g. mid-deployment) returns 403 and can
 * leave a cached verification failure on the IndexNow side for the host/key,
 * so this preflight replaces that remote failure with a local, actionable
 * error and guarantees the file is live when the POST is finally sent.
 *
 * @param {string} key - The IndexNow key.
 * @returns {Promise<void>}
 * @throws When the key file cannot be fetched or its body does not equal the key.
 */
async function verifyKeyFile(key) {
  const keyUrl = `https://${PRODUCTION_HOST}/${key}.txt`

  let response
  try {
    response = await fetch(keyUrl)
  } catch (error) {
    throw new Error(
      `IndexNow key file could not be fetched (${error.message}): ${keyUrl}\n` +
        'No request was sent. Deploy the key file before running this script.',
    )
  }

  if (!response.ok) {
    const status = response.statusText
      ? `${response.status} ${response.statusText}`
      : `HTTP ${response.status}`
    throw new Error(
      `IndexNow key file returned ${status}: ${keyUrl}\n` +
        'No request was sent. Deploy the key file before running this script.',
    )
  }

  const body = (await response.text()).trim()
  if (body !== key) {
    throw new Error(
      `IndexNow key file content mismatch at ${keyUrl}: the file body must be the ` +
        'key itself.\nNo request was sent.',
    )
  }
}

/**
 * Fetches the sitemap document.
 *
 * @param {string} sitemapUrl - Absolute sitemap URL.
 * @returns {Promise<string>} The raw XML text.
 * @throws When the fetch fails or returns a non-2xx status.
 */
async function fetchSitemap(sitemapUrl) {
  const response = await fetch(sitemapUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch sitemap (${response.status} ${response.statusText}): ${sitemapUrl}`,
    )
  }
  return response.text()
}

/**
 * Extracts every `<loc>` URL from a sitemap XML document.
 *
 * Light regex parse (no DOMParser in plain Node); handles the handful of XML
 * entity escapes a URL can legally contain.
 *
 * @param {string} xml - Raw sitemap XML.
 * @returns {string[]} Decoded URL list, in document order.
 * @throws When the document contains no `<loc>` entries at all.
 */
function parseLocs(xml) {
  const urls = []
  for (const [, raw] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    urls.push(
      raw
        .trim()
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&apos;', "'"),
    )
  }

  if (urls.length === 0) {
    throw new Error('Sitemap contains no <loc> entries - refusing to submit an empty URL list.')
  }
  return urls
}

/**
 * Returns the host of a URL, or a placeholder when the URL is malformed
 * (malformed URLs surface in the foreign-host rejection list).
 *
 * @param {string} url - URL from the sitemap.
 * @returns {string} Its host, or `"(malformed URL)"`.
 */
function safeHost(url) {
  try {
    return new URL(url).host
  } catch {
    return '(malformed URL)'
  }
}

/**
 * Main entry point.
 *
 * Guard order matters: the production-host check runs before any network
 * request, so non-production targets never reach the IndexNow API.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const sitemapUrl = resolveSitemapUrl(parseArgs().sitemap)

  let target
  try {
    target = new URL(sitemapUrl)
  } catch {
    process.stderr.write(`Invalid sitemap URL: ${sitemapUrl}\n`)
    process.exit(1)
  }

  if (target.host !== PRODUCTION_HOST) {
    process.stderr.write(
      [
        `Refusing to submit: sitemap host "${target.host}" is not the production host "${PRODUCTION_HOST}".`,
        'IndexNow submissions are only allowed against production.',
        `  Requested sitemap: ${sitemapUrl}`,
        'No request was sent.',
        '',
      ].join('\n'),
    )
    process.exit(1)
  }

  const key = findKey()

  try {
    await verifyKeyFile(key)
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exit(1)
  }

  let urls
  try {
    urls = parseLocs(await fetchSitemap(sitemapUrl))
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exit(1)
  }

  const foreignHosts = [
    ...new Set(urls.map((url) => safeHost(url)).filter((host) => host !== PRODUCTION_HOST)),
  ]
  if (foreignHosts.length > 0) {
    process.stderr.write(
      [
        `Refusing to submit: sitemap contains URLs outside "${PRODUCTION_HOST}":`,
        ...foreignHosts.map((host) => `  ${host}`),
        'No request was sent.',
        '',
      ].join('\n'),
    )
    process.exit(1)
  }

  const payload = {
    host: PRODUCTION_HOST,
    key,
    keyLocation: `https://${PRODUCTION_HOST}/${key}.txt`,
    urlList: urls,
  }

  process.stdout.write(`Submitting ${urls.length} URL(s) to IndexNow (${PRODUCTION_HOST})...\n`)

  let response
  try {
    response = await fetch(SEO_INDEX_NOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    process.stderr.write(`IndexNow request failed: ${error.message}\n`)
    process.stderr.write(`Docs: https://www.indexnow.org/documentation\n`)
    process.exit(1)
  }

  process.stdout.write(`IndexNow responded with status ${response.status}.\n`)

  if (response.status !== 200 && response.status !== 202) {
    const lines = [
      `Unexpected IndexNow response status ${response.status} (expected 200 or 202).`,
      `Body: ${(await response.text()).slice(0, 500)}`,
    ]
    if (response.status === 403) {
      lines.push(
        'The key file was reachable moments ago, so a 403 usually means IndexNow is',
        'still holding a cached verification failure for this host/key. Retry in a few',
        'minutes; if it persists, rotate the key file and redeploy.',
      )
    }
    lines.push('Docs: https://www.indexnow.org/documentation', '')
    process.stderr.write(lines.join('\n'))
    process.exit(1)
  }

  process.stdout.write('Submission accepted.\n')
}

await main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exit(1)
})
