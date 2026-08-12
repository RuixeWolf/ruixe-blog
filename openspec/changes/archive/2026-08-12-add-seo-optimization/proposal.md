## Why

博客当前仅有基础元数据（title、description、OpenGraph 基础字段），缺少搜索引擎可发现性与社交分享所需的完整 SEO 能力：无 sitemap.xml、无 robots.txt、无结构化数据（JSON-LD）、无社交分享图、文章详情页的 `hreflang` 错误指向 locale 首页而非同篇文章的其他语言版本。这导致搜索引擎难以高效抓取与索引，社交平台分享时无缩略图，且多语言文章的语言对应关系对爬虫不明确。需求文档 Phase 3 明确要求"实现 SEO 优化，包含 sitemap 等功能"，且网站图标与 OpenGraph 图片素材已制作完成（位于 `.temp/`），现在补齐 SEO 能力是上线的必要前提。

## What Changes

- **新增 `app/sitemap.ts`**：构建时生成全站 sitemap.xml，包含所有 locale 的首页、文章列表、关于页、分类页、标签页、文章详情页 URL；文章页含 `alternates.languages`（hreflang 信号）；文章页 `lastModified` 用 frontmatter 的 `modifiedTime ?? publishedTime`，静态页用构建时间
- **新增 `app/robots.ts`**：生成 robots.txt，全站 `Allow`，引用 sitemap.xml
- **新增网站图标资源**：将 `.temp/app-icon.png` 复制为 `app/icon.png` 与 `app/apple-icon.png`；`.temp/opengraph-image.png` 复制为 `app/opengraph-image.png`（默认 OG 图，兜底所有非文章页面）
- **新增文章详情页动态 OG 图** `app/[lang]/posts/[slug]/opengraph-image.tsx`：用 `next/og` 的 `ImageResponse` 在构建时为每篇文章生成专属社交分享图（站点名 + 文章标题 + 分类 + 日期），中文用 Noto Sans SC 子集字体，拉丁文用 Geist SemiBold
- **新增字体资源** `assets/`：Noto Sans SC 子集（Regular + Bold，常用汉字 3500 字）、Geist SemiBold ttf、OFL 许可证文本
- **新增 `lib/seo.ts`**：集中 SEO 构建逻辑（URL 生成函数、JSON-LD 构建函数），server-only 模块
- **修改 `app/layout.tsx`**：补充 `twitter` card 配置（`summary_large_image`），渲染 `WebSite` + `Person` JSON-LD
- **修改 `app/[lang]/layout.tsx`**：补充 canonical 策略与 `Person` JSON-LD 注入点
- **修改 `app/[lang]/page.tsx` 与 `app/[lang]/posts/page.tsx`**：补充缺失的 `generateMetadata`（标题 + 描述）
- **修改 `app/[lang]/posts/[slug]/page.tsx`**：修复 `alternates.languages`（只声明存在的语言版本，而非错误的 locale 首页）、补充 `alternates.canonical`、补充 `openGraph.locale`（修复 metadata 浅合并导致的丢失）、渲染 `BlogPosting` JSON-LD
- **修改 `app/[lang]/categories/[categoryId]/page.tsx` 与 `app/[lang]/tags/[tagId]/page.tsx`**：补充 `alternates.canonical`、渲染 `BreadcrumbList` JSON-LD
- **修改 `app/[lang]/about/page.tsx`**：补充 `alternates.canonical`、渲染 `Person` JSON-LD（详细版）

## Capabilities

### New Capabilities

- `seo`: SEO 优化子系统 - 定义 sitemap.xml 生成（含 hreflang）、robots.txt 生成、Open Graph 图片（默认 + 文章动态）、Twitter Card 配置、结构化数据（JSON-LD：WebSite / Person / BlogPosting / BreadcrumbList）、canonical URL 与 hreflang alternates 声明、网站图标资源

### Modified Capabilities

- `mdx-content`: 文章详情页的 SEO 元数据行为变更 - `alternates.languages` MUST 只声明实际存在的语言版本（当前错误地指向 locale 首页 `/zh` `/en` 而非文章 URL `/zh/posts/<slug>`）；文章页 `generateMetadata` MUST 显式声明 `alternates.canonical` 与 `openGraph.locale`（修复 metadata 浅合并导致的字段丢失）

## Impact

- **代码**：
  - 新增：`app/sitemap.ts`、`app/robots.ts`、`app/opengraph-image.png`、`app/icon.png`、`app/apple-icon.png`、`app/[lang]/posts/[slug]/opengraph-image.tsx`、`lib/seo.ts`
  - 修改：`app/layout.tsx`、`app/[lang]/layout.tsx`、`app/[lang]/page.tsx`、`app/[lang]/posts/page.tsx`、`app/[lang]/posts/[slug]/page.tsx`、`app/[lang]/categories/[categoryId]/page.tsx`、`app/[lang]/tags/[tagId]/page.tsx`、`app/[lang]/about/page.tsx`
- **资源**：`assets/NotoSansSC-Regular.subset.ttf`、`assets/NotoSansSC-Bold.subset.ttf`、`assets/Geist-SemiBold.ttf`、`assets/OFL.txt`（字体文件提交到 Git，是构建依赖而非二进制媒体）
- **依赖**：无新增 npm 依赖。`next/og` 的 `ImageResponse` 已内置于 Next.js 16；字体子集化用 `pyftsubset`（fonttools，本地一次性操作，不在项目依赖中）
- **构建行为**：`sitemap.ts`、`robots.ts`、`opengraph-image.tsx` 均在构建时静态化，不引入动态渲染，全路由保持 `● (SSG)`（需 `pnpm build` 核验）。动态 OG 图在构建时为每篇文章生成一张 PNG，构建耗时增加可接受（文章数量有限）
- **向后兼容**：无破坏性变更。当前无 sitemap/robots，新增后纯增量。文章详情页的 `alternates.languages` 修复是行为修正，对外部爬虫是改善而非破坏
- **字体许可**：Noto Sans SC 与 Geist 均为 SIL Open Font License 1.1，`assets/OFL.txt` 保留许可证文本
- **Server/client 边界**：`lib/seo.ts` 加 `import 'server-only'`（消费 `siteConfig`）；JSON-LD 在 RSC 组件中渲染 `<script type="application/ld+json">`，不涉及 client 组件；`opengraph-image.tsx` 是特殊 Route Handler，运行在 Node.js runtime
- **已知坑点**：metadata 浅合并导致嵌套对象（`openGraph`、`alternates`）整体替换而非深合并，文章页 `generateMetadata` MUST 显式带上所有需要的 `openGraph` 字段（含 `locale`），否则丢失 locale layout 的 `openGraph.locale`
