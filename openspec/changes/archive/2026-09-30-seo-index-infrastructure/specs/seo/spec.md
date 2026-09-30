# Spec Delta

## MODIFIED Requirements

### Requirement: sitemap.xml 生成

系统 SHALL 在 `app/sitemap.ts` 通过 Next.js 元数据文件约定生成 `/sitemap.xml`，遵循 Sitemaps XML 协议。sitemap MUST 包含所有受支持 locale 的以下 URL：首页（`/[locale]`）、文章列表页（`/[locale]/posts`）、关于页（`/[locale]/about`）、文章数大于 0 的分类页（`/[locale]/categories/<id>`）、文章数大于 0 的标签页（`/[locale]/tags/<id>`）、所有文章详情页（`/[locale]/posts/<slug>`）。当前 locale 下文章数为 0 的分类页与标签页条目 MUST NOT 出现在 sitemap 中（按 per-locale 计数过滤——某分类在 zh 有文章而 en 没有时，仅从 en 的条目中移除）；对应页面本身保留可访问与可索引性（不设 noindex，见「robots meta 标签」需求），仅移除 sitemap 这一发现入口。文章详情页的 URL MUST 只为实际存在的 locale 生成（单语言文章不生成不存在的 locale URL）。文章详情页的 `lastModified` MUST 使用 frontmatter 的 `modifiedTime`，若未提供则使用 `publishedTime`；非文章页面的 `lastModified` 使用构建时间。文章详情页 MUST 通过 `alternates.languages` 声明同篇文章其他存在的语言版本的绝对 URL（仅存在的语言版本），用于 hreflang 信号。非文章页面条目 MUST 通过 `alternates.languages` 声明所有受支持 locale 的对应页面 URL（与页面 HTML 侧 hreflang 保持一致）；首页条目 MUST 额外声明 `'x-default'` 指向无前缀站点根路径。

#### Scenario: 完整 sitemap 包含所有页面类型

- **WHEN** 系统构建并生成 `/sitemap.xml`
- **THEN** sitemap 包含 `/zh`、`/en`、`/zh/posts`、`/en/posts`、`/zh/about`、`/en/about`、所有当前 locale 下文章数大于 0 的 `/zh/categories/<id>` 与 `/en/categories/<id>`、所有当前 locale 下文章数大于 0 的 `/zh/tags/<id>` 与 `/en/tags/<id>`、所有存在的 `/zh/posts/<slug>` 与 `/en/posts/<slug>` 的绝对 URL

#### Scenario: 零篇分类条目按 locale 过滤

- **WHEN** 分类 `backend` 在 zh 与 en 下均为 0 篇文章
- **THEN** sitemap 不含任何 `/zh/categories/backend` 或 `/en/categories/backend` 条目，但 `/zh/categories/backend` 页面本身仍返回 200（未 noindex）

#### Scenario: 零篇标签仅从缺失 locale 过滤

- **WHEN** 标签 `typescript` 在 zh 下有 1 篇文章、在 en 下为 0 篇
- **THEN** sitemap 含 `/zh/tags/typescript` 条目，不含 `/en/tags/typescript` 条目

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

### Requirement: robots meta 标签

系统 SHALL 在 `app/[lang]/layout.tsx` 的 `generateMetadata` 配置 `robots` 元数据，使全站页面 `<head>` 输出 `<meta name="robots" content="index, follow">` 与 `<meta name="googlebot" content="index, follow, max-image-preview:large">`。`googleBot.max-image-preview` MUST 为 `'large'`，允许 Google Discover、AI Overviews 等场景使用大图预览。系统 MUST NOT 对任何页面（包括零篇 taxonomy 的空状态页）设置 `noindex`——空 taxonomy 页仅从 sitemap 与侧边栏移除发现入口，保留可索引性，避免后续有内容时被 noindex 状态卡住。

#### Scenario: 全站输出 robots meta

- **WHEN** 渲染任意页面（首页、文章、分类、标签、关于）
- **THEN** 页面 `<head>` 含 `<meta name="robots" content="index, follow">` 与 `<meta name="googlebot" content="index, follow, max-image-preview:large">`

#### Scenario: 空 taxonomy 页不被 noindex

- **WHEN** 渲染零篇文章的 `/zh/categories/backend`
- **THEN** 页面 `<head>` 的 robots meta 为 `index, follow`（无 `noindex`），页面返回 200

### Requirement: IndexNow 主动提交

系统 SHALL 提供 IndexNow 索引提交能力：仓库 MUST 包含 key 文件 `public/<key>.txt`（内容为 key 原文，key 为十六进制 token，与 GSC 验证文件同构、非机密、可提交 Git），部署后该文件通过 `<siteUrl>/<key>.txt` 公网可访问。系统 SHALL 提供 `pnpm seo-index-now` 命令（`scripts/seo-index-now.mjs`）：抓取生产站点 `sitemap.xml`、解析全部 `<loc>` URL、以 JSON 批量格式（`{ host, key, keyLocation, urlList }`）POST 到 IndexNow API（`https://api.indexnow.org/indexnow`）。脚本 MUST 在提交前校验目标 host 为生产域名（`blog.ruixe.net`），非生产 host（preview 部署、localhost）MUST 立即退出且不发起请求。脚本 MUST NOT import 任何标记 `'server-only'` 的 `lib/` 模块（纯 Node 环境下会抛错；线上 sitemap 即 URL 清单的单一事实来源）。

#### Scenario: key 文件公网可访问

- **WHEN** 部署后访问 `<siteUrl>/<key>.txt`
- **THEN** 返回 200，响应体为 key 原文（纯文本）

#### Scenario: 提交全站 URL

- **WHEN** 生产部署完成后运行 `pnpm seo-index-now`
- **THEN** 脚本从 `https://blog.ruixe.net/sitemap.xml` 解析全部 URL 并批量提交至 IndexNow API，响应状态码为 200 或 202

#### Scenario: 非生产 host 拒绝提交

- **WHEN**对非 `blog.ruixe.net` 的目标（如 `ruixe-blog.vercel.app` 或 `localhost`）运行脚本
- **THEN** 脚本打印拒绝原因并以非零退出码结束，未发起任何 IndexNow 请求
