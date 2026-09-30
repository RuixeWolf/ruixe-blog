# Spec Delta

## MODIFIED Requirements

### Requirement: canonical URL 与 hreflang alternates

系统 SHALL 为每个页面通过 `metadata.alternates` 声明 canonical URL 与 hreflang alternates，且每个页面的 `generateMetadata` MUST 通过 `lib/seo.ts` 的统一构造函数生成 `alternates` 对象（canonical、languages、types 三字段齐备），MUST NOT 手工拼装部分字段。canonical URL MUST 为当前页面的绝对 URL（由 `metadataBase` 与当前路径组合）。根布局（`app/[lang]/layout.tsx`）的 `alternates` MUST NOT 声明 `languages`（该值只对首页成立，对其他一切页面是错值；布局仅保留 `types` 作为 RSS 自动发现兜底）——任何页面遗漏调用构造函数时 hreflang 缺失而非指向错误页面。

文章详情页的 `alternates.languages` MUST 只声明实际存在的语言版本（通过检查 `getPostBySlug(slug, otherLocale)` 是否返回非 null 判断），MUST NOT 声明不存在的语言版本的 URL（避免爬虫爬到 404 alternate）。非文章页面（首页、文章列表、分类、标签、关于）的 `alternates.languages` SHALL 声明所有受支持 locale 的对应页面 URL（这些页面对所有 locale 都存在），且 MUST 指向与当前页面相同的路径（如 `/zh/posts` 与 `/en/posts` 互指），MUST NOT 指向 locale 首页。首页（`/[lang]`）的 `alternates.languages` MUST 额外声明 `'x-default'` 指向无前缀的站点根路径（依赖 `proxy.ts` 对 `/` 的 locale 协商重定向，符合 Google 对自动重定向首页的 x-default 建议）；其他页面 MUST NOT 声明 `x-default`。

文章详情页的 `generateMetadata` MUST 显式声明 `openGraph.locale`（因 Next.js metadata 合并机制对 `openGraph` 整体替换，子页面返回 `openGraph` 会覆盖父布局的 `openGraph`，导致 `locale` 丢失）。`openGraph.locale` 的值 MUST 为 OGP 规范的 `language_TERRITORY` 格式（`zh` → `zh_CN`、`en` → `en_US`），MUST NOT 输出裸 locale 代码；同时 SHALL 声明 `openGraph.localeAlternate`（另一受支持 locale 的映射值），渲染为 `og:locale:alternate`。

#### Scenario: 文章详情页 canonical

- **WHEN** 渲染 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 含 `<link rel="canonical" href="<siteUrl>/zh/posts/hello-world">`

#### Scenario: 首页 canonical 与 x-default

- **WHEN** 渲染 `/zh` 首页
- **THEN** 页面 `<head>` 含 `<link rel="canonical" href="<siteUrl>/zh">`、`hreflang="zh"` 指向 `/zh`、`hreflang="en"` 指向 `/en`、以及 `hreflang="x-default"` 指向 `<siteUrl>`（无前缀根路径）

#### Scenario: 文章列表页 hreflang 指向同路径

- **WHEN** 渲染 `/zh/posts`
- **THEN** 页面 `<head>` 含 `<link rel="canonical" href="<siteUrl>/zh/posts">`，且 `hreflang="zh"` 指向 `/zh/posts`、`hreflang="en"` 指向 `/en/posts`（MUST NOT 指向 locale 首页）

#### Scenario: 非文章页 hreflang 完整

- **WHEN** 渲染 `/zh/about`、`/zh/categories/frontend` 或 `/zh/tags/next-js`
- **THEN** 页面 `<head>` 同时含 canonical、`hreflang="zh"`、`hreflang="en"`（指向同路径的对应 locale 版本）与 RSS alternate types

#### Scenario: 文章详情页 hreflang 只含存在的语言版本

- **WHEN** 文章 `hello-world` 同时存在 zh 与 en 版本
- **THEN** `/zh/posts/hello-world` 的 `<head>` 含 `<link rel="alternate" hreflang="zh" href=".../zh/posts/hello-world">` 与 `<link rel="alternate" hreflang="en" href=".../en/posts/hello-world">`

#### Scenario: 单语言文章不声明不存在的 alternate

- **WHEN** 文章 `draft-post` 只存在 zh 版本
- **THEN** `/zh/posts/draft-post` 的 `<head>` 不含 `hreflang="en"` 的 alternate link（因 `/en/posts/draft-post` 会 404）

#### Scenario: 文章详情页保留 openGraph.locale

- **WHEN** 渲染文章详情页 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 含 `<meta property="og:locale" content="zh_CN">`（不应为裸 `zh`，且不应因 metadata 合并而丢失），并含 `<meta property="og:locale:alternate" content="en_US">`

#### Scenario: 分类页 canonical

- **WHEN** 渲染 `/zh/categories/frontend`
- **THEN** 页面 `<head>` 含 `<link rel="canonical" href="<siteUrl>/zh/categories/frontend">`

### Requirement: Open Graph 图片

系统 SHALL 通过 Next.js 文件约定提供 Open Graph 图片。根级 `app/opengraph-image.png` 作为全站默认 OG 图，为所有未单独定义 OG 图的页面提供 `<meta property="og:image">`。文章详情页 SHALL 通过 `app/[lang]/posts/[slug]/opengraph-image.tsx` 动态生成专属 OG 图，在构建时为每篇存在的文章×locale 生成一张 1200×630 PNG。动态 OG 图 MUST 包含文章标题、站点名称、分类名称与发布日期。动态 OG 图 MUST 使用支持中文的字体（Noto Sans SC 子集）渲染中文标题，使用拉丁字体（Geist）渲染拉丁文字。

`openGraph.images` 的设置规则 MUST 区分页面类型：文章详情页 `generateMetadata` MUST NOT 设置 `openGraph.images`，让同段文件约定自动接管 OG 图注入（文件约定优先级：最近的段胜出）；其他在 `generateMetadata` 中定义 `openGraph` 对象的页面（文章列表、关于、分类、标签）MUST 显式包含默认 OG 图（`/opengraph-image.png`）——Next.js metadata 对 `openGraph` 整体替换，且文件约定注入仅发生在定义了图文件的段，子段替换后父段注入的图已被冲掉，不显式声明会导致 `og:image` 丢失。未定义 `openGraph` 的页面（首页）继承布局的默认图。

#### Scenario: 默认 OG 图兜底非文章页面

- **WHEN** 用户访问首页 `/zh` 或关于页 `/zh/about`
- **THEN** 页面 `<head>` 含 `<meta property="og:image">` 指向 `app/opengraph-image.png` 生成的图片 URL

#### Scenario: 文章详情页专属 OG 图

- **WHEN** 用户访问 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 的 `<meta property="og:image">` 指向 `app/[lang]/posts/[slug]/opengraph-image.tsx` 为该文章生成的专属图片 URL，而非默认 OG 图

#### Scenario: 定义 openGraph 的非文章页不丢失默认图

- **WHEN** 渲染 `/zh/categories/frontend`（其 `generateMetadata` 定义了页面级 `openGraph`）
- **THEN** 页面 `<head>` 仍含 `<meta property="og:image">` 指向默认 OG 图 URL

#### Scenario: 动态 OG 图包含文章标题

- **WHEN** 系统为文章 `hello-world` 的 zh 版本生成 OG 图
- **THEN** 图片中渲染该文章 frontmatter 的 `title` 字段内容（中文）

#### Scenario: 动态 OG 图构建时静态化

- **WHEN** 执行 `pnpm build`
- **THEN** 每篇存在的文章×locale 组合在构建时生成一张静态 PNG，运行时直接返回缓存

### Requirement: Twitter Card 配置

系统 SHALL 在 `app/[lang]/layout.tsx` 的 `metadata` 中配置 Twitter Card，`twitter.card` MUST 为 `summary_large_image`，使社交平台分享时显示大图卡片。布局级 `twitter` 对象 MUST 仅包含 `card` 与 `creator` 两个字段，MUST NOT 在布局层设置 `twitter.title` / `twitter.description` / `twitter.images`——布局级值会被所有未自定义 twitter 的页面整体继承，导致文章页卡片显示站点名而非文章标题。页面 MUST NOT 单独定义 `twitter` 元数据；标题、描述与图片由 X/Twitter 爬虫按官方回退规则从对应的 `og:title` / `og:description` / `og:image` 读取（Next.js 服务端不做此回填，回退发生在爬虫端）。

#### Scenario: 根布局注入 Twitter Card 元数据

- **WHEN** 渲染任意页面
- **THEN** 页面 `<head>` 含 `<meta name="twitter:card" content="summary_large_image">` 与 `<meta name="twitter:creator" content="@RuixeWolf">`，且不含布局级 `twitter:title` / `twitter:description`

#### Scenario: 文章页 Twitter 卡片跟随文章数据

- **WHEN** 渲染 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 的 `<meta name="twitter:card">` 存在、无 `twitter:title` 标签，`og:title` 为文章标题——X/Twitter 爬虫回退后卡片标题显示文章标题而非站点名

### Requirement: 结构化数据（JSON-LD）

系统 SHALL 在页面中通过 `<script type="application/ld+json">` 注入 Schema.org 结构化数据。根布局 SHALL 注入 `WebSite` schema（含站点名称与 URL）。文章详情页 SHALL 注入 `BlogPosting` schema（含 `headline`、`description`、`datePublished`、`dateModified`、`author`、`image`、`mainEntityOfPage`）。分类页与标签页 SHALL 注入 `BreadcrumbList` schema（含首页 > 分类/标签 的面包屑路径）。文章详情页 SHALL 额外注入 `BreadcrumbList` schema（含首页 > 文章 的路径）。关于页 SHALL 注入 `Person` schema（含博主信息）。`BlogPosting` 的 `author` MUST 使用 `siteConfig.githubUsername` 作为作者名，URL 指向 GitHub profile。JSON-LD 数据 MUST 为有效的 JSON，通过 `JSON.stringify` 序列化。

`BlogPosting` 的 `image` MUST 为数组且包含该文章动态 OG 图的稳定 URL（文章详情页 URL 追加 `/opengraph-image`，无 hash 查询参数的直达路径），使 Google Article 推荐属性补齐。`datePublished` 与 `dateModified` MUST 为带时区偏移的 ISO 8601 完整日期时间（`YYYY-MM-DDT00:00:00+08:00`，按作者时区 UTC+8 拼接），MUST NOT 输出裸 `YYYY-MM-DD`（否则按 Googlebot 时区解释）；frontmatter 值已含时间部分时（含 `T`）MUST 原样透传。

#### Scenario: 根布局 WebSite schema

- **WHEN** 渲染任意页面
- **THEN** 页面含 `<script type="application/ld+json">`，其内容为 `WebSite` 类型的 Schema.org 对象，含 `name`（站点标题）与 `url`（站点 URL）

#### Scenario: 文章详情页 BlogPosting schema

- **WHEN** 渲染文章 `/zh/posts/hello-world` 的详情页
- **THEN** 页面含 `BlogPosting` 类型的 JSON-LD，`headline` 为文章标题，`datePublished` 为 frontmatter `publishedTime`，`author` 为 `Person` 类型且 `name` 为 `siteConfig.githubUsername`

#### Scenario: BlogPosting 含 OG 图 image

- **WHEN** 渲染文章 `/zh/posts/hello-world` 的详情页
- **THEN** `BlogPosting` JSON-LD 含 `image` 数组，首元素为 `<siteUrl>/zh/posts/hello-world/opengraph-image`（该 URL 返回 200 且 `Content-Type` 为 `image/png`）

#### Scenario: BlogPosting 日期带时区

- **WHEN** 文章 frontmatter `publishedTime: '2026-08-28'`
- **THEN** `BlogPosting` JSON-LD 的 `datePublished` 为 `2026-08-28T00:00:00+08:00`（非裸日期）

#### Scenario: 分类页 BreadcrumbList schema

- **WHEN** 渲染 `/zh/categories/frontend` 分类页
- **THEN** 页面含 `BreadcrumbList` 类型的 JSON-LD，包含首页与该分类的面包屑项

#### Scenario: 关于页 Person schema

- **WHEN** 渲染 `/zh/about` 关于页
- **THEN** 页面含 `Person` 类型的 JSON-LD，含博主 GitHub 用户名与 GitHub profile URL

### Requirement: SEO 构建模块

系统 SHALL 在 `lib/seo.ts`（`server-only` 模块）集中 SEO 构建逻辑，包括绝对 URL 生成函数（首页、文章、分类、标签、静态页面）、`alternates` 构造函数（canonical + languages + RSS types 齐备返回，首页附 `x-default`）、`openGraph` 构造函数（标题、描述、URL、站点名、locale 映射、localeAlternate、默认图齐备返回）、locale 到 OGP 格式的映射函数（`zh` → `zh_CN`、`en` → `en_US`）、日期时区化函数（`YYYY-MM-DD` → `YYYY-MM-DDT00:00:00+08:00`）、JSON-LD 对象构建函数（`WebSite`、`Person`、`BlogPosting`、`BreadcrumbList`）。这些函数 MUST 为纯函数（接收数据返回对象，不读取文件系统；既有 `buildPostAlternates` 经 `getPostBySlug` 检查文章存在性，为唯一既有例外）。页面与 sitemap 的 `generateMetadata` MUST 调用这些构造函数生成 `alternates` 与 `openGraph` 数据，MUST NOT 在页面文件中手工拼装这些对象，避免字段缺漏（Next.js metadata 对这些顶层键整体替换，部分字段的手工拼装会静默丢失其他字段）。

#### Scenario: 页面调用 alternates 构造函数

- **WHEN** `/zh/posts` 列表页的 `generateMetadata` 生成 `alternates`
- **THEN** 通过 `lib/seo.ts` 的构造函数传入路径 `posts` 与 locale，返回 canonical、languages（zh/en 指向同路径）、types 三字段齐备的对象

#### Scenario: 裸日期转换为带时区 ISO 日期时间

- **WHEN** 构造 `BlogPosting` JSON-LD 且 frontmatter `publishedTime: '2026-08-28'`
- **THEN** 日期经时区化函数转换为 `2026-08-28T00:00:00+08:00`；输入已含 `T` 时原样透传

#### Scenario: 文章详情页调用 JSON-LD 构建函数

- **WHEN** 文章详情页渲染 `BlogPosting` JSON-LD
- **THEN** 调用 `lib/seo.ts` 的 `buildBlogPostingJsonLd` 函数，传入 post metadata 与 locale，返回 Schema.org 对象

#### Scenario: sitemap 调用 URL 生成函数

- **WHEN** `app/sitemap.ts` 生成文章 URL
- **THEN** 调用 `lib/seo.ts` 的 URL 生成函数，传入 slug 与 locale，返回绝对 URL

### Requirement: sitemap.xml 生成

系统 SHALL 在 `app/sitemap.ts` 通过 Next.js 元数据文件约定生成 `/sitemap.xml`，遵循 Sitemaps XML 协议。sitemap MUST 包含所有受支持 locale 的以下 URL：首页（`/[locale]`）、文章列表页（`/[locale]/posts`）、关于页（`/[locale]/about`）、所有分类页（`/[locale]/categories/<id>`）、所有标签页（`/[locale]/tags/<id>`）、所有文章详情页（`/[locale]/posts/<slug>`）。文章详情页的 URL MUST 只为实际存在的 locale 生成（单语言文章不生成不存在的 locale URL）。文章详情页的 `lastModified` MUST 使用 frontmatter 的 `modifiedTime`，若未提供则使用 `publishedTime`；非文章页面的 `lastModified` 使用构建时间。文章详情页 MUST 通过 `alternates.languages` 声明同篇文章其他存在的语言版本的绝对 URL（仅存在的语言版本），用于 hreflang 信号。非文章页面条目 MUST 通过 `alternates.languages` 声明所有受支持 locale 的对应页面 URL（与页面 HTML 侧 hreflang 保持一致，避免「半套」标注）；首页条目 MUST 额外声明 `'x-default'` 指向无前缀站点根路径。

#### Scenario: 完整 sitemap 包含所有页面类型

- **WHEN** 系统构建并生成 `/sitemap.xml`
- **THEN** sitemap 包含 `/zh`、`/en`、`/zh/posts`、`/en/posts`、`/zh/about`、`/en/about`、所有 `/zh/categories/<id>` 与 `/en/categories/<id>`、所有 `/zh/tags/<id>` 与 `/en/tags/<id>`、所有存在的 `/zh/posts/<slug>` 与 `/en/posts/<slug>` 的绝对 URL

#### Scenario: 首页条目含 x-default

- **WHEN** sitemap 生成 `/zh` 首页条目
- **THEN** 该条目含 `alternates.languages`，声明 `zh` 指向 `/zh`、`en` 指向 `/en`、`x-default` 指向站点根路径（渲染为 `<xhtml:link rel="alternate" hreflang="x-default">`）

#### Scenario: 非文章页条目声明语言 alternates

- **WHEN** sitemap 生成 `/zh/posts` 或 `/zh/categories/frontend` 条目
- **THEN** 该条目含 `alternates.languages` 声明 `zh` 与 `en` 指向同路径的对应 locale URL

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

## ADDED Requirements

### Requirement: 页面级 Open Graph 元数据

系统 SHALL 为文章列表页、关于页、分类页、标签页提供页面级 `openGraph` 元数据，使社交分享卡片反映页面实际内容而非站点默认值（这些页面在 `generateMetadata` 中定义 `openGraph` 对象，经 `lib/seo.ts` 的构造函数生成）。各页面 MUST 满足：`og:title` 为页面本地化标题（列表页为列表标题、关于页为关于标题、分类页为分类名、标签页为标签名）；`og:url` 为当前页面的 canonical URL（MUST NOT 为站点根路径）；`og:description` 为页面描述或站点描述；`og:locale` 与 `og:locale:alternate` 按 OGP 映射格式输出；`og:image` 为默认 OG 图（见「Open Graph 图片」需求）。首页 MUST 通过继承布局 `openGraph` 获得正确元数据：布局 `openGraph.url` MUST 为当前 locale 的首页绝对 URL（`/[locale]`），使首页 `og:url` 与其 canonical 一致。

#### Scenario: 分类页社交卡片为页面级数据

- **WHEN** 渲染 `/zh/categories/ai-coding`
- **THEN** 页面 `<head>` 含 `og:title` 为该分类的本地化名称（非站点名）、`og:url` 为 `<siteUrl>/zh/categories/ai-coding`（非站点根）、`og:locale` 为 `zh_CN`

#### Scenario: 文章列表页 og:url 指向当前页

- **WHEN** 渲染 `/zh/posts`
- **THEN** 页面 `<head>` 的 `og:url` 为 `<siteUrl>/zh/posts`（非站点根路径）

#### Scenario: 首页 og:url 为当前 locale 首页

- **WHEN** 渲染 `/zh` 首页
- **THEN** 页面 `<head>` 的 `og:url` 为 `<siteUrl>/zh`，与首页 canonical 一致

#### Scenario: 关于页社交卡片不降级为英文站点描述

- **WHEN** 渲染 `/zh/about`
- **THEN** 页面 `<head>` 的 `og:locale` 为 `zh_CN` 且 `og:title` 为本地化的关于页标题
