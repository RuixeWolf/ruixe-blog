## Context

当前博客已有基础元数据（`app/layout.tsx` 的 `metadata`、locale layout 的 `generateMetadata`、5 个页面的 `generateMetadata`），但缺少 sitemap/robots/结构化数据/社交分享图，且文章详情页的 `alternates.languages` 错误地继承 locale layout 的 `{ zh: /zh, en: /en }`（指向 locale 首页而非文章 URL）。网站图标与默认 OG 图素材已制作完成（位于 `.temp/`）。Next.js 16 的元数据文件约定（`sitemap.ts`、`robots.ts`、`opengraph-image.tsx`、`icon.png`）在构建时静态化，不破坏全路由 SSG。

关键约束：Next.js metadata 是**浅合并**（嵌套对象如 `openGraph`、`alternates` 整体替换而非深合并），子页面返回 `openGraph` 会覆盖父布局的 `openGraph.locale`；`ImageResponse` 的 500KB bundle 限制不适用于 `readFile` 运行时加载的字体（但完整 CJK 字体 5-10MB 会拖慢构建，需子集化）；动态 OG 图在构建时为每个 `generateStaticParams` 产生的参数组合静态生成一张 PNG。

## Goals / Non-Goals

**Goals:**

- 让搜索引擎能通过 sitemap.xml 发现全站 URL，通过 robots.txt 确认可抓取范围
- 让社交平台分享时显示带缩略图的大图卡片（Twitter `summary_large_image` + OG 图）
- 通过 JSON-LD 结构化数据让搜索引擎理解内容类型（文章、面包屑、作者）
- 修复文章详情页的 hreflang，正确声明同篇文章多语言对应关系
- 每个页面有明确的 canonical URL，避免重复内容问题
- 文章详情页有专属动态 OG 图（含标题），其他页面有默认 OG 图兜底
- 集中 SEO 构建逻辑到 `lib/seo.ts`，避免多处重复

**Non-Goals:**

- RSS / llms.txt / PWA（需求文档列为独立 Phase 3 项目，本变更不涵盖）
- 搜索引擎主动提交（Google Search Console / Bing Webmaster Tools 配置，属运维操作非代码）
- 文章 frontmatter 新增字段（如 `ogImage` 自定义图、`noindex` 标记）
- 多 sitemap 分文件（sitemap index），当前文章数少无需
- 动态 OG 图的运行时按需生成（本变更用构建时静态化）
- 字体子集化的自动化脚本（子集化是本地一次性操作，不集成进构建流程）

## Decisions

### Decision 1: 用 Next.js 元数据文件约定而非 Route Handler

**选择**：`app/sitemap.ts`、`app/robots.ts`、`app/opengraph-image.tsx`（文件约定）

**替代方案**：自定义 `app/sitemap.xml/route.ts` Route Handler

**理由**：文件约定是 Next.js 官方推荐方式，自动处理 Content-Type、缓存、与 `metadataBase` 集成，代码量更少。文档确认这些约定在构建时静态化（除非用 request-time API），不破坏 SSG。

### Decision 2: sitemap 单文件，含 hreflang alternates

**选择**：单个 `app/sitemap.ts` 生成所有 URL，文章页用 `alternates.languages` 字段声明 hreflang

**替代方案**：sitemap index + 分文件（posts/taxonomy/static）；或不在 sitemap 内嵌 hreflang，仅靠 HTML `<link rel=alternate>`

**理由**：文章数少（目前 1 篇），分文件是过早优化。文档确认 `MetadataRoute.Sitemap` 支持 `alternates.languages`，生成 `<xhtml:link rel="alternate" hreflang>` 标签，是多语言 sitemap 的标准做法。HTML `<link>` 与 sitemap hreflang 互补不冲突。

### Decision 3: OG 图策略 - 默认静态图 + 文章动态图

**选择**：`app/opengraph-image.png`（静态默认）+ `app/[lang]/posts/[slug]/opengraph-image.tsx`（动态文章图）

**替代方案**：全站只用静态默认图；或所有页面都用动态图

**理由**：默认静态图已制作完成，零运行时开销，兜底非文章页面。文章页动态图含标题，社交分享效果显著提升，且 `ImageResponse` 构建时静态化，运行时无开销。文件约定优先级（最近段胜出）使文章页的 tsx 自动覆盖根 png，无需在 metadata 里设 `openGraph.images`。

### Decision 4: 动态 OG 图字体 - Noto Sans SC 静态子集 + Geist SemiBold

**选择**：`assets/NotoSansSC-Regular.subset.ttf` + `assets/NotoSansSC-Bold.subset.ttf`（常用汉字 3500 字子集）+ `assets/Geist-SemiBold.ttf`（拉丁文），module scope `readFile` 加载

**替代方案**：

- (a) 完整 Noto Sans SC（5-10MB，`opentype.parse` 拖慢构建）
- (b) 构建时动态子集化（按文章标题字符裁剪，需 Python + fonttools 集成进构建）
- (c) 只用 Noto Sans SC 不加 Geist（拉丁字形不如 Geist 好看）
- (d) 运行时 `fetch` Google Fonts（网络依赖，不稳定）

**理由**：静态子集是本地一次性操作（`pyftsubset`），零构建流程复杂度；3500 常用字覆盖 99%+ 文章标题；Geist 与站点字体一致；module scope `readFile` 只读一次，字体不挤占 500KB bundle 限额。生僻字 fallback 风险可接受（概率极低，且只影响社交缩略图）。

### Decision 5: JSON-LD 通过组件 JSX `<script>` 注入

**选择**：在 RSC 组件 JSX 中渲染 `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />`

**替代方案**：通过 `metadata.other` 字段注入

**理由**：Next.js 官方推荐在组件中渲染 JSON-LD，更直观、支持 RSC、易调试。`metadata.other` 不支持结构化对象。JSON-LD 构建逻辑集中在 `lib/seo.ts` 的纯函数，组件只负责序列化与渲染。

### Decision 6: JSON-LD 范围 - 标准集

**选择**：`WebSite`（全局）+ `Person`（关于页 + 文章 author）+ `BlogPosting`（文章详情页）+ `BreadcrumbList`（分类/标签/文章页）

**替代方案**：最小集（仅 WebSite + BlogPosting）；或完整集（额外 WebPage、ItemList）

**理由**：标准集覆盖 Google rich result 主要场景（文章 rich result、面包屑、作者），又不至于过度工程化。`ItemList` 对文章列表页收益低（Google 对列表页 rich result 支持有限）。

### Decision 7: `lib/seo.ts` 集中 SEO 构建逻辑

**选择**：新建 `lib/seo.ts`（`server-only`），导出 URL 生成函数与 JSON-LD 构建函数，均为纯函数

**替代方案**：在各页面/sitemap 内联 SEO 逻辑

**理由**：避免在 sitemap、各页面 `generateMetadata`、JSON-LD 注入处重复 URL 构建与 Schema.org 对象构建逻辑。纯函数设计便于测试，数据由调用方从 `lib/posts`/`lib/taxonomy` 获取，`lib/seo.ts` 不读文件系统。

### Decision 8: 文章 alternates 只声明存在的语言版本

**选择**：文章详情页 `generateMetadata` 通过 `getPostBySlug(slug, otherLocale)` 检查其他语言是否存在，只声明存在的语言版本的 `alternates.languages`

**替代方案**：声明所有 locale（当前错误行为）

**理由**：声明不存在的语言版本 URL 会让爬虫爬到 404，是 SEO 反模式。`getPostBySlug` 已存在，返回 null 即表示文件不存在。非文章页面（首页/列表/分类/标签/关于）对所有 locale 都存在，继承 locale layout 的 alternates 即可。

### Decision 9: 非文章页面 lastModified 用构建时间

**选择**：sitemap 中非文章页面的 `lastModified` 用 `new Date()`

**替代方案**：用 Git 最后提交时间；或用固定日期

**理由**：SSG 构建时 `new Date()` 被固化为构建时刻，可接受。Git 时间需额外依赖与构建时 Git 调用，复杂度高。文章页用 frontmatter 日期更有意义（内容变更信号）。

## Risks / Trade-offs

- **[字体子集生僻字 fallback]** -> Noto Sans SC 子集仅含 3500 常用汉字，文章标题含生僻字时该字在 OG 图渲染为方块。缓解：用 GB2312 常用字集覆盖 99%+ 场景；构建后目测检查 OG 图；遇生僻字可重新裁剪扩大字符集（一次性操作）。

- **[metadata 浅合并导致字段丢失]** -> 文章页 `generateMetadata` 返回 `openGraph` 会覆盖 locale layout 的 `openGraph.locale`。缓解：文章页 `generateMetadata` 显式带全 `openGraph` 字段（含 `locale`）；spec 中明确此约束。

- **[动态 OG 图构建耗时]** -> `ImageResponse` 为每篇文章×locale 生成一张 PNG，字体 `opentype.parse` 有开销。缓解：OG 图构建时静态化，运行时无开销；文章数有限（个人博客）；字体子集化减小解析量。

- **[单语言文章 alternate 处理]** -> 文章只存在一个 locale 时，错误声明另一 locale 的 alternate 会导致爬虫爬 404。缓解：`generateMetadata` 通过 `getPostBySlug` 检查存在性，spec 中明确"只声明存在的语言版本"。

- **[字体许可合规]** -> Noto Sans SC 与 Geist 是 OFL 1.1 许可，需保留许可证文本。缓解：`assets/OFL.txt` 提交到 Git，README 标注字体来源。

- **[`metadataBase` 在 preview deploy]** -> preview URL 与 prod 不同，OG 图/ canonical URL 会指向 preview 域。缓解：已有 `NEXT_PUBLIC_SITE_URL` 环境变量机制，preview 与 prod 各自配置，可接受。

- **[图标资源透明背景]** -> `app/apple-icon.png` 若有透明背景，iOS 会强制黑底。缓解：素材制作时确保实心背景方形图；实现阶段放置前检查。

## Migration Plan

本变更是纯增量（新增 sitemap/robots/JSON-LD/OG 图）+ 行为修正（文章 alternates 修复），无数据迁移与破坏性变更。

**部署步骤**：

1. 合并 PR 后 Vercel 自动构建部署
2. 构建时生成 sitemap.xml、robots.txt、各文章 OG 图
3. 部署后访问 `https://ruixe-blog.vercel.app/sitemap.xml` 与 `/robots.txt` 验证
4. 用 Google Rich Results Test 验证文章页 JSON-LD
5. 用社交平台调试器（Facebook Sharing Debugger / Twitter Card Validator）验证 OG 图

**回滚**：本变更不涉及数据迁移，回滚即 `git revert`，无副作用。

## Open Questions

无。所有技术决策已在 explore 阶段与用户确认锁定。
