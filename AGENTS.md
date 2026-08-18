<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ruixe Blog

Single-author personal blog built with Next.js 16 (App Router) using a **Markdown/MDX file-driven** architecture — no CMS, no database. Posts are files in `content/`, rendered at request time.

Full project background, requirements, and tech-selection rationale: [`.temp/my-first-blog-website.md`](./.temp/my-first-blog-website.md). Read it before making architectural decisions.

## Tech Stack

| Layer           | Package                                         | Notes                                                                                                                                                                |
| --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | `next@16.3.0`                                   | App Router, React Compiler enabled (`reactCompiler: true` in `next.config.ts`)                                                                                       |
| React           | `react@19.2.8`                                  |                                                                                                                                                                      |
| UI              | `@heroui/react@^3.2.4`, `@heroui/styles@^3.2.4` | **HeroUI v3 beta** — compound components (e.g. `Card.Header`), no `Provider`, built on React Aria. Training data is likely wrong; use the `heroui-react` MCP server. |
| Icons           | `lucide-react@^1.31.0`                          |                                                                                                                                                                      |
| MDX             | `@next/mdx`                                     | File-driven rendering; not `next-mdx-remote` (archived)                                                                                                              |
| i18n            | `next-intl`                                     | App Router + RSC; locale via `/[lang]` URL path prefix, `proxy.ts` middleware (Next.js 16 renames `middleware.ts`)                                                   |
| Search          | `fuse.js@^7.5.0`                                | Client-side fuzzy search; index built server-side in `lib/search.ts` (markdown stripped) and inlined into RSC props for `components/search/SearchProvider`           |
| Comments        | `@giscus/react@^3.1.0`                          | GitHub Discussions backed; config in `content/site.yaml` (`giscus` block, committed) - no `.env` needed                                                              |
| Media           | Cloudflare R2 (`blog-assets.ruixe.net`)         | Binary assets never committed to git; `next/image` `remotePatterns` in `next.config.ts`                                                                              |
| Theming         | `next-themes@^0.4.6`                            | Class-based dark mode; Giscus theme synced via `useTheme` + `postMessage`                                                                                            |
| Content parsing | `gray-matter`, `yaml`, `github-slugger`         | Frontmatter + taxonomy YAML + heading slugs                                                                                                                          |
| Analytics       | `@vercel/analytics`, `@vercel/speed-insights`   | Already wired in `app/[lang]/layout.tsx` - do not remove                                                                                                             |

### Version pins — do NOT bump

- `typescript: ~6.0.3` — TS 7.x crashes `@typescript-eslint/typescript-estree` (`Cjs` / `Extension` undefined).
- `eslint: ~9.39.5` — ESLint 10 crashes `eslint-plugin-react` (`getFilename is not a function`); `eslint-config-next` peers `eslint >=9`.

If `pnpm up -L` bumps either, roll back and rebuild from the lockfile:

```powershell
Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml
pnpm install
```

## Commands

```bash
pnpm dev          # dev server on http://localhost:3000
pnpm build        # production build
pnpm format       # prettier --write .
pnpm lint         # eslint --fix .
pnpm format-lint  # run before committing
pnpm delete-post <slug>  # delete a post + append 308 redirect (see Post deletion below)
pnpm generate-pwa-icons  # regenerate PWA icons from assets (deterministic via sharp)
pnpm start               # production server (after `pnpm build`)
```

Package manager: **pnpm**. Node scripts/codemods should be `.mjs` files, not `node -e` one-liners (the terminal truncates long one-liners on Windows).

## Target Architecture

### Content layout (file-driven)

```
content/
├── posts/
│   └── {slug}.{lang}.mdx       # e.g. hello-world.zh.mdx, hello-world.en.mdx
├── taxonomy/
│   ├── categories.yaml          # {id: {name: {zh, en}}}
│   └── tags.yaml
└── site.yaml                    # githubUsername, siteTitle, siteDescription (committed to git)
```

**Post frontmatter schema** (required):

```yaml
---
title: ''
description: ''
publishedTime: 'YYYY-MM-DD'
modifiedTime: 'YYYY-MM-DD' # optional
category: '<categoryId>' # references categories.yaml
tags: [<tagId>, ...] # references tags.yaml
---
```

Taxonomy rules: IDs unique, no hierarchy, must provide translations for every supported locale. Deleting/changing a taxonomy ID breaks URLs — add redirects. Same slug across locales = same post, different translation.

### URL structure (lang prefix)

| Path                              | Page                                 |
| --------------------------------- | ------------------------------------ |
| `/`                               | Redirect to browser-preferred locale |
| `/[lang]`                         | Home = post list                     |
| `/[lang]/posts`                   | Post list (same as home)             |
| `/[lang]/posts/<slug>`            | Post detail                          |
| `/[lang]/categories/<categoryId>` | Posts in category                    |
| `/[lang]/tags/<tagId>`            | Posts with tag                       |
| `/[lang]/about`                   | About page                           |

Locale codes: `zh`, `en` (default `zh`). App Router structure mirrors these segments; locale detection & redirect live in `proxy.ts`.

### Layout

- **Header (persistent):** left = site title `Ruixe Blog` + nav (Home, About, GitHub). Right = search, language switcher, theme toggle.
  - Mobile: hamburger opens a Drawer (profile + nav + categories + tags); right side collapses to search + settings.
- **Body:** persistent left sidebar (GitHub profile card via GitHub API, categories list, tags cloud) + main content.
  - Mobile: sidebar moves into the Drawer; home shows a compact profile above the post list.
- **Post detail:** TOC on the right (desktop) / collapsible Accordion between meta and body (mobile).

## Conventions

- **Formatting:** Prettier — no semicolons, single quotes, 2-space, print width 100, trailing commas all. Tailwind class sorting via `prettier-plugin-tailwindcss`.
- **Imports:** sorted by `@ianvs/prettier-plugin-sort-imports` (`.prettierrc.json`). Order: `react` → `next` → builtins → third-party → `@*` aliases → relative → CSS.
- **Path alias:** `@/*` → repo root (`tsconfig.json`).
- **HeroUI v3:** compound components, no Provider. Always check docs via the `heroui-react` MCP before writing component code — v3 is beta and differs from v2.
- **Theming:** custom HeroUI tokens in `app/heroui-theme.css` (theme generator link in file header). Globals import order in `app/globals.css`: `tailwindcss` → `@heroui/styles` → `heroui-theme.css`.
- **Fonts:** Geist Sans + Geist Mono via `next/font/google` (wired in `app/[lang]/layout.tsx`).
- **Post deletion:** run `pnpm delete-post <slug>` - it deletes all locale MDX variants and appends a 308 permanent redirect record to `content/redirects.yaml`. `next.config.ts` `redirects()` reads that file at build time and expands each record into per-locale redirect rules. Never manually edit `redirects.yaml`. The script also prints guidance to manually lock the Giscus Discussion (no API automation for that step). Supports `--force` (skip confirm), `--dry-run`, `--target <destination>` (supports `{lang}` placeholder).
- **Post publishing (publish-post Agent Skill):** canonical skill at `.agents/skills/publish-post/SKILL.md` (agents that discover `.agents/skills/` load it automatically). The skill handles draft migration from `drafts/`, frontmatter completion, taxonomy assignment, locale sync, and runs `pnpm validate-post [slug]` (all posts when no slug) as the final gate. Its locale list (zh/en) and frontmatter schema are hardcoded - update the skill when adding a locale or changing the schema.
- **Server-only boundary:** `lib/posts`, `lib/taxonomy`, `lib/site-config`, `lib/github`, `lib/search`, `lib/seo`, `lib/feed`, `lib/llms-txt` all `import 'server-only'` and use `node:fs`/`fetch`. Client components MUST NOT import them - pass server-rendered content as RSC `children`/props (see `app/[lang]/layout.tsx` -> `MobileHeader` -> `MobileDrawer`). `fs.readFileSync` in these modules does NOT force dynamic rendering (all routes stay SSG).
- **`lib/` module patterns:** fail-fast validation (throw on missing/invalid data at module eval or call time), module-level singleton caches (prod-only in `posts.ts` via `process.env.NODE_ENV === 'production'`), `getCategory`/`getTag` throw on missing ID (wrap in try/catch + `notFound()` in pages).
- **Search:** `lib/search.ts` (server-only) builds a localized `SearchIndexItem[]` per locale (markdown stripped via `stripMarkdown`, category/tag names pre-localized so the client never imports the server-only taxonomy module) and inlines it into RSC props for `components/search/SearchProvider`. Fuse.js fuzzy matching runs entirely client-side; the dialog is triggered via `components/search/SearchContext` + `SearchTrigger`.
- **Comments:** `components/posts/Comments.tsx` (client) renders `@giscus/react`; the full `giscus` config block (repo, repoId, category, categoryId, mapping, etc.) lives in `content/site.yaml` and is committed to Git. Locale `zh` maps to Giscus `zh-CN`; theme is synced from `next-themes` via `postMessage` to the Giscus iframe.
- **Media:** post images are served from Cloudflare R2 at `blog-assets.ruixe.net` (configured in `next.config.ts` `images.remotePatterns`); binary assets are NEVER committed to Git. `mdx-components.tsx` `MDXImage` uses `sizes="(max-width: 1023px) 100vw, 690px"` (desktop body container ~690px).
- **i18n message keys:** all levels PascalCase (e.g. `Nav.Home`, `PostDetail.TableOfContents`). Namespaces: `Nav`, `Header`, `Theme`, `Sidebar`, `PostList`, `PostDetail`, `Categories`, `Tags`, `About`, `NotFound`. Use `next-intl/navigation` (`Link`, `usePathname`, `useRouter`) over raw `next/link`/`next/navigation`.
- **Env vars:** only `NEXT_PUBLIC_SITE_URL` (SEO `metadataBase`, falls back to Vercel URL). All other site config lives in `content/site.yaml` - no `.env` needed for a fresh clone.
- **SEO:** `lib/seo.ts` (server-only) centralizes URL building (`buildPageUrl`/`buildPostUrl`/`buildPostMarkdownUrl`) and Schema.org JSON-LD (`buildWebsiteJsonLd`/`buildPersonJsonLd`). `app/sitemap.ts` + `app/robots.ts` are static route handlers. `generateMetadata` in `app/[lang]/layout.tsx` emits per-locale `hreflang` alternates + OpenGraph; `metadataBase` comes from `siteConfig.siteUrl`.
- **RSS feed:** `lib/feed.ts` (server-only) builds RSS 2.0 XML via the `feed` package (newest 20 posts per locale); served at `app/[lang]/feed.xml/route.ts`. Feed URL helper: `buildFeedUrl(locale)`. The header `RssButton` links to the active locale's feed.
- **llms.txt:** `lib/llms-txt.ts` (server-only) builds the llms.txt v2 index (H1 title, blockquote summary, one H2 section per locale listing posts as `- [title](markdownUrl): description`); served at `app/[lang]/llms.txt/route.ts`. Only posts that exist in a locale appear under that locale's section.
- **PWA:** no-op service worker at `public/sw.js` (registered by `components/pwa/ServiceWorkerRegister.tsx`); web manifest at `app/manifest.ts`; icons in `public/` generated by `pnpm generate-pwa-icons` (deterministic via `sharp` composite). `themeColor` MUST live in the `viewport` export, NOT `generateMetadata` (Next.js 16 moved it - configuring it in metadata emits a build warning and the `<meta name="theme-color">` tags are not rendered).

## Critical pitfalls

Non-obvious issues that broke during development - heed them:

- **`proxy.ts` matcher must be a plain string array** - Prettier converts it to `String.raw` tagged template, which Next.js 16's static analyzer rejects ("Invalid segment configuration export"). Verify after `pnpm format-lint`.
- **Locale via `next/root-params`, not `getLocale()`/`setRequestLocale`** - the root layout is a single file at `app/[lang]/layout.tsx` (no two-layout split). `i18n/request.ts` resolves the locale with `rootParams.lang()` from `next/root-params` (Next.js 16.3+), which works with static rendering and needs no per-page calls. `next-intl`'s `setRequestLocale` is deprecated (SonarQube S1874) - do NOT re-add it or its imports. `<html lang>` is dynamic (correct per-locale) and SSG is preserved (`●`, not `ƒ`). Never call `getLocale()` from `next-intl/server` in the root layout - it forces ALL pages dynamic.
- **`transition-colors` + next-themes = stuck background** on live theme switch. Use `transition-[color]` on theme-aware elements so `background-color`/`border-color` update instantly.
- **Prettier plugin order:** `prettier-plugin-tailwindcss` MUST be last in `.prettierrc.json` `plugins` array (with `"tailwindStylesheet": "./app/globals.css"`), or Tailwind class sorting silently no-ops.
- **`dynamicParams = false` bypasses segment `not-found.tsx`** - unmatched slugs hit the root 404 boundary. Omit it so the page runs `notFound()` and triggers the localized 404.
- **`usePathname()` returns locale-stripped path** (e.g. `/posts/hello-world`, not `/zh/posts/hello-world`). Use `useLocale()` + `router.push(pathname, { locale })` to switch locales.
- **HeroUI v3 `Button` has no `href` prop** - use HeroUI `Link` (supports `href`/`target`/`rel`) or `next-intl/navigation` `Link` for internal routes.
- **lucide-react v1.x removed brand icons** (e.g. `Github`) - use generic icons (`ExternalLink`, `Menu`, `Search`).
- **Editing `content/*.yaml` requires a dev server restart** (not in module graph, no HMR).
- **PowerShell + bracket paths:** `Remove-Item 'path/[lang]/dir'` treats `[lang]` as a wildcard - use `-LiteralPath`.
- **`next.config.ts` `images.dangerouslyAllowLocalIP: true` is INTENTIONAL** - a local network proxy (Clash-style) routes external domains through fake private IPs (198.18.x.x), which Next.js 16's SSRF guard would otherwise reject with 400 `upstream image ... resolved to private ip`. Do NOT revert it as a "security fix"; on Vercel prod R2 resolves to Cloudflare public IPs so it's a no-op there.
- **`images.deviceSizes: [640, 750, 828]` is intentionally capped** - the post body container is ~690px on desktop and full viewport on mobile, so wider srcset entries (1080-3840) would never be selected and would inflate the `src` fallback. Don't restore defaults.
- **`next-themes@0.4.6` is patched (see `patches/next-themes@0.4.6.patch`)** - switching locale changes the root `[lang]` segment, which makes Next.js remount the whole layout subtree. That re-creates `next-themes`' no-flash `<script>` during client render, and React 19.2 errors with "Encountered a script tag while rendering React component" (client-created scripts never execute). The patch makes the script render only for SSR + first hydration (module-level flag + `useEffect`); re-mounts skip it because its job (set the theme class before first paint) is already done. Do NOT remove the patch/`patchedDependencies` entry as cleanup, and drop it if a future `next-themes` release ships an equivalent fix upstream.

## OpenSpec workflow

This project uses [OpenSpec](https://openspec.dev) (`spec-driven` schema) for spec-driven development. Config: `openspec/config.yaml`. Skills: `.github/skills/openspec-*`.

- New feature → `/openspec-new-change` or `/openspec-propose`
- Implement → `/openspec-apply-change`
- Verify + archive → `/openspec-verify-change`, `/openspec-archive-change`
- Explore before spec-ing → `/openspec-explore`

## MCP servers (`.vscode/mcp.json`)

- `next-devtools` — runtime introspection of the dev server (routes, errors, build status). Call `nextjs_index` before editing app code to understand the current state.
- `heroui-react` - HeroUI v3 docs, source, theme variables. Call `list_components` -> `get_component_docs` before writing UI.
- `sonarqube` - code quality/security analysis. Follow `.github/instructions/sonarqube_mcp.instructions.md`: disable auto-analysis while editing, analyze modified files when done; look up project keys via `search_my_sonarqube_projects` (don't guess).
- `context7` - current library/framework docs. Use for API questions about `next-intl`, `next`, HeroUI, etc. (`resolve-library-id` -> `query-docs`).

## Deployment

- GitHub: [`RuixeWolf/ruixe-blog`](https://github.com/RuixeWolf/ruixe-blog) (branch `main`).
- Vercel auto-deploys `main`; PRs get preview deploys.
- Live: https://ruixe-blog.vercel.app (custom domain planned post-MVP).
- Analytics & Speed Insights are enabled - keep the `<Analytics />` / `<SpeedInsights />` tags in `app/[lang]/layout.tsx`.
