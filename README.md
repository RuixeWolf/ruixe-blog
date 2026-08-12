# Ruixe Blog

> A single-author personal blog built with **Next.js 16 (App Router)** using a
> **Markdown/MDX file-driven** architecture — no CMS, no database. Posts are
> files in `content/`, parsed and rendered at request time.

**Live:** https://ruixe-blog.vercel.app ·
**Source:** [RuixeWolf/ruixe-blog](https://github.com/RuixeWolf/ruixe-blog)

## About

Ruixe Blog is a personal blog by [Ruixe](https://github.com/RuixeWolf), serving
as both a writing platform and a showcase of modern web development. It embraces
a **file-driven content model**: every post is a Markdown/MDX file committed to
Git, parsed via `@next/mdx` + `gray-matter`. No database, no admin panel, no
backend to maintain — just text files and a static-friendly Next.js app deployed
on Vercel.

The same slug is shared across locales (`hello-world.zh.mdx`,
`hello-world.en.mdx`), so a single post exists in multiple languages. Site
identity, taxonomy, and posts are all plain files under `content/`.

## Features

### Current

- 📝 **File-driven MDX content** — posts in `content/posts/{slug}.{lang}.mdx`,
  parsed with `gray-matter` + `@next/mdx` (GFM, frontmatter, heading slugs)
- 🌍 **Bilingual (zh / en)** — locale via `/[lang]` URL prefix; full UI + content
  translation through `next-intl`; root `/` redirects to the browser-preferred
  locale
- 🌓 **Dark / light theme** — `next-themes` with instant toggle
- 🧭 **Responsive layout** — persistent header + sidebar on desktop, slide-in
  drawer on mobile
- 📑 **Table of contents** — auto-generated from post headings; right sidebar on
  desktop, collapsible accordion on mobile
- 🏷️ **Taxonomy pages** — category & tag listings with per-category post counts
- 🖥️ **GitHub profile card** — live GitHub avatar/username via the GitHub API
- ⚡ **Fully static (SSG)** — all routes pre-rendered at build time
- 📊 **Analytics & Speed Insights** — `@vercel/analytics` + `@vercel/speed-insights`

### Planned (Roadmap)

- 🔍 **Search** — client-side fuzzy search with Fuse.js
- 💬 **Comments** — Giscus (GitHub Discussions)
- 🖼️ **Media hosting** — Cloudflare R2 for post images
- 🗺️ **SEO** — sitemap + structured metadata
- 📰 **RSS feed**
- 🤖 **`llms.txt`** — AI-friendly content discovery
- 📱 **PWA** — installable, minimal cache

## Tech Stack

| Layer              | Package                                       | Notes                                                                     |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| Framework          | `next@16.2.10`                                | App Router, React Compiler (`reactCompiler: true`)                        |
| React              | `react@19.2.7`                                | Server Components + streaming                                             |
| UI                 | `@heroui/react`, `@heroui/styles@^3.2.2`      | **HeroUI v3 beta** — compound components, built on React Aria             |
| Icons              | `lucide-react@^1.25.0`                        | Generic icons only (brand icons removed in v1.x)                          |
| MDX                | `@next/mdx`                                   | File-driven rendering; `remark-gfm`, `remark-frontmatter`, `rehype-slug`  |
| Styling            | `tailwindcss@4`, `@tailwindcss/typography`    | Tailwind v4 via PostCSS; `prose` for article content                      |
| i18n               | `next-intl@^4.13.2`                           | App Router + RSC; locale via `/[lang]` path prefix, `proxy.ts` middleware |
| Theming            | `next-themes@^0.4.6`                          | Class-based dark mode                                                     |
| Content parsing    | `gray-matter`, `yaml`, `github-slugger`       | Frontmatter + taxonomy YAML + heading IDs                                 |
| Analytics          | `@vercel/analytics`, `@vercel/speed-insights` | Wired in `app/layout.tsx`                                                 |
| Search (planned)   | `Fuse.js`                                     | Client-side fuzzy search over a static post index                         |
| Comments (planned) | `Giscus`                                      | GitHub Discussions backed                                                 |
| Media (planned)    | Cloudflare R2                                 | Binary assets never committed to Git                                      |

> **Version pins (do not bump):** `typescript: ~6.0.3` and `eslint: ~9.39.5`.
> TS 7 crashes `@typescript-eslint/typescript-estree`; ESLint 10 crashes
> `eslint-plugin-react`. See [`AGENTS.md`](./AGENTS.md) for full details.

## Getting Started

### Prerequisites

- **Node.js** 20+ (Next.js 16 requirement)
- **pnpm** — the lockfile is committed; do not use npm/yarn

### Installation

```bash
git clone https://github.com/RuixeWolf/ruixe-blog.git
cd ruixe-blog
pnpm install
```

### Environment

Only one optional env var:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://ruixe-blog.vercel.app  # SEO metadataBase; falls back to the Vercel URL
```

Site identity (GitHub username, title, description) lives in
[`content/site.yaml`](./content/site.yaml) — a fresh clone works with zero
`.env` setup.

### Scripts

```bash
pnpm dev          # dev server on http://localhost:3000
pnpm build        # production build
pnpm start        # serve the production build
pnpm format       # prettier --write .
pnpm lint         # eslint --fix .
pnpm format-lint  # run before committing (format + lint)
```

> Editing files under `content/*.yaml` requires a dev server restart — they are
> read at module-eval time and are not part of the module graph (no HMR).

## Project Structure

```
ruixe-blog/
├── app/                     # App Router pages
│   ├── layout.tsx           # root layout (fonts, theme provider, analytics)
│   ├── globals.css          # tailwindcss -> @heroui/styles -> heroui-theme.css
│   ├── heroui-theme.css     # custom HeroUI theme tokens
│   └── [lang]/              # locale segment (zh / en)
│       ├── layout.tsx       # header + sidebar + main content shell
│       ├── page.tsx         # home = post list
│       ├── not-found.tsx    # localized 404
│       ├── posts/           # post list + [slug] detail
│       ├── categories/[categoryId]/
│       ├── tags/[tagId]/
│       └── about/
├── components/              # layout, posts, theme components
├── content/                 # file-driven content (committed to Git)
│   ├── posts/               # {slug}.{lang}.mdx
│   ├── taxonomy/            # categories.yaml, tags.yaml
│   └── site.yaml            # site identity (githubUsername, siteTitle, ...)
├── i18n/                    # next-intl config + messages/{zh,en}.json
├── lib/                     # server-only content/config modules (fs + fetch)
├── proxy.ts                 # Next.js 16 middleware (locale detection & redirect)
├── mdx-components.tsx       # MDX component mappings (code, a, pre, ...)
└── next.config.ts           # withNextIntl(withMDX(nextConfig))
```

## Content Architecture

### Posts

Each post is an MDX file named `{slug}.{locale}.mdx` (e.g. `hello-world.zh.mdx`).
The same slug across locales is the same post in different languages.

**Frontmatter schema:**

```yaml
---
title: 'Hello World' # required
description: 'My first post' # required
publishedTime: '2026-07-21' # required (YYYY-MM-DD)
modifiedTime: '2026-07-24' # optional
category: 'frontend' # required — references categories.yaml
tags: # required — references tags.yaml
  - next-js
  - react
---
```

### Taxonomy

Categories and tags are defined in `content/taxonomy/` as YAML maps of
`id -> { name: { zh, en } }`:

```yaml
# content/taxonomy/categories.yaml
frontend:
  name:
    zh: 前端开发
    en: Frontend Development
```

Rules: IDs are unique, flat (no hierarchy), and must be translated for every
supported locale. Deleting or changing a taxonomy ID breaks URLs — add a
redirect to preserve SEO.

### Site Config

Static site identity lives in [`content/site.yaml`](./content/site.yaml) and is
committed to Git. `siteUrl` is the only env var (`NEXT_PUBLIC_SITE_URL`) since
preview and production deployments resolve to different URLs.

## Internationalization

- **Locales:** `zh` (default), `en`
- **Routing:** `/[lang]` URL prefix; root `/` is redirected by `proxy.ts`
  (Next.js 16's renamed middleware) based on `Accept-Language`
- **UI messages:** `i18n/messages/{zh,en}.json` — all keys PascalCase
  (e.g. `Nav.Home`, `PostDetail.TableOfContents`)
- **Navigation:** `next-intl/navigation` `Link` / `useRouter` over raw
  `next/link` / `next/navigation`

## Deployment

The `main` branch auto-deploys to Vercel; PRs get preview deploys.

- **Live:** https://ruixe-blog.vercel.app
- **Repo:** [RuixeWolf/ruixe-blog](https://github.com/RuixeWolf/ruixe-blog)
- **Branch:** `main` (default); feature work happens on `feat/*` branches

Vercel Analytics & Speed Insights are enabled — keep the `<Analytics />` and
`<SpeedInsights />` tags in `app/layout.tsx`.

## Development Notes

The codebase documents many non-obvious decisions and pitfalls in
[`AGENTS.md`](./AGENTS.md) — tech stack, conventions, and critical pitfalls
(HeroUI v3 quirks, `proxy.ts` matcher format, theme-switch transitions,
server-only boundaries, and more). **Read it before making architectural
changes.**

This project uses [OpenSpec](https://openspec.dev) for spec-driven development;
specs live under `openspec/`.

## Font Resources

The local SEO asset bundle uses:

- Noto Sans SC Regular/Bold — sourced from Google Fonts and stored locally as
  `assets/NotoSansSC-Regular.ttf` / `assets/NotoSansSC-Bold.ttf`, with subset
  variants under `assets/` for the generated Open Graph images.
- Geist SemiBold — sourced from the Vercel Geist font release archive and stored
  locally as `assets/Geist-SemiBold.ttf`.

The Noto Sans SC fonts are distributed under the SIL Open Font License (OFL),
and the license text is preserved in `assets/OFL.txt`.
