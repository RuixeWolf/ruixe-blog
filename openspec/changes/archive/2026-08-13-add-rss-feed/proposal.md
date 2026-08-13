## Why

博客当前已有完整的 SEO 基础设施（sitemap、robots、OG 图、JSON-LD、hreflang），但缺少 RSS 订阅能力。需求文档（`.temp/my-first-blog-website.md`）将 RSS 列为 Phase 3 功能，用户无法通过 RSS 阅读器订阅文章更新。作为单作者博客，RSS 是触达订阅者、提升回访率的标准渠道，且与现有文件驱动架构天然契合——文章数据已在构建时通过 `lib/posts.ts` 静态化，零运行时开销即可生成 feed。

## What Changes

- 新增 `lib/feed.ts`，集中 RSS 2.0 feed 构建逻辑（使用 `feed` 库处理 XML 转义与 RFC 2822 日期格式化）
- 新增 `app/[lang]/feed.xml/route.ts` Route Handler，通过 `generateStaticParams` 为每个 locale 预渲染 feed，`dynamicParams = false` 让未知 locale 返回 404
- 修改 `proxy.ts` matcher 数组追加 `'/feed.xml'`，让 next-intl middleware 对根 `/feed.xml` 执行 locale 检测（cookie 优先 → Accept-Language → defaultLocale）并 307 重定向到 `/{locale}/feed.xml`
- 修改 `app/[lang]/layout.tsx` 的 `generateMetadata`，增加 `alternates.types['application/rss+xml']` 生成 `<link rel="alternate" type="application/rss+xml">` 用于 RSS 阅读器自动发现
- 新增 `components/layout/RssButton.tsx`，在桌面 Header 与移动 MobileHeader 右侧功能栏展示 RSS 图标按钮（`lucide-react` `Rss` 图标），链接到当前 locale 的 feed
- 修改 `i18n/messages/{zh,en}.json` 新增 `Header.Rss` 消息键
- `package.json` 新增 `feed` 依赖
- Feed 条目内容为 frontmatter `description`（非全文），条目数量为最新 20 篇，按 `publishedTime` 降序

## Capabilities

### New Capabilities

- `rss-feed`: 博客的 RSS 订阅能力，包括每语言 feed 的构建时静态生成、根路径 locale 感知重定向、RSS 阅读器自动发现 link 标签、以及 Header 中的可见订阅入口

### Modified Capabilities

<!-- 无现有 capability 的需求变更。RSS 是新增的订阅能力，与现有 `seo` capability（搜索引擎优化）职责不同：SEO 面向爬虫抓取与索引，RSS 面向订阅者内容聚合。auto-discovery `<link rel="alternate" type="application/rss+xml">` 虽通过 `generateMetadata` 注入，但其服务对象是 RSS 阅读器而非搜索引擎，归入 `rss-feed` capability。 -->

## Impact

- **新增代码**：`lib/feed.ts`、`app/[lang]/feed.xml/route.ts`、`components/layout/RssButton.tsx`
- **修改代码**：`proxy.ts`（matcher）、`app/[lang]/layout.tsx`（generateMetadata）、`components/layout/Header.tsx`、`components/layout/MobileHeader.tsx`、`i18n/messages/zh.json`、`i18n/messages/en.json`、`README.md`
- **依赖**：新增 `feed` npm 包（RSS/Atom/JSON feed 生成器，High reputation，内置 XML 转义与日期格式化）
- **构建产物**：`/zh/feed.xml`、`/en/feed.xml` 两个静态 XML 文件；`/feed.xml` 经 middleware 307 重定向
- **无破坏性变更**：所有新增均为独立路由与组件，不影响现有页面渲染、SEO 元数据或 SSG 行为
- **关键约束**：Next.js 16 的 GET Route Handler 默认 dynamic（v15+ 变更），必须显式 `generateStaticParams` 才能静态化；`proxy.ts` matcher 修改需 `pnpm format-lint` 后验证未被 Prettier 改写为 `String.raw`（SonarQube String.raw 规则已禁用，风险降低）
