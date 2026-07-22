<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Ruixe Blog

Single-author personal blog built with Next.js 16 (App Router) using a **Markdown/MDX file-driven** architecture — no CMS, no database. Posts are files in `content/`, rendered at request time.

Full project background, requirements, and tech-selection rationale: [`.temp/my-first-blog-website.md`](./.temp/my-first-blog-website.md). Read it before making architectural decisions.

## Tech Stack

| Layer              | Package                                       | Notes                                                                                                                                                                |
| ------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | `next@16.2.10`                                | App Router, React Compiler enabled (`reactCompiler: true` in `next.config.ts`)                                                                                       |
| React              | `react@19.2.7`                                |                                                                                                                                                                      |
| UI                 | `@heroui/react`, `@heroui/styles@^3.2.2`      | **HeroUI v3 beta** — compound components (e.g. `Card.Header`), no `Provider`, built on React Aria. Training data is likely wrong; use the `heroui-react` MCP server. |
| Icons              | `lucide-react@^1.25.0`                        |                                                                                                                                                                      |
| MDX                | `@next/mdx`                                   | File-driven rendering; not `next-mdx-remote` (archived)                                                                                                              |
| i18n               | `next-intl`                                   | App Router + RSC; locale via `/[lang]` URL path prefix, `proxy.ts` middleware (Next.js 16 renames `middleware.ts`)                                                   |
| Search (planned)   | `Fuse.js`                                     | Client-side fuzzy search over static post index                                                                                                                      |
| Comments (planned) | `Giscus`                                      | GitHub Discussions backed, embedded in post detail                                                                                                                   |
| Media (planned)    | Cloudflare R2                                 | Never commit binary assets to git                                                                                                                                    |
| Analytics          | `@vercel/analytics`, `@vercel/speed-insights` | Already wired in `app/layout.tsx` — do not remove                                                                                                                    |

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
```

Package manager: **pnpm**. Node scripts/codemods should be `.mjs` files, not `node -e` one-liners (the terminal truncates long one-liners on Windows).

## Target Architecture

### Content layout (file-driven)

```
content/
├── posts/
│   └── {slug}.{lang}.mdx       # e.g. hello-world.zh.mdx, hello-world.en.mdx
└── taxonomy/
    ├── categories.yaml          # {id: {name: {zh, en}}}
    └── tags.yaml
```

**Post frontmatter schema** (required):

```yaml
---
title: ''
description: ''
publishedAt: 'YYYY-MM-DD'
updatedAt: 'YYYY-MM-DD' # optional
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
- **Fonts:** Geist Sans + Geist Mono via `next/font/google` (wired in `app/layout.tsx`).
- **Deleted posts:** add a redirect from the old URL to preserve SEO (avoid dead links).

## OpenSpec workflow

This project uses [OpenSpec](https://openspec.dev) (`spec-driven` schema) for spec-driven development. Config: `openspec/config.yaml`. Skills: `.github/skills/openspec-*`.

- New feature → `/openspec-new-change` or `/openspec-propose`
- Implement → `/openspec-apply-change`
- Verify + archive → `/openspec-verify-change`, `/openspec-archive-change`
- Explore before spec-ing → `/openspec-explore`

## MCP servers (`.vscode/mcp.json`)

- `next-devtools` — runtime introspection of the dev server (routes, errors, build status). Call `nextjs_index` before editing app code to understand the current state.
- `heroui-react` — HeroUI v3 docs, source, theme variables. Call `list_components` → `get_component_docs` before writing UI.

## Deployment

- GitHub: [`RuixeWolf/ruixe-blog`](https://github.com/RuixeWolf/ruixe-blog) (branch `main`).
- Vercel auto-deploys `main`; PRs get preview deploys.
- Live: https://ruixe-blog.vercel.app (custom domain planned post-MVP).
- Analytics & Speed Insights are enabled — keep the `<Analytics />` / `<SpeedInsights />` tags in `app/layout.tsx`.
