/**
 * Head-level SEO acceptance checks for a locally running instance.
 *
 * One-off verification script for the `seo-metadata-consistency` OpenSpec
 * change: fetches each representative page and asserts the rendered `<head>`
 * signals — canonical, hreflang group (home also declares `x-default`), OGP
 * locale mapping, `og:image` presence, the slimmed Twitter card, and (for a
 * post page) the `BlogPosting` JSON-LD image + timezone-complete dates. The
 * sitemap assertions also confirm HTML/sitemap hreflang consistency, since
 * both surfaces are built from the same `lib/seo.ts` helpers.
 *
 * Usage (against a local production instance with self-consistent URLs):
 *   $env:NEXT_PUBLIC_SITE_URL='http://localhost:3210'; pnpm build
 *   $env:PORT='3210'; pnpm start
 *   node scripts/verify-seo.mjs   # BASE_URL env overrides the target origin
 *
 * Exit code 0 = all checks passed, 1 = at least one check failed or the
 * server was unreachable.
 *
 * @module verify-seo
 */

/** Base origin of the instance under test (no trailing slash). */
const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

let passCount = 0
let failCount = 0

/**
 * Records one assertion result on the console.
 *
 * @param label - Human-readable description of the expectation.
 * @param condition - Whether the expectation held.
 * @param detail - Observed value to print on failure.
 */
function check(label, condition, detail = '') {
  if (condition) {
    passCount++
    console.log(`  PASS ${label}`)
  } else {
    failCount++
    console.error(`  FAIL ${label}${detail ? ` — got: ${detail}` : ''}`)
  }
}

/**
 * Fetches a path from the instance under test.
 *
 * @param path - Root-relative path (e.g. `/zh`).
 * @returns Response body text.
 */
async function fetchText(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual' })
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`)
  return res.text()
}

/**
 * Escapes a literal for embedding in a RegExp.
 *
 * @param s - Literal text.
 * @returns Regex-escaped text.
 */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extracts a `<meta>` content value by `property` (default) or `name`.
 *
 * @param html - Full page HTML.
 * @param key - Meta property/name value to look up.
 * @param attr - Attribute carrying the key (`property` or `name`).
 * @returns Content value, or null when absent.
 */
function meta(html, key, attr = 'property') {
  const tag = html.match(new RegExp(`<meta[^>]*${attr}="${escapeRe(key)}"[^>]*>`))
  return tag ? (tag[0].match(/content="([^"]*)"/)?.[1] ?? null) : null
}

/**
 * Extracts the canonical URL.
 *
 * @param html - Full page HTML.
 * @returns Canonical href, or null when absent.
 */
function canonical(html) {
  const tag = html.match(/<link[^>]*rel="canonical"[^>]*>/)
  return tag ? (tag[0].match(/href="([^"]+)"/)?.[1] ?? null) : null
}

/**
 * Extracts the hreflang alternate links as a map.
 *
 * Matching is case-insensitive because the serializer renders the attribute
 * as `hrefLang`; HTML attributes are case-insensitive either way.
 *
 * @param html - Full page HTML.
 * @returns Map of hreflang value (locale or `x-default`) to absolute URL;
 *   RSS `type="application/rss+xml"` alternates are excluded.
 */
function hreflangs(html) {
  const map = {}
  for (const m of html.matchAll(/<link[^>]*rel="alternate"[^>]*>/gi)) {
    const lang = m[0].match(/hreflang="([^"]+)"/i)?.[1]
    const href = m[0].match(/href="([^"]+)"/i)?.[1]
    if (lang && href) map[lang] = href
  }
  return map
}

/**
 * Extracts and parses the JSON-LD script payloads.
 *
 * @param html - Full page HTML.
 * @returns Parsed JSON-LD objects (unparseable payloads dropped).
 */
function jsonLd(html) {
  return [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1])
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

/**
 * Waits until the instance answers on `/zh` (server startup race).
 *
 * @param timeoutMs - Give-up horizon in milliseconds.
 */
async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/zh`, { redirect: 'manual' })
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`server not reachable at ${BASE}`)
}

/**
 * Asserts the Twitter card tags on a page.
 *
 * Next 16 auto-fills `twitter:title` / `twitter:description` / `twitter:image`
 * from the page's own resolved `openGraph` (`postProcessMetadata`), so those
 * tags may exist even though the layout only configures `card` + `creator`.
 * The invariant this protects: the values track the PAGE-level og data (post
 * cards show the post title), never a stale layout-level site title.
 *
 * @param name - Label prefix for the console output.
 * @param html - Full page HTML.
 */
function checkTwitterCard(name, html) {
  const card = meta(html, 'twitter:card', 'name')
  check(`${name}: twitter:card is summary_large_image`, card === 'summary_large_image', card)
  check(`${name}: twitter:creator present`, meta(html, 'twitter:creator', 'name') === '@RuixeWolf')
  const twTitle = meta(html, 'twitter:title', 'name')
  check(
    `${name}: twitter:title tracks page og:title (or is absent)`,
    twTitle === null || twTitle === meta(html, 'og:title'),
    twTitle,
  )
  const twDescription = meta(html, 'twitter:description', 'name')
  check(
    `${name}: twitter:description tracks page og:description (or is absent)`,
    twDescription === null || twDescription === meta(html, 'og:description'),
    twDescription,
  )
}

/**
 * Runs the shared canonical/hreflang/og/twitter assertions for a listing page
 * (every non-post page that exists in all supported locales).
 *
 * @param name - Label for the console output.
 * @param path - Root-relative path under test (e.g. `/zh/posts`).
 */
async function verifyListingPage(name, path) {
  console.log(`\n== ${name} (${path}) ==`)
  const html = await fetchText(path)
  const langs = hreflangs(html)

  check('canonical is self', canonical(html) === `${BASE}${path}`, canonical(html))
  check('hreflang zh -> same path', langs.zh === `${BASE}${path}`, langs.zh)
  check(
    'hreflang en -> sibling locale, same path',
    langs.en === `${BASE}${path.replace(/^\/zh/, '/en')}`,
    langs.en,
  )
  check('no x-default on non-home page', langs['x-default'] === undefined, langs['x-default'])
  check('og:url is canonical URL', meta(html, 'og:url') === `${BASE}${path}`, meta(html, 'og:url'))
  check('og:locale mapped to zh_CN', meta(html, 'og:locale') === 'zh_CN', meta(html, 'og:locale'))
  check(
    'og:locale:alternate mapped to en_US',
    meta(html, 'og:locale:alternate') === 'en_US',
    meta(html, 'og:locale:alternate'),
  )
  check('og:image present', meta(html, 'og:image') !== null, meta(html, 'og:image'))
  check(
    'og:title is page-level (not site title)',
    meta(html, 'og:title') !== null && meta(html, 'og:title') !== 'Ruixe Blog',
    meta(html, 'og:title'),
  )
  checkTwitterCard(name, html)
  check(
    'RSS alternate type present',
    /<link[^>]*rel="alternate"[^>]*type="application\/rss\+xml"[^>]*>/i.test(html),
  )
}

/**
 * Main entry: sitemap checks pick real taxonomy/post paths, then page heads
 * are asserted individually.
 */
async function main() {
  await waitForServer()
  console.log(`Verifying SEO head output against ${BASE}`)

  // --- sitemap.xml: hreflang languages on non-post entries -----------------
  console.log('\n== sitemap.xml ==')
  const sitemapXml = await fetchText('/sitemap.xml')
  const blocks = sitemapXml.split('</url>')
  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  const zhHomeBlock = blocks.find((b) => b.includes(`<loc>${BASE}/zh</loc>`))
  check('home entry declares x-default', /hreflang="x-default"/.test(zhHomeBlock ?? ''))
  check(
    'home entry x-default -> prefix-less root',
    zhHomeBlock?.includes(`href="${BASE}"`) ?? false,
  )
  check(
    'home entry declares zh and en',
    /hreflang="zh"/.test(zhHomeBlock ?? '') && /hreflang="en"/.test(zhHomeBlock ?? ''),
  )

  const categoryPath = locs
    .map((u) => u.slice(BASE.length))
    .find((p) => /^\/zh\/categories\/[^/]+$/.test(p))
  const categoryBlock = blocks.find((b) => b.includes(`<loc>${BASE}${categoryPath}</loc>`))
  check(
    'category entry declares zh + en at same path',
    /hreflang="zh"/.test(categoryBlock ?? '') && /hreflang="en"/.test(categoryBlock ?? ''),
  )

  const postPath = locs.map((u) => u.slice(BASE.length)).find((p) => /^\/zh\/posts\/[^/]+$/.test(p))
  const postBlock = blocks.find((b) => b.includes(`<loc>${BASE}${postPath}</loc>`))
  const sitemapPostLangs = [...(postBlock?.matchAll(/hreflang="([^"]+)"/g) ?? [])].map((m) => m[1])

  const tagPath = locs.map((u) => u.slice(BASE.length)).find((p) => /^\/zh\/tags\/[^/]+$/.test(p))

  // --- home pages ------------------------------------------------------------
  for (const [path, locale] of [
    ['/zh', 'zh_CN'],
    ['/en', 'en_US'],
  ]) {
    console.log(`\n== home (${path}) ==`)
    const html = await fetchText(path)
    const langs = hreflangs(html)

    check('canonical is self', canonical(html) === `${BASE}${path}`, canonical(html))
    check('hreflang zh -> /zh', langs.zh === `${BASE}/zh`, langs.zh)
    check('hreflang en -> /en', langs.en === `${BASE}/en`, langs.en)
    check('x-default -> prefix-less root', langs['x-default'] === BASE, langs['x-default'])
    check(
      'og:url is locale homepage (== canonical)',
      meta(html, 'og:url') === `${BASE}${path}`,
      meta(html, 'og:url'),
    )
    check(`og:locale is ${locale}`, meta(html, 'og:locale') === locale, meta(html, 'og:locale'))
    check('og:image present', meta(html, 'og:image') !== null, meta(html, 'og:image'))
    checkTwitterCard('home', html)
    if (path === '/zh') {
      check(
        'tab title is clean site title',
        /<title>Ruixe Blog<\/title>/.test(html),
        html.match(/<title>([^<]*)<\/title>/)?.[1],
      )
    }
  }

  // --- listing / taxonomy pages ---------------------------------------------
  await verifyListingPage('post list', '/zh/posts')
  await verifyListingPage('about', '/zh/about')
  await verifyListingPage('category', categoryPath)
  await verifyListingPage('tag', tagPath)

  // --- post detail page ------------------------------------------------------
  console.log(`\n== post detail (${postPath}) ==`)
  const postHtml = await fetchText(postPath)
  const postLangs = hreflangs(postHtml)
  const postCanonical = canonical(postHtml)
  const blogPosting = jsonLd(postHtml).find((o) => o['@type'] === 'BlogPosting')
  const hasBreadcrumb = jsonLd(postHtml).some((o) => o['@type'] === 'BreadcrumbList')

  check('canonical is self', postCanonical === `${BASE}${postPath}`, postCanonical)
  check(
    'hreflang set matches sitemap entry (existence-filtered)',
    JSON.stringify(Object.keys(postLangs).sort()) === JSON.stringify(sitemapPostLangs.sort()),
    `page=${Object.keys(postLangs)} sitemap=${sitemapPostLangs}`,
  )
  check(
    'og:locale mapped to zh_CN',
    meta(postHtml, 'og:locale') === 'zh_CN',
    meta(postHtml, 'og:locale'),
  )
  check(
    'og:image is the post-specific OG route',
    /\/posts\/[^/]+\/opengraph-image/.test(meta(postHtml, 'og:image') ?? ''),
    meta(postHtml, 'og:image'),
  )
  checkTwitterCard('post', postHtml)
  check('BlogPosting JSON-LD present', blogPosting !== undefined)
  check(
    'BlogPosting.image is array with stable OG route',
    Array.isArray(blogPosting?.image) &&
      blogPosting.image.includes(`${BASE}${postPath}/opengraph-image`),
    JSON.stringify(blogPosting?.image),
  )
  check(
    'BlogPosting datePublished carries +08:00 offset',
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(blogPosting?.datePublished ?? ''),
    blogPosting?.datePublished,
  )
  check(
    'BlogPosting dateModified carries +08:00 offset',
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(blogPosting?.dateModified ?? ''),
    blogPosting?.dateModified,
  )
  check('BreadcrumbList JSON-LD present', hasBreadcrumb)

  // --- summary ---------------------------------------------------------------
  console.log(`\n${passCount} passed, ${failCount} failed`)
  if (failCount > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
