# Proposal

## Why

2026-09-30 SEO 审计（issue #30）在线上实测发现 11 项元数据缺陷（6 项 P0、2 项 P1、3 项 P2），全部源自同一个根因：Next.js 16 的 `mergeMetadata` 对 `alternates` / `openGraph` / `twitter` 三个顶层键是**无条件整体替换**（`resolve-metadata.js` 源码已核实），没有任何深合并。结果是一个碎片化的继承链——首页与列表页缺 canonical、`/zh/posts` 的 hreflang 错误指向首页、关于/分类/标签页写 canonical 时丢掉全部 hreflang、这些页面的社交卡片降级为英文站点默认值、文章页 Twitter 卡片显示站点名而非文章标题、`og:locale` 输出不合规的 `"zh"`、`BlogPosting` JSON-LD 缺 `image` 且日期无时区。这些缺陷直接削弱 hreflang 标注组的可信度与社交分享体验，且每多一个页面就多一处手工 alternates 拼装出错的机会。

## What Changes

- **`lib/seo.ts` 成为 alternates/openGraph 的唯一构造点**：新增 `buildAlternates(path, locale)`（canonical + languages + RSS types，首页附 `x-default`）、`buildOpenGraph({...})`（全量 og，含 locale 映射与默认图）、`toOgLocale`（`zh` → `zh_CN`、`en` → `en_US`）、`toIsoDateTime`（`YYYY-MM-DD` → `T00:00:00+08:00`）；`buildBlogPostingJsonLd` 补 `image`（动态 OG 图 URL，无 hash 直达已实测 200 image/png）与时区化日期
- **每个页面的 `generateMetadata` 显式调用 helper**：首页补 canonical + x-default；`/posts` 修正 hreflang 与 `og:url`；关于/分类/标签页补完整 languages 与页面级 openGraph（标题、url、locale）
- **布局瘦身防再犯**：`app/[lang]/layout.tsx` 的 `alternates` 移除 `languages`（对一切非首页页面它本来就是错值，仅保留 `types` 作 RSS 自动发现兜底）；`twitter` 瘦身为 `{ card, creator }`，title/description 依赖 X 爬虫对 `og:*` 的官方回退
- **`og:locale` 合规化**：输出 `zh_CN` / `en_US`，并声明 `og:locale:alternate`（另一语言）
- **sitemap 与 HTML 信号一致**：非文章条目补 `alternates.languages`（首页条目含 `x-default`），消除「半套」标注
- **`og:locale:alternate` 与文章页 `localeAlternate`**：文章页 og 经同一映射函数输出

已确认决策：x-default 仅首页 → 无前缀根路径 `/`（依赖 `proxy.ts` 的 locale 协商重定向，符合 Google 2026-09 对自动重定向首页的建议）；Twitter 采用布局瘦身 + og 回退（一处改动全站生效）；JSON-LD 时区按作者时区 `+08:00` 拼接。

## Capabilities

### New Capabilities

（无——全部为现有 `seo` 能力的 requirement 修订）

### Modified Capabilities

- `seo`: 修订 6 条 requirement——
  1. **canonical URL 与 hreflang alternates**：每页 MUST 显式调用统一 helper；首页组含 `x-default`；布局 MUST NOT 提供 `languages`；`og:locale` scenario 由 `content="zh"` 改为 `zh_CN`/`en_US`
  2. **Open Graph 图片**：「MUST NOT 设置 `openGraph.images`」细化为仅限有同段文件约定的文章页；其他页面定义 `openGraph` 时 MUST 内置默认图（整体替换会冲掉父段注入）
  3. **Twitter Card 配置**：布局仅保留 `{ card, creator }`，页面级标题/描述经 `og:*` 回退获得
  4. **结构化数据（JSON-LD）**：`BlogPosting` MUST 含 `image` 与带时区的 ISO 8601 日期
  5. **SEO 构建模块**：新增 helper 的纯函数约束
  6. **sitemap.xml 生成**：非文章条目 MUST 声明 `alternates.languages`（首页含 `x-default`）

## Impact

- **代码**：`lib/seo.ts`（新增 helper、扩展 JSON-LD 构建函数）、`app/[lang]/layout.tsx`、`app/[lang]/page.tsx`、`app/[lang]/posts/page.tsx`、`app/[lang]/about/page.tsx`、`app/[lang]/categories/[categoryId]/page.tsx`、`app/[lang]/tags/[tagId]/page.tsx`、`app/[lang]/posts/[slug]/page.tsx`、`app/sitemap.ts`
- **对外行为**：仅 `<head>` 输出更完整正确（canonical/hreflang/og/twitter/JSON-LD）；无 URL 结构变化、无依赖变更、无 breaking change
- **不改动**：RSS feed 内容、robots meta、IndexNow、空 taxonomy 过滤、`<time>` 语义化（分属 `seo-index-infrastructure` 与 `seo-semantics-and-docs` 两个 change）
