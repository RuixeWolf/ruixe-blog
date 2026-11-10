<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ruixe Blog

Single-package Next.js 16 App Router blog with React 19, HeroUI v3, Tailwind v4, and `next-intl`. Content is file-driven MDX/YAML under `content/`; there is no CMS or database. Locales are `zh` and `en` (default `en`). Use **pnpm** only.

## Commands and verification

```bash
pnpm dev                         # http://localhost:3000
pnpm format-lint                 # Prettier --write ., then ESLint --fix .
pnpm build                       # production build and type checking
pnpm validate-post               # validate all posts and taxonomy
pnpm validate-post <slug>        # validate one slug's locale variants
pnpm delete-post <slug>          # delete variants and register 308 redirects
pnpm generate-pwa-icons          # regenerate committed icons from assets/app-icon.png
```

- Before finishing code changes, run `pnpm format-lint` and `pnpm build`. For content changes, run the appropriate `validate-post` command.
- For focused checks, use `pnpm exec prettier --write <paths>`, `pnpm exec eslint --fix <paths>`, or `pnpm exec tsc --noEmit`. The repository has no test runner or test script.
- `format` and `lint` modify files. Check the diff afterward, especially `proxy.ts` (see below).
- `pnpm delete-post` supports `--dry-run`, `--force`, and `--target <destination>`. Never edit `content/redirects.yaml` manually; `next.config.ts` consumes it at build time.
- Do not run `pnpm seo-index-now` as a check: it submits the live production sitemap to the external IndexNow service.
- Write repository scripts/codemods as `.mjs` files rather than long `node -e` one-liners, which are fragile in the Windows terminal.

## Dependency and toolchain constraints

- Keep `typescript: ~6.0.3` and `eslint: ~9.39.5` pinned. TS 7 breaks `@typescript-eslint/typescript-estree`; ESLint 10 breaks `eslint-plugin-react`.
- Keep the `next-themes@0.4.6` patch in `patches/` and its `patchedDependencies` entry in `pnpm-workspace.yaml`. Locale switches remount the root layout; the patch prevents React 19 from recreating the no-flash script during client render.
- HeroUI is v3: compound components, no app-level HeroUI `Provider`. Consult the `heroui-react` MCP docs before writing or changing components rather than relying on v2 examples. `lucide-react` v1 has no brand icons.
- Prettier sorts imports and Tailwind classes. Keep `prettier-plugin-tailwindcss` last in `.prettierrc.json` with `tailwindStylesheet: ./app/globals.css`, or class sorting silently stops working.

## Architecture and content

- `app/[lang]/layout.tsx` is both the root and locale layout: it renders `<html>`/`<body>`, global providers, chrome, metadata, Analytics, and SpeedInsights. Do not split it without reworking the i18n setup.
- Posts are `content/posts/{slug}.{locale}.mdx`; the same slug across locales identifies translations. Required frontmatter is `title`, `description`, `publishedTime`, `category`, and `tags`; `modifiedTime` is optional.
- For publishing or updating posts, follow `.agents/skills/publish-post/SKILL.md`. In particular, preserve the author's original-locale body verbatim and obtain confirmation before overwriting existing posts or taxonomy.
- Taxonomy IDs in `content/taxonomy/*.yaml` are flat, translated for every locale, and part of public URLs. Renaming/deleting one requires redirects. When adding a locale or changing the schema, also sync `scripts/validate-post.mjs` and the publish-post skill, which hardcode snapshots.
- `lib/{posts,taxonomy,site-config,github,search,seo,feed,llms-txt}.ts` import `server-only`. Never import their runtime values from client components; pass server-rendered data through RSC props/children. Their filesystem reads do not require making routes dynamic.
- Site identity and public integration config live in committed `content/site.yaml`. The only optional app env var is `NEXT_PUBLIC_SITE_URL`; it defaults to `https://blog.ruixe.net`, so a fresh clone needs no `.env`.
- Restart `pnpm dev` after changing site/taxonomy YAML; these files are read outside HMR's module graph.
- Post media belongs on Cloudflare R2 (`blog-assets.ruixe.net`), not in Git. Generated browser/PWA icons are the intentional committed exception: edit `assets/app-icon.png`, then run `pnpm generate-pwa-icons`.

## Do-not-break behavior

### Routing and i18n

- `i18n/request.ts` deliberately resolves the locale with `next/root-params`. Do not reintroduce deprecated `setRequestLocale` or call `getLocale()` in the root layout; the current design preserves static rendering.
- Use `next-intl/navigation` (`Link`, `usePathname`, `useRouter`) instead of raw Next navigation APIs. `usePathname()` is locale-stripped; locale switches use `useLocale()` and `router.push(pathname, { locale })`.
- Keep `proxy.ts` `matcher` as a plain string array. Prettier may turn regex strings into `String.raw`, which Next.js 16's static analyzer rejects.
- The proxy excludes dotted paths except `/feed.xml`. Unprefixed markdown URLs therefore have no fallback route and 404. The conditional locale-less path from `buildSharePostPath` is a deliberate share-link exception; do not generalize it to markdown URLs.
- Do not add `dynamicParams = false` to dynamic pages: it bypasses the segment's localized `not-found.tsx` and sends unknown slugs to the root 404.

### Styling, MDX, images, and PWA

- On theme-aware elements use `transition-[color]`, not `transition-colors`; transitioning background/border colors leaves stale colors during a live `next-themes` switch.
- Keep `remark-cjk-friendly/parseOnly` after `remark-gfm` in `next.config.ts`; it fixes bold CJK text around full-width punctuation. The custom CJK autolink plugin and its absolute path are also intentional for Turbopack.
- `images.dangerouslyAllowLocalIP: true` supports local proxies that map external hosts to private IPs. `images.deviceSizes: [640, 750, 828]` is capped to the actual article/viewport widths. Do not remove either setting as cleanup.
- Keep `themeColor` in the layout's `viewport` export, not `generateMetadata`. `app/manifest.ts` intentionally omits `theme_color` so installed-PWA chrome follows the system scheme; do not re-add it.
- On PowerShell, use `-LiteralPath` for paths containing `[lang]` or other brackets; normal path arguments treat brackets as wildcards.

## Workflow and integrations

- Features use OpenSpec (`openspec/config.yaml`): `/openspec-new-change` or `/openspec-propose`, then `/openspec-apply-change`, `/openspec-verify-change`, and `/openspec-archive-change`. Use `/openspec-explore` before specifying uncertain work.
- Repo MCP config is `.mcp.json` (`next-devtools` and `heroui-react`). If SonarQube MCP is available, follow `.github/instructions/sonarqube_mcp.instructions.md`; in particular, look up project keys instead of guessing and analyze modified code when finished.
- `main` auto-deploys to Vercel and PRs receive previews. Keep the Analytics and SpeedInsights tags in `app/[lang]/layout.tsx`.
