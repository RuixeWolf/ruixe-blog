# RSS Feed Specification

## Purpose

定义 Ruixe Blog 的 RSS 订阅能力，使读者能通过 RSS 阅读器订阅博客文章更新。包括每语言 RSS 2.0 feed 的构建时静态生成、根路径的 locale 感知重定向、RSS 阅读器自动发现 link 标签、以及页面 Header 中的可见订阅入口。

## Requirements

### Requirement: 每语言 RSS 2.0 feed 生成

系统 SHALL 为每个受支持 locale 生成一个 RSS 2.0 格式的 feed，URL 为 `/{locale}/feed.xml`。feed SHALL 通过 Next.js Route Handler（`app/[lang]/feed.xml/route.ts`）实现，并在构建时通过 `generateStaticParams` 为每个受支持 locale 预渲染为静态 XML 文件。`dynamicParams` MUST 为 `false`，使未知 locale 的请求返回 404 而非动态生成。feed 的 HTTP 响应 `Content-Type` MUST 为 `application/xml; charset=utf-8`。

#### Scenario: 每个受支持 locale 有独立 feed

- **WHEN** 系统构建并生成静态产物
- **THEN** 存在 `/zh/feed.xml` 与 `/en/feed.xml` 两个静态 XML 文件，分别包含对应语言的文章条目

#### Scenario: 未知 locale 返回 404

- **WHEN** 用户请求 `/fr/feed.xml`（`fr` 非受支持 locale）
- **THEN** 系统返回 404 响应，不动态生成 feed

#### Scenario: feed 响应 Content-Type

- **WHEN** RSS 阅读器请求 `/zh/feed.xml`
- **THEN** HTTP 响应头 `Content-Type` 为 `application/xml; charset=utf-8`

### Requirement: feed channel 元数据

每个 feed 的 `<channel>` 元素 MUST 包含以下子元素：`<title>` 为 `siteConfig.siteTitle`、`<description>` 为 `siteConfig.siteDescription`、`<link>` 为当前 locale 首页的绝对 URL（`/{locale}`）、`<language>` 为当前 locale 代码（`zh` 或 `en`）、`<lastBuildDate>` 为 feed 生成时间（构建时间，RFC 2822 格式）。`<channel>` SHALL 包含 `<atom:link rel="self" href="{feed 自身绝对 URL}">` 声明 feed 自身的规范 URL。feed 的根 `<rss>` 元素 MUST 声明 `xmlns:atom` 命名空间。

#### Scenario: channel 包含站点元数据

- **WHEN** 系统生成 `/zh/feed.xml`
- **THEN** `<channel>` 包含 `<title>Ruixe Blog</title>`、`<description>` 为 `siteConfig.siteDescription`、`<link>` 为 `{siteUrl}/zh`、`<language>zh</language>`

#### Scenario: channel 包含 lastBuildDate

- **WHEN** 系统在构建时间 T 生成 feed
- **THEN** `<channel><lastBuildDate>` 为 RFC 2822 格式的时间 T

#### Scenario: feed 声明 atom self link

- **WHEN** 系统生成 `/zh/feed.xml`
- **THEN** `<channel>` 包含 `<atom:link href="{siteUrl}/zh/feed.xml" rel="self" type="application/rss+xml">`，且根 `<rss>` 元素声明 `xmlns:atom="http://www.w3.org/2005/Atom"`

### Requirement: feed 条目内容

feed SHALL 为当前 locale 下 `getAllPosts(locale)` 返回的最新 20 篇文章各生成一个 `<item>` 元素（按 `publishedTime` 降序，即最新在前）。每个 `<item>` MUST 包含：`<title>` 为文章 frontmatter `title`、`<description>` 为文章 frontmatter `description`、`<link>` 为文章详情页绝对 URL（`/{locale}/posts/{slug}`）、`<guid>` 为文章详情页绝对 URL（与 `<link>` 相同）、`<pubDate>` 为文章 `publishedTime` 的 RFC 2822 格式。每个 `<item>` SHALL 包含 `<category>` 元素，值为文章 frontmatter `category` 对应的分类名称（经 taxonomy 本地化，非 ID）。每个 `<item>` SHALL 为每个 frontmatter `tags` 中的标签 ID 生成一个 `<category>` 元素，值为标签名称（经 taxonomy 本地化，非 ID）。`<item>` MUST NOT 包含文章正文内容（`<content:encoded>`）--仅摘要用于引导流量回站。

#### Scenario: feed 包含最新 20 篇文章

- **WHEN** 当前 locale 下存在 25 篇文章
- **THEN** feed 包含 20 个 `<item>`，按 `publishedTime` 降序排列，第 21-25 篇不包含

#### Scenario: 文章数不足 20 时包含全部

- **WHEN** 当前 locale 下存在 3 篇文章
- **THEN** feed 包含 3 个 `<item>`

#### Scenario: item 包含文章元数据

- **WHEN** 文章 `hello-world` 的 zh 版本 frontmatter 为 `title: 'Hello World'`、`description: 'My first post'`、`publishedTime: '2026-07-21'`、`category: 'frontend'`
- **THEN** 对应 `<item>` 的 `<title>` 为 `Hello World`、`<description>` 为 `My first post`、`<link>` 与 `<guid>` 为 `{siteUrl}/zh/posts/hello-world`、`<pubDate>` 为 `2026-07-21` 的 RFC 2822 格式

#### Scenario: item 包含本地化分类与标签

- **WHEN** 文章 `hello-world` 的 zh 版本 `category: 'frontend'`、`tags: ['next-js', 'react']`，且 `categories.yaml` 中 `frontend` 的 `name.zh` 为 `前端开发`，`tags.yaml` 中 `next-js` 的 `name.zh` 为 `Next.js`
- **THEN** 对应 `<item>` 包含 `<category>前端开发</category>` 与 `<category>Next.js</category>`、`<category>React</category>`

#### Scenario: item 不包含正文内容

- **WHEN** 系统生成任意 feed 条目
- **THEN** `<item>` 不包含 `<content:encoded>` 元素

### Requirement: XML 转义与日期格式化

feed 的所有 XML 文本内容 MUST 经过正确的 XML 实体转义（`&` -> `&amp;`、`<` -> `&lt;`、`>` -> `&gt;`、`"` -> `&quot;`、`'` -> `&apos;`）。所有日期元素（`<pubDate>`、`<lastBuildDate>`）MUST 遵循 RFC 2822 格式（如 `Tue, 12 Aug 2026 00:00:00 GMT`）。feed 的 XML 声明 MUST 为 `<?xml version="1.0" encoding="UTF-8"?>`。

#### Scenario: 标题含特殊字符被转义

- **WHEN** 文章标题为 `React & Next.js: <Best> Practices`
- **THEN** feed 中对应 `<item><title>` 的文本为 `React &amp; Next.js: &lt;Best&gt; Practices`

#### Scenario: pubDate 为 RFC 2822 格式

- **WHEN** 文章 `publishedTime` 为 `2026-08-12`
- **THEN** 对应 `<item><pubDate>` 为 RFC 2822 格式的日期字符串

### Requirement: 根路径 locale 感知重定向

系统 SHALL 对根路径 `/feed.xml` 执行 locale 检测并重定向到 `/{locale}/feed.xml`。locale 检测 MUST 复用 next-intl middleware 的优先级：路径前缀（不适用，根路径无前缀）-> `NEXT_LOCALE` cookie -> `Accept-Language` header -> `defaultLocale`。重定向 MUST 为 307（临时重定向），以便用户切换语言偏好后下次请求重新检测。`/feed.xml` MUST 被 `proxy.ts` 的 matcher 匹配（追加到 matcher 数组），使其经过 next-intl middleware 处理。

#### Scenario: 有 NEXT_LOCALE cookie 时重定向到 cookie locale

- **WHEN** 用户浏览器有 `NEXT_LOCALE=en` cookie，请求 `/feed.xml`
- **THEN** 系统返回 307 重定向到 `/en/feed.xml`

#### Scenario: 无 cookie 时按 Accept-Language 重定向

- **WHEN** 用户浏览器无 `NEXT_LOCALE` cookie，`Accept-Language: zh-CN,zh;q=0.9,en;q=0.8`，请求 `/feed.xml`
- **THEN** 系统返回 307 重定向到 `/zh/feed.xml`

#### Scenario: 无 cookie 且 Accept-Language 不匹配时重定向到默认 locale

- **WHEN** 用户浏览器无 `NEXT_LOCALE` cookie，`Accept-Language: fr-FR,fr;q=0.9`（无 zh/en 匹配），请求 `/feed.xml`
- **THEN** 系统返回 307 重定向到 `/zh/feed.xml`（`defaultLocale`）

### Requirement: RSS 自动发现 link 标签

每个 locale 的页面（`/[locale]/...`）的 HTML `<head>` MUST 包含 `<link rel="alternate" type="application/rss+xml" title="{siteTitle}" href="/{locale}/feed.xml">`，用于 RSS 阅读器自动发现当前 locale 的 feed。该 link 标签 SHALL 通过 `app/[lang]/layout.tsx` 的 `generateMetadata` 的 `alternates.types['application/rss+xml']` 字段注入。link 的 `href` MUST 为相对路径（`/{locale}/feed.xml`），由 Next.js 结合 `metadataBase` 解析为绝对 URL。

#### Scenario: 页面 head 包含 RSS 自动发现 link

- **WHEN** 用户访问 `/zh/posts/hello-world`
- **THEN** 页面 HTML `<head>` 包含 `<link rel="alternate" type="application/rss+xml" title="Ruixe Blog" href="/zh/feed.xml">`

#### Scenario: 不同 locale 页面指向各自 feed

- **WHEN** 用户访问 `/en/about`
- **THEN** 页面 HTML `<head>` 的 RSS link `href` 为 `/en/feed.xml`，而非 `/zh/feed.xml`

### Requirement: Header RSS 订阅入口

桌面 Header 右侧功能栏与移动 MobileHeader 右侧功能栏 SHALL 各展示一个 RSS 图标按钮，链接到当前 locale 的 feed（`/{locale}/feed.xml`）。按钮 MUST 使用 `lucide-react` 的 `Rss` 图标。按钮 MUST 有 `aria-label` 用于无障碍访问，文案来自 i18n 消息键 `Header.Rss`（zh: `RSS 订阅`，en: `RSS Feed`）。按钮链接 MUST 使用原生 `<a>` 元素（非 `next-intl/navigation` `Link`），因为 feed 是 Route Handler 返回的 XML 文件而非 App Router 页面，客户端导航不适用。按钮的视觉样式 MUST 与同栏其他图标按钮（搜索、主题切换）一致。

#### Scenario: 桌面 Header 包含 RSS 按钮

- **WHEN** 用户在桌面宽度（`lg+`）访问任意 `/[locale]/...` 页面
- **THEN** Header 右侧功能栏展示 RSS 图标按钮，位于搜索按钮与语言切换按钮之间

#### Scenario: 移动 Header 包含 RSS 按钮

- **WHEN** 用户在移动宽度（`<lg`）访问任意 `/[locale]/...` 页面
- **THEN** MobileHeader 右侧功能栏展示 RSS 图标按钮

#### Scenario: RSS 按钮链接到当前 locale feed

- **WHEN** 用户在 `/en/posts` 页面点击 RSS 按钮
- **THEN** 浏览器导航到 `/en/feed.xml`（非客户端路由跳转）

#### Scenario: RSS 按钮 aria-label 本地化

- **WHEN** 当前 locale 为 `zh`
- **THEN** RSS 按钮的 `aria-label` 为 `RSS 订阅`
- **WHEN** 当前 locale 为 `en`
- **THEN** RSS 按钮的 `aria-label` 为 `RSS Feed`

### Requirement: feed 不出现在 sitemap 与 robots

RSS feed（`/{locale}/feed.xml` 与 `/feed.xml`）MUST NOT 出现在 `sitemap.xml` 中（sitemap 针对可索引的 HTML 页面，feed 是 XML 文件）。`robots.txt` MUST NOT 引用 feed URL。feed 通过自动发现 link 标签与可见 UI 入口被发现，而非通过 sitemap/robots。

#### Scenario: sitemap 不包含 feed URL

- **WHEN** 系统生成 `/sitemap.xml`
- **THEN** sitemap 不包含任何 `/feed.xml` 或 `/{locale}/feed.xml` 的 URL 条目

#### Scenario: robots.txt 不引用 feed

- **WHEN** 系统生成 `/robots.txt`
- **THEN** robots.txt 不包含任何指向 feed URL 的指令
