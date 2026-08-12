# SEO Specification

## Purpose

定义 Ruixe Blog 的搜索引擎优化（SEO）能力，包括 sitemap.xml 生成、robots.txt 生成、Open Graph 与 Twitter Card 社交分享元数据、结构化数据（JSON-LD）、canonical URL 与 hreflang 多语言 alternates 声明、以及网站图标资源。使博客文章列表与内容能被搜索引擎高效抓取与索引，并在社交平台分享时展示丰富的预览卡片。

## Requirements

### Requirement: sitemap.xml 生成

系统 SHALL 在 `app/sitemap.ts` 通过 Next.js 元数据文件约定生成 `/sitemap.xml`，遵循 Sitemaps XML 协议。sitemap MUST 包含所有受支持 locale 的以下 URL：首页（`/[locale]`）、文章列表页（`/[locale]/posts`）、关于页（`/[locale]/about`）、所有分类页（`/[locale]/categories/<id>`）、所有标签页（`/[locale]/tags/<id>`）、所有文章详情页（`/[locale]/posts/<slug>`）。文章详情页的 URL MUST 只为实际存在的 locale 生成（单语言文章不生成不存在的 locale URL）。文章详情页的 `lastModified` MUST 使用 frontmatter 的 `modifiedTime`，若未提供则使用 `publishedTime`；非文章页面的 `lastModified` 使用构建时间。文章详情页 MUST 通过 `alternates.languages` 声明同篇文章其他存在的语言版本的绝对 URL，用于 hreflang 信号。

#### Scenario: 完整 sitemap 包含所有页面类型

- **WHEN** 系统构建并生成 `/sitemap.xml`
- **THEN** sitemap 包含 `/zh`、`/en`、`/zh/posts`、`/en/posts`、`/zh/about`、`/en/about`、所有 `/zh/categories/<id>` 与 `/en/categories/<id>`、所有 `/zh/tags/<id>` 与 `/en/tags/<id>`、所有存在的 `/zh/posts/<slug>` 与 `/en/posts/<slug>` 的绝对 URL

#### Scenario: 文章页 lastModified 来自 frontmatter

- **WHEN** 文章 `hello-world` 的 frontmatter 含 `publishedTime: '2026-07-21'` 且无 `modifiedTime`
- **THEN** sitemap 中 `/zh/posts/hello-world` 与 `/en/posts/hello-world` 的 `<lastmod>` 为 `2026-07-21`

#### Scenario: 文章页 lastModified 优先 modifiedTime

- **WHEN** 文章的 frontmatter 含 `publishedTime: '2026-07-21'` 与 `modifiedTime: '2026-08-01'`
- **THEN** sitemap 中该文章 URL 的 `<lastmod>` 为 `2026-08-01`

#### Scenario: 单语言文章不生成不存在的 locale URL

- **WHEN** 文章 `draft-post` 只存在 `draft-post.zh.mdx` 而无 `draft-post.en.mdx`
- **THEN** sitemap 只包含 `/zh/posts/draft-post`，不包含 `/en/posts/draft-post`

#### Scenario: 文章页 hreflang alternates

- **WHEN** 文章 `hello-world` 同时存在 zh 与 en 版本
- **THEN** sitemap 中 `/zh/posts/hello-world` 条目含 `alternates.languages`，声明 `zh` 指向 `/zh/posts/hello-world`、`en` 指向 `/en/posts/hello-world` 的绝对 URL

### Requirement: robots.txt 生成

系统 SHALL 在 `app/robots.ts` 通过 Next.js 元数据文件约定生成 `/robots.txt`，遵循 Robots Exclusion Standard。robots.txt MUST 允许所有用户代理抓取全站（`User-Agent: *`，`Allow: /`），且 MUST 包含指向 sitemap.xml 的 `Sitemap:` 指令。robots.txt MUST NOT 包含任何 `Disallow` 规则（全站可索引）。

#### Scenario: robots.txt 内容

- **WHEN** 系统生成 `/robots.txt`
- **THEN** 内容包含 `User-Agent: *`、`Allow: /`、以及 `Sitemap: <siteUrl>/sitemap.xml`（`<siteUrl>` 为 `siteConfig.siteUrl`）

### Requirement: Open Graph 图片

系统 SHALL 通过 Next.js 文件约定提供 Open Graph 图片。根级 `app/opengraph-image.png` 作为全站默认 OG 图，为所有未单独定义 OG 图的页面提供 `<meta property="og:image">`。文章详情页 SHALL 通过 `app/[lang]/posts/[slug]/opengraph-image.tsx` 动态生成专属 OG 图，在构建时为每篇存在的文章×locale 生成一张 1200×630 PNG。动态 OG 图 MUST 包含文章标题、站点名称、分类名称与发布日期。动态 OG 图 MUST 使用支持中文的字体（Noto Sans SC 子集）渲染中文标题，使用拉丁字体（Geist）渲染拉丁文字。页面 `generateMetadata` MUST NOT 设置 `openGraph.images`，让文件约定自动接管 OG 图注入（文件约定优先级：最近的段胜出）。

#### Scenario: 默认 OG 图兜底非文章页面

- **WHEN** 用户访问首页 `/zh` 或关于页 `/zh/about`
- **THEN** 页面 `<head>` 含 `<meta property="og:image">` 指向 `app/opengraph-image.png` 生成的图片 URL

#### Scenario: 文章详情页专属 OG 图

- **WHEN** 用户访问 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 的 `<meta property="og:image">` 指向 `app/[lang]/posts/[slug]/opengraph-image.tsx` 为该文章生成的专属图片 URL，而非默认 OG 图

#### Scenario: 动态 OG 图包含文章标题

- **WHEN** 系统为文章 `hello-world` 的 zh 版本生成 OG 图
- **THEN** 图片中渲染该文章 frontmatter 的 `title` 字段内容（中文）

#### Scenario: 动态 OG 图构建时静态化

- **WHEN** 执行 `pnpm build`
- **THEN** 每篇存在的文章×locale 组合在构建时生成一张静态 PNG，运行时直接返回缓存

### Requirement: Twitter Card 配置

系统 SHALL 在根 `app/layout.tsx` 的 `metadata` 中配置 Twitter Card，`twitter.card` MUST 为 `summary_large_image`，使社交平台分享时显示大图卡片。Twitter Card 的图片 MUST 复用 Open Graph 图片（通过文件约定自动回退，无需单独的 `twitter-image` 文件）。

#### Scenario: 根布局注入 Twitter Card 元数据

- **WHEN** 渲染任意页面
- **THEN** 页面 `<head>` 含 `<meta name="twitter:card" content="summary_large_image">`

### Requirement: 结构化数据（JSON-LD）

系统 SHALL 在页面中通过 `<script type="application/ld+json">` 注入 Schema.org 结构化数据。根布局 SHALL 注入 `WebSite` schema（含站点名称与 URL）。文章详情页 SHALL 注入 `BlogPosting` schema（含 `headline`、`description`、`datePublished`、`dateModified`、`author`、`mainEntityOfPage`）。分类页与标签页 SHALL 注入 `BreadcrumbList` schema（含首页 > 分类/标签 的面包屑路径）。文章详情页 SHALL 额外注入 `BreadcrumbList` schema（含首页 > 文章 的路径）。关于页 SHALL 注入 `Person` schema（含博主信息）。`BlogPosting` 的 `author` MUST 使用 `siteConfig.githubUsername` 作为作者名，URL 指向 GitHub profile。JSON-LD 数据 MUST 为有效的 JSON，通过 `JSON.stringify` 序列化。

#### Scenario: 根布局 WebSite schema

- **WHEN** 渲染任意页面
- **THEN** 页面含 `<script type="application/ld+json">`，其内容为 `WebSite` 类型的 Schema.org 对象，含 `name`（站点标题）与 `url`（站点 URL）

#### Scenario: 文章详情页 BlogPosting schema

- **WHEN** 渲染文章 `/zh/posts/hello-world` 的详情页
- **THEN** 页面含 `BlogPosting` 类型的 JSON-LD，`headline` 为文章标题，`datePublished` 为 frontmatter `publishedTime`，`author` 为 `Person` 类型且 `name` 为 `siteConfig.githubUsername`

#### Scenario: 分类页 BreadcrumbList schema

- **WHEN** 渲染 `/zh/categories/frontend` 分类页
- **THEN** 页面含 `BreadcrumbList` 类型的 JSON-LD，包含首页与该分类的面包屑项

#### Scenario: 关于页 Person schema

- **WHEN** 渲染 `/zh/about` 关于页
- **THEN** 页面含 `Person` 类型的 JSON-LD，含博主 GitHub 用户名与 GitHub profile URL

### Requirement: canonical URL 与 hreflang alternates

系统 SHALL 为每个页面通过 `metadata.alternates` 声明 canonical URL 与 hreflang alternates。canonical URL MUST 为当前页面的绝对 URL（由 `metadataBase` 与当前路径组合）。文章详情页的 `alternates.languages` MUST 只声明实际存在的语言版本（通过检查 `getPostBySlug(slug, otherLocale)` 是否返回非 null 判断），MUST NOT 声明不存在的语言版本的 URL（避免爬虫爬到 404 alternate）。非文章页面（首页、文章列表、分类、标签、关于）的 `alternates.languages` SHALL 声明所有受支持 locale 的对应页面 URL（这些页面对所有 locale 都存在）。文章详情页的 `generateMetadata` MUST 显式声明 `openGraph.locale`（因 Next.js metadata 浅合并机制，子页面返回 `openGraph` 会整体替换父布局的 `openGraph`，导致 `locale` 丢失）。

#### Scenario: 文章详情页 canonical

- **WHEN** 渲染 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 含 `<link rel="canonical" href="<siteUrl>/zh/posts/hello-world">`

#### Scenario: 文章详情页 hreflang 只含存在的语言版本

- **WHEN** 文章 `hello-world` 同时存在 zh 与 en 版本
- **THEN** `/zh/posts/hello-world` 的 `<head>` 含 `<link rel="alternate" hreflang="zh" href=".../zh/posts/hello-world">` 与 `<link rel="alternate" hreflang="en" href=".../en/posts/hello-world">`

#### Scenario: 单语言文章不声明不存在的 alternate

- **WHEN** 文章 `draft-post` 只存在 zh 版本
- **THEN** `/zh/posts/draft-post` 的 `<head>` 不含 `hreflang="en"` 的 alternate link（因 `/en/posts/draft-post` 会 404）

#### Scenario: 文章详情页保留 openGraph.locale

- **WHEN** 渲染文章详情页 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 含 `<meta property="og:locale" content="zh">`（不应因 metadata 浅合并而丢失）

#### Scenario: 分类页 canonical

- **WHEN** 渲染 `/zh/categories/frontend`
- **THEN** 页面 `<head>` 含 `<link rel="canonical" href="<siteUrl>/zh/categories/frontend">`

### Requirement: 网站图标资源

系统 SHALL 通过 Next.js 文件约定提供网站图标。`app/favicon.ico`（已存在）提供 `.ico` 格式 favicon。`app/icon.png` 提供通用图标（用于浏览器 tab、PWA 等，建议 ≥ 512×512）。`app/apple-icon.png` 提供 Apple touch icon（用于 iOS 添加到主屏幕）。图标资源 MUST 为实心背景方形图（Apple touch icon 透明背景会被 iOS 强制黑底）。

#### Scenario: 浏览器加载 favicon

- **WHEN** 用户访问任意页面
- **THEN** 页面 `<head>` 含 `<link rel="icon" href="/favicon.ico" sizes="any">`

#### Scenario: Apple touch icon

- **WHEN** iOS 用户将网站添加到主屏幕
- **THEN** 主屏幕图标使用 `app/apple-icon.png` 生成的 `<link rel="apple-touch-icon">`

### Requirement: SEO 构建模块

系统 SHALL 在 `lib/seo.ts`（`server-only` 模块）集中 SEO 构建逻辑，包括绝对 URL 生成函数（首页、文章、分类、标签、静态页面）、JSON-LD 对象构建函数（`WebSite`、`Person`、`BlogPosting`、`BreadcrumbList`）。这些函数 MUST 为纯函数（接收数据返回对象，不读取文件系统）。页面与 sitemap 通过调用这些函数生成 SEO 数据，避免在多处重复逻辑。

#### Scenario: sitemap 调用 URL 生成函数

- **WHEN** `app/sitemap.ts` 生成文章 URL
- **THEN** 调用 `lib/seo.ts` 的 URL 生成函数，传入 slug 与 locale，返回绝对 URL

#### Scenario: 文章详情页调用 JSON-LD 构建函数

- **WHEN** 文章详情页渲染 `BlogPosting` JSON-LD
- **THEN** 调用 `lib/seo.ts` 的 `buildBlogPostingJsonLd` 函数，传入 post metadata 与 locale，返回 Schema.org 对象
