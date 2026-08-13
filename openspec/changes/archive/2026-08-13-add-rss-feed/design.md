## Context

博客已有完整的 SEO 基础设施（`app/sitemap.ts`、`app/robots.ts`、`lib/seo.ts` 集中 URL 构建与 JSON-LD），文章数据通过 `lib/posts.ts` 的 `getAllPosts(lang)` 在构建时静态化（SSG 安全，`fs.readFileSync` 不破坏静态渲染）。i18n 通过 `proxy.ts`（next-intl middleware）实现 locale 检测，优先级为路径前缀 → `NEXT_LOCALE` cookie → `Accept-Language` → `defaultLocale`。现有 matcher 排除所有含点的路径（`/((?!api|_next|_vercel|.*\\..*).*)`），因此 `/feed.xml` 当前不经过 middleware。

关键约束：Next.js 16 的 GET Route Handler 默认 dynamic（v15.0.0-RC 变更），必须显式 `generateStaticParams` 才能静态化；`proxy.ts` matcher 是脆弱点（Prettier 可能将正则字符串改写为 `String.raw`，但 SonarQube String.raw 规则已禁用）。

## Goals / Non-Goals

**Goals:**

- 为每个 locale 生成构建时静态化的 RSS 2.0 feed，零运行时开销
- 根 `/feed.xml` 复用 next-intl locale 检测，与 `/` 行为一致
- RSS 阅读器能通过 `<link rel="alternate" type="application/rss+xml">` 自动发现 feed
- Header 提供可见的 RSS 订阅入口，桌面与移动端均可访问
- 集中 feed 构建逻辑到 `lib/feed.ts`，与 `lib/seo.ts` 风格一致

**Non-Goals:**

- Atom / JSON Feed 格式（`feed` 库支持，但 MVP 仅做 RSS 2.0，后续可扩展）
- 全文 feed（`<content:encoded>`）——需运行 MDX 编译器将 markdown 转 HTML，复杂度高，MVP 仅用 frontmatter `description`
- 分类级 / 标签级 feed（如 `/zh/categories/frontend/feed.xml`）——MVP 仅做全站 feed
- RSS 阅读器订阅统计 / 分析
- feed 缓存策略（构建时静态化，CDN 缓存由 Vercel 处理）

## Decisions

### Decision 1: 用 `feed` 库生成 XML 而非手写模板字符串

**选择**：`feed` npm 包（`import { Feed } from 'feed'`）

**替代方案**：手写 XML 模板字符串

**理由**：RSS 2.0 的 RFC 2822 日期格式（`Tue, 12 Aug 2026 00:00:00 GMT`）与 XML 实体转义（`&`/`<`/`>`/`"`/`'`）是真实坑点，手写易遗漏。`feed` 库（High reputation，242 code snippets，benchmark 88.86）内置处理，API 简洁（`new Feed({...})` + `addItem({...})` + `rss2()`）。项目已有同类"让库处理细节"依赖（gray-matter、fuse.js、github-slugger），风格一致。`feed` 库同时支持 Atom/JSON Feed，未来扩展无需换库。

### Decision 2: Route Handler `app/[lang]/feed.xml/route.ts` 而非构建脚本

**选择**：Next.js Route Handler + `generateStaticParams`

**替代方案**：(a) prebuild 脚本生成 `public/feed.xml`；(b) 自定义 `app/feed.xml/route.ts` 单一 handler

**理由**：Route Handler 是 Next.js 官方文档推荐的 RSS 实现方式（`app/rss.xml/route.ts` 示例）。`generateStaticParams` 返回 `[{lang:'zh'},{lang:'en'}]` 让 Next.js 在构建时为每个 locale 预渲染 feed，与 `sitemap.ts`/`robots.ts` 的静态化机制一致。`dynamicParams = false` 让未知 locale 返回 404。方案 (a) 脱离 Next.js 体系，无法复用 `lib/posts.ts` 的模块级缓存；方案 (b) 无法实现每语言独立 feed。

### Decision 3: 根 `/feed.xml` 通过 middleware matcher 重定向，而非 Route Handler 手动检测

**选择**：`proxy.ts` matcher 数组追加 `'/feed.xml'`，让 next-intl middleware 处理 locale 检测与 307 重定向

**替代方案**：`app/feed.xml/route.ts` Route Handler 手动读 `NEXT_LOCALE` cookie + 解析 `Accept-Language`

**理由**：next-intl middleware 已实现完整的 locale 检测优先级（cookie → Accept-Language → defaultLocale），方案 B 需重写一遍且可能引入 q 值解析 bug。方案 A 零逻辑重复，与 `/` → `/{locale}` 行为完全一致。307（临时重定向）比 308 更合适——用户切换语言偏好后下次请求重新检测，避免 HTTP 客户端永久缓存锁死语言。风险在于 matcher 修改，但新增 `'/feed.xml'`（无反斜杠）本身安全，SonarQube String.raw 规则已禁用，`pnpm format-lint` 后验证即可。

### Decision 4: feed 条目仅含 `description`，不含正文

**选择**：`<item>` 仅含 frontmatter `description`，不含 `<content:encoded>`

**替代方案**：含全文 `<content:encoded>`（需 MDX → HTML 编译）

**理由**：`PostMeta.content` 是原始 markdown（frontmatter 已剥离），转 HTML 需运行 MDX 编译器（remark/rehype pipeline），复杂度高且构建时间增加。`description` 字段本就为 SEO/列表摘要设计，长度适中。全文 feed 可作为后续增强（需 MDX→HTML 编译，与 `PostLayout` 的渲染逻辑共享）。

### Decision 5: 条目数量上限 20

**选择**：`.slice(0, 20)`

**替代方案**：(a) 全部文章；(b) 可配置数量

**理由**：`getAllPosts` 已按 `publishedTime` 降序返回，`.slice(0, 20)` 即可。当前文章少时无差异，未来文章多时保持 feed 体积合理（RSS 标准实践）。可配置数量需在 `content/site.yaml` 新增字段，MVP 无必要。

### Decision 6: `<item>` 的 `<category>` 使用本地化名称而非 ID

**选择**：通过 `lib/taxonomy.ts` 的 `getCategory(id, locale)` 与 `getTag(id, locale)` 将 ID 转为本地化名称

**替代方案**：直接使用 category/tag ID

**理由**：RSS 阅读器展示 `<category>` 给用户，本地化名称比 ID 友好（`前端开发` vs `frontend`）。`lib/taxonomy.ts` 已提供 `getCategory`/`getTag` 函数，`lib/search.ts` 已有同类"预本地化"模式（SearchIndexItem 中 category/tag 名称预本地化）。`lib/feed.ts` 作为 server-only 模块可直接 import taxonomy。

### Decision 7: RSS 按钮使用原生 `<a>` 而非 `next-intl/navigation` `Link`

**选择**：原生 `<a href="/{locale}/feed.xml">`

**替代方案**：`next-intl/navigation` `Link` 或 HeroUI `Link`

**理由**：feed 是 Route Handler 返回的 XML 文件，不是 App Router 页面。`next-intl/navigation` `Link` 做客户端路由跳转（RSC 请求），对 `.xml` 路由可能报错或行为异常。原生 `<a>` 让浏览器直接请求 XML，符合 RSS 订阅的预期行为（点击下载/打开 XML，而非 SPA 导航）。需手动拼 `/${locale}/feed.xml`，但 `RssButton` 作为 server component 可从 props 获取 `locale`。

### Decision 8: `lib/feed.ts` 作为 server-only 模块集中 feed 构建逻辑

**选择**：`lib/feed.ts` 导出 `buildRssFeed(locale): string`，`import 'server-only'`

**替代方案**：在 Route Handler 内联 feed 构建逻辑

**理由**：与 `lib/seo.ts`（集中 URL 构建 + JSON-LD）、`lib/posts.ts`（集中文章读取）、`lib/taxonomy.ts`（集中分类标签）的模块化风格一致。`buildRssFeed` 复用 `lib/posts.ts` 的 `getAllPosts`、`lib/taxonomy.ts` 的 `getCategory`/`getTag`、`lib/seo.ts` 的 `buildPostUrl`，集中后 Route Handler 只需调用一行。`server-only` 防止客户端组件误导入。

### Decision 9: auto-discovery link 通过 `alternates.types` 注入

**选择**：`app/[lang]/layout.tsx` 的 `generateMetadata` 增加 `alternates.types['application/rss+xml']`

**替代方案**：在 `app/[lang]/layout.tsx` 的 JSX 中手写 `<link>` 标签

**理由**：Next.js 16 文档确认 `metadata.alternates.types['application/rss+xml']` 会生成对应的 `<link rel="alternate" type="application/rss+xml">` 标签，与 `metadataBase` 集成自动解析绝对 URL。手写 `<link>` 需手动处理 URL 拼接且绕过 Next.js metadata 体系。现有 locale layout 已有 `generateMetadata` 返回 `alternates.languages`（hreflang），新增 `alternates.types` 是自然扩展。

## Risks / Trade-offs

- **[Risk] `proxy.ts` matcher 修改破坏现有 middleware 行为** → 新增 `'/feed.xml'` 到 matcher 数组末尾，不修改现有正则字符串。`pnpm format-lint` 后检查 `proxy.ts` 确认未被 Prettier 改写。SonarQube String.raw 规则已禁用，风险降低。dev server 实测 `/feed.xml` 确实 307 重定向。

- **[Risk] `feed` 库与 TypeScript 6.0.3 不兼容** → `pnpm add feed` 后立即 `pnpm build` 验证无类型错误。`feed` 库文档示例均为 TypeScript，类型定义随包提供，预期兼容。若不兼容，回退到手写 XML 模板字符串（需手动处理 RFC 2822 日期与 XML 转义）。

- **[Risk] Next.js 16 GET Route Handler 默认 dynamic 导致 feed 非静态化** → 显式 `export function generateStaticParams()` 返回所有 locale，并在 `next build` 输出中确认 `/zh/feed.xml` 与 `/en/feed.xml` 标记为 `○`（静态）而非 `ƒ`（动态）。

- **[Trade-off] 仅摘要 feed 降低订阅者体验** → 全文 feed 需 MDX→HTML 编译，MVP 阶段摘要 feed 已满足"通知订阅者有新文章"的核心目标。摘要引导流量回站，对单作者博客反而有利。

- **[Trade-off] 307 重定向而非 308** → 307 每次请求都重新检测 locale，对 RSS 阅读器有轻微开销（多一次重定向），但避免用户切换语言偏好后被 308 永久缓存锁死。RSS 阅读器通常低频抓取（每小时一次），开销可忽略。

- **[Trade-off] 无分类/标签级 feed** → MVP 仅全站 feed，分类/标签级 feed 可后续按需添加（Route Handler 可扩展为 `app/[lang]/categories/[categoryId]/feed.xml/route.ts`）。

## Migration Plan

无数据迁移。部署步骤：

1. `pnpm add feed` 安装依赖
2. 实现 `lib/feed.ts`、`app/[lang]/feed.xml/route.ts`、`components/layout/RssButton.tsx`
3. 修改 `proxy.ts`、`app/[lang]/layout.tsx`、`Header.tsx`、`MobileHeader.tsx`、i18n messages
4. `pnpm format-lint` 验证代码风格
5. `pnpm build` 验证静态化（`/zh/feed.xml`、`/en/feed.xml` 标记为 `○`）
6. dev server 实测 `/feed.xml` 307 重定向、`/zh/feed.xml` 返回有效 RSS XML、页面源码含 auto-discovery link
7. 提交 PR，Vercel preview 部署后用 RSS 阅读器（如 Feedly）订阅验证

**回滚**：`git revert` 合并提交即可，无数据库/配置文件迁移，无破坏性变更。

## Open Questions

无。所有决策点已在探索阶段与用户确认。
