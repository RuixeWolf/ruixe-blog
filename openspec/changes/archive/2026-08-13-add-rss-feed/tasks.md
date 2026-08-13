# Implementation Tasks: add-rss-feed

> 任务拆分为 6 个阶段，每阶段可由独立 AI Session 执行。阶段间存在依赖，需按顺序执行。每个任务标注了依赖前置任务号。
>
> **约定**：每个任务完成后运行 `pnpm format-lint` 验证代码风格，相关任务末尾标注验证步骤。所有新增 `lib/` 模块须 `import 'server-only'`。

## 1. 依赖安装与基础准备

- [x] 1.1 运行 `pnpm add feed` 安装 `feed` 库（RSS/Atom/JSON feed 生成器）。验证 `package.json` 的 `dependencies` 含 `"feed": "^x.x.x"`，`pnpm-lock.yaml` 已更新。
- [x] 1.2 运行 `pnpm build` 验证 `feed` 库与 TypeScript 6.0.3 兼容（无类型错误）。若构建失败，记录错误并回退到手写 XML 模板方案（见 design.md Decision 1 替代方案）。
- [x] 1.3 通过 Context7 MCP（`/jpmonette/feed`）或 `node_modules/feed` 类型定义，确认 `Feed` 类构造函数、`addItem`、`rss2()` 方法的 TypeScript 签名，供后续 `lib/feed.ts` 使用。

## 2. Feed 构建逻辑（lib/feed.ts）

> 依赖：阶段 1 完成。此阶段创建 server-only 模块，集中 RSS 构建逻辑。

- [x] 2.1 创建 `lib/feed.ts`，文件顶部 `import 'server-only'`。导入 `Feed` from `'feed'`、`getAllPosts` from `'@/lib/posts'`、`getCategory`/`getTag` from `'@/lib/taxonomy'`、`buildPostUrl`/`buildPageUrl` from `'@/lib/seo'`、`siteConfig` from `'@/lib/site-config'`、`type Locale` from `'@/i18n/routing'`。
- [x] 2.2 实现 `buildRssFeed(locale: Locale): string` 函数：
  - 创建 `new Feed({...})`，填入 `title: siteConfig.siteTitle`、`description: siteConfig.siteDescription`、`link: buildPageUrl('', locale)`（当前 locale 首页绝对 URL）、`id: buildPageUrl('', locale)`、`language: locale`、`image: siteConfig.siteUrl + '/opengraph-image.png'`、`favicon: siteConfig.siteUrl + '/favicon.ico'`、`updated: new Date()`（构建时间）、`feedLinks: { rss: buildFeedUrl(locale) }`、`author: { name: siteConfig.githubUsername, link: siteConfig.githubUrl }`、`copyright: '© {year} {siteConfig.siteTitle}'`。
  - 调用 `getAllPosts(locale).slice(0, 20)` 获取最新 20 篇文章。
  - 对每篇文章调用 `feed.addItem({...})`，填入 `title`、`id: buildPostUrl(post.slug, locale)`、`link: buildPostUrl(post.slug, locale)`、`description: post.description`、`date: new Date(post.publishedTime)`、`category` 数组（含 `getCategory(post.category, locale).name` 与 `post.tags.map(t => ({ name: getTag(t, locale).name }))`）。MUST NOT 包含 `content` 字段（仅摘要）。
  - 返回 `feed.rss2()`。
- [x] 2.3 在 `lib/feed.ts` 中新增辅助函数 `buildFeedUrl(locale: Locale): string`，返回 `/{locale}/feed.xml` 的绝对 URL（复用 `siteConfig.siteUrl` + `buildPageUrl` 模式，或直接 `siteConfig.siteUrl.replace(/\/$/, '') + '/' + locale + '/feed.xml'`）。此函数供 `Feed` 构造函数的 `feedLinks.rss` 与 `atom:link self` 使用。
- [x] 2.4 为 `buildRssFeed` 添加 JSDoc 注释，说明参数、返回值（RSS 2.0 XML 字符串）、复用的模块、条目数量上限（20）、条目内容策略（仅 description）。遵循项目 JSDoc 风格（见 `lib/posts.ts`、`lib/seo.ts`）。
- [x] 2.5 运行 `pnpm format-lint` 验证 `lib/feed.ts` 代码风格（import 排序、无分号、单引号、Tailwind 类排序不适用）。

## 3. Route Handler（app/[lang]/feed.xml/route.ts）

> 依赖：阶段 2 完成。此阶段创建 Route Handler，实现构建时静态化。

- [x] 3.1 创建目录 `app/[lang]/feed.xml/`，在其中创建 `route.ts`。
- [x] 3.2 在 `route.ts` 顶部导入 `type NextRequest` from `'next/server'`、`routing`/`type Locale` from `'@/i18n/routing'`、`buildRssFeed` from `'@/lib/feed'`。
- [x] 3.3 实现 `export function generateStaticParams()`，返回 `routing.locales.map((lang) => ({ lang }))`，使每个 locale 的 feed 在构建时预渲染。
- [x] 3.4 添加 `export const dynamicParams = false`，使未知 locale 返回 404 而非动态生成。
- [x] 3.5 实现 `export async function GET(request: NextRequest, { params }: { params: Promise<{ lang: string }> })`：
  - `await params` 获取 `lang`。
  - 调用 `buildRssFeed(lang as Locale)` 生成 XML 字符串。
  - 返回 `new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })`。
- [x] 3.6 为 `generateStaticParams` 与 `GET` 添加 JSDoc 注释，说明静态化策略、`dynamicParams = false` 的 404 行为、Content-Type 设置。
- [x] 3.7 运行 `pnpm build` 验证 `/zh/feed.xml` 与 `/en/feed.xml` 在构建输出中标记为 `○`（静态）而非 `ƒ`（动态）。若标记为 `ƒ`，检查是否遗漏 `generateStaticParams` 或引入了 request-time API。
- [x] 3.8 运行 `pnpm format-lint` 验证代码风格。

## 4. 根路径 locale 感知重定向（proxy.ts）

> 依赖：阶段 3 完成。此阶段修改 middleware matcher，让 `/feed.xml` 经过 next-intl locale 检测。

- [x] 4.1 读取 `proxy.ts` 当前内容，确认 matcher 为 `['/((?!api|_next|_vercel|.*\\..*).*)']`。
- [x] 4.2 修改 `proxy.ts` 的 `config.matcher` 数组，在现有正则字符串后追加 `'/feed.xml'`。最终 matcher 应为 `['/((?!api|_next|_vercel|.*\\..*).*)', '/feed.xml']`。MUST NOT 修改现有正则字符串。
- [x] 4.3 为 matcher 追加项添加注释说明：`'/feed.xml'` 让 next-intl middleware 对根 feed 路径执行 locale 检测（cookie → Accept-Language → defaultLocale）并 307 重定向到 `/{locale}/feed.xml`。
- [x] 4.4 运行 `pnpm format-lint`，然后重新读取 `proxy.ts` 验证 matcher 仍为纯字符串数组（未被 Prettier 改写为 `String.raw`）。SonarQube String.raw 规则已禁用，但需确认 Prettier 行为。
- [x] 4.5 启动 dev server（`pnpm dev`），用浏览器或 curl 测试：
  - 无 cookie + `Accept-Language: zh-CN` 请求 `/feed.xml` → 307 重定向到 `/zh/feed.xml`
  - 设置 `NEXT_LOCALE=en` cookie 请求 `/feed.xml` → 307 重定向到 `/en/feed.xml`
  - 直接请求 `/zh/feed.xml` → 200 返回 XML（不重定向）
- [x] 4.6 验证现有 middleware 行为未破坏：请求 `/` 仍正确重定向到 locale 首页，请求 `/zh/posts` 仍正常放行。

## 5. RSS 自动发现 link（app/[lang]/layout.tsx）

> 依赖：阶段 3 完成（feed 路由存在）。此阶段修改 locale layout 的 generateMetadata。

- [x] 5.1 读取 `app/[lang]/layout.tsx` 当前 `generateMetadata` 函数，确认现有 `alternates.languages`（hreflang）结构。
- [x] 5.2 在 `generateMetadata` 返回的 `alternates` 对象中新增 `types` 字段：`types: { 'application/rss+xml': \`/${locale}/feed.xml\` }`。注意 `locale` 变量已在函数内定义。`href`使用相对路径，Next.js 结合`metadataBase` 解析为绝对 URL。
- [x] 5.3 为 `alternates.types` 添加注释说明：生成 `<link rel="alternate" type="application/rss+xml">` 供 RSS 阅读器自动发现当前 locale 的 feed。
- [x] 5.4 运行 `pnpm format-lint` 验证代码风格。
- [x] 5.5 启动 dev server，访问 `/zh/posts/hello-world` 查看页面源码，确认 `<head>` 含 `<link rel="alternate" type="application/rss+xml" title="Ruixe Blog" href=".../zh/feed.xml">`。访问 `/en/about` 确认 href 为 `.../en/feed.xml`。

## 6. Header RSS 订阅入口（RssButton + Header/MobileHeader）

> 依赖：阶段 5 完成。此阶段创建 UI 组件并集成到 Header。

- [x] 6.1 在 `i18n/messages/zh.json` 的 `Header` 对象中新增 `"Rss": "RSS 订阅"`。在 `i18n/messages/en.json` 的 `Header` 对象中新增 `"Rss": "RSS Feed"`。注意保持 JSON 键顺序与现有风格一致。
- [x] 6.2 创建 `components/layout/RssButton.tsx`：
  - 文件顶部 `import 'server-only'`（与 `Header.tsx`、`NavLinks.tsx` 一致）。
  - 导入 `Button` from `'@heroui/react'`、`Rss` from `'lucide-react'`、`getTranslations` from `'next-intl/server'`、`type Locale` from `'@/i18n/routing'`。
  - 实现 `export async function RssButton({ locale }: Readonly<{ locale: Locale }>)`：
    - `const t = await getTranslations('Header')`
    - 渲染 HeroUI `Button` `isIconOnly` `variant="tertiary"` `as="a"`（或用 HeroUI `Link` 包装），`href={\`/${locale}/feed.xml\`}`，`aria-label={t('Rss')}`。
    - 内含 `<Rss className="size-5" aria-hidden="true" />`。
  - MUST 使用原生 `<a>` 行为（HeroUI `Button as="a"` 或 HeroUI `Link`），MUST NOT 使用 `next-intl/navigation` `Link`（feed 是 XML 文件非 App Router 页面）。
  - 添加 JSDoc 说明：server component、为何用原生 `<a>` 而非 next-intl Link、aria-label 来源。
- [x] 6.3 修改 `components/layout/Header.tsx`：
  - 导入 `RssButton` from `'./RssButton'`。
  - 在右侧功能栏 `<div className="flex items-center gap-2">` 中，`<SearchTrigger>` 之后、`<LanguageSwitcher>` 之前插入 `<RssButton locale={locale} />`。
  - 注意 `Header` 已有 `locale` prop（当前 `void locale`，需移除 `void` 或直接使用）。
- [x] 6.4 修改 `components/layout/MobileHeader.tsx`：
  - 读取当前内容，确认右侧功能栏结构（搜索 + 设置按钮）。
  - 导入 `RssButton`。
  - 在右侧功能栏搜索按钮之后、设置按钮之前插入 `<RssButton locale={locale} />`。
- [x] 6.5 运行 `pnpm format-lint` 验证代码风格（import 排序、Tailwind 类排序）。
- [x] 6.6 启动 dev server，桌面宽度访问 `/zh/posts` 确认 Header 右侧显示 RSS 图标按钮（搜索与语言切换之间）。移动宽度（<lg）访问确认 MobileHeader 右侧显示 RSS 按钮。
- [x] 6.7 点击 RSS 按钮确认浏览器导航到 `/{locale}/feed.xml`（非客户端路由跳转），显示 XML 内容。检查按钮 `aria-label` 在 zh/en 下分别为 `RSS 订阅` / `RSS Feed`。

## 7. 文档更新与最终验证

> 依赖：阶段 4-6 完成。此阶段更新文档并做端到端验证。

- [x] 7.1 更新 `README.md` 的功能列表，确认 RSS feed 行（已有 `📰 RSS feed`）描述准确，必要时补充 `/zh/feed.xml` 与 `/en/feed.xml` URL 示例。
- [x] 7.2 运行 `pnpm build` 完整构建，确认无错误、无警告。检查构建输出中 `/zh/feed.xml`、`/en/feed.xml` 标记为 `○`（静态）。
- [x] 7.3 端到端验证清单：
  - `/zh/feed.xml` 返回有效 RSS 2.0 XML（含 `<rss>`、`<channel>`、`<item>`，XML 声明为 `<?xml version="1.0" encoding="UTF-8"?>`）
  - `/en/feed.xml` 返回有效 RSS 2.0 XML，`<language>en</language>`
  - `/feed.xml` 无 cookie + `Accept-Language: zh` → 307 重定向到 `/zh/feed.xml`
  - `/fr/feed.xml` → 404
  - `/zh/posts/hello-world` 页面源码含 `<link rel="alternate" type="application/rss+xml" href=".../zh/feed.xml">`
  - 桌面 Header 与移动 MobileHeader 显示 RSS 图标按钮
  - feed 中 `<item>` 的 `<category>` 为本地化名称（如 `前端开发`）而非 ID（如 `frontend`）
  - feed 中 `<item>` 不含 `<content:encoded>`
  - sitemap.xml 不含 feed URL
  - robots.txt 不引用 feed URL
- [x] 7.4 运行 `pnpm format-lint` 最终验证。
