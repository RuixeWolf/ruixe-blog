# Design

## Context

Next.js 16 的 `mergeMetadata`（`node_modules/next/dist/lib/metadata/resolve-metadata.js:166-190`）对 `alternates` / `openGraph` / `twitter` 三个顶层键是无条件整体替换：子段定义了该键，父布局的同名键整体消失，没有深合并。当前代码各页面的 metadata 拼装方式不一致，在这个合并语义下产生了 issue #30 实测的全部 P0 缺陷：

| 页面                      | 现状                               | 缺陷                                                                                             |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| 首页 `page.tsx`           | 无 `generateMetadata`              | 无 canonical（继承布局 languages 恰巧指向首页，hreflang 碰巧正确）                               |
| `posts/page.tsx`          | 仅 title/description               | 无 canonical；hreflang 继承布局值 → 错误指向首页                                                 |
| about / categories / tags | `alternates: { canonical, types }` | `languages` 被整体替换吞掉；无页面级 og → 社交卡片降级为站点默认（英文描述、根 URL）             |
| `posts/[slug]/page.tsx`   | 完整 alternates + og               | `twitter` 未定义 → 继承布局的站点级 twitter（`twitter:title` = 站点名）；`og:locale` 输出裸 `zh` |

文件约定 OG 图的注入（`mergeStaticMetadata`，同文件 :126-158）只发生在**定义了图文件的段**且要求该段 metadata 未显式设置 `openGraph.images`——子段整体替换 `openGraph` 后，父段（根布局 `app/opengraph-image.png`）注入的图已被冲掉，子段自己没有图文件时 `og:image` 丢失。这是非文章页 helper 必须自带默认图的机制依据。

`og.title` / `twitter.title` 不受 `title.template` 污染：`titleTemplates.openGraph` 取自 `openGraph.title.template`（`resolve-metadata.js:805-808`），布局 og.title 是纯字符串 → 传播 null 模板 → 页面 og/twitter 标题为纯净值。这使「twitter 瘦身 + og 回退」方案可行。Next 服务端 `resolveTwitter` **不做** og 字段回填（`resolvers/resolve-opengraph.js:163-197` 已核实），回退完全依赖 X/Twitter 爬虫的官方文档行为。

`'x-default'` 键在 HTML（`metadata.js:431-448`，languages 键原样写入 `hrefLang`）与 sitemap（`resolve-route-data.js:117-118`，`for...in` 原样遍历渲染 `xhtml:link`）双侧均原生支持，无需任何 hack。

已实测：`https://blog.ruixe.net/zh/posts/my-first-blog-website/opengraph-image`（无 hash 直达）返回 200 / `image/png`——`BlogPosting.image` 可直接使用该稳定 URL。

## Goals / Non-Goals

**Goals:**

- `lib/seo.ts` 成为 `alternates` / `openGraph` 的唯一构造点，一处处长跑通、处处正确
- 每类页面的 `<head>` 输出满足 delta spec 的全部 scenario（canonical + 互指 hreflang + 页面级 og + 正确 twitter 回退 + JSON-LD 补强）
- 布局瘦身（去 languages、twitter 瘦身）把「新页面忘记调 helper」的失败模式从「静默指向首页的错值」变为「显式缺失」，后者可被验收脚本发现

**Non-Goals:**

- 不改 URL 结构、RSS feed 内容、robots meta、IndexNow、空 taxonomy 过滤、`<time>` 语义化（分属另外两个 change）
- 不做 `WebSite.inLanguage` / `Person.sameAs` 扩充（双语站点语义尴尬 / 需要用户提供平台清单，明确跳过）
- 不做 `lang="zh-Hans"`（现状态可接受）

## Decisions

### D1. x-default 仅首页 → 无前缀根路径 `/`

首页 languages 附 `'x-default': siteUrl`；其他页面与文章页一律不加。sitemap 仅首页条目同步声明。

- **理由**：贴合 Google 2026-09 文档对「自动重定向首页」场景的最低要求；`proxy.ts` 对 `/` 做_cookie → Accept-Language → zh_ 的协商重定向，正是该场景。X/Googlebot 跟随 307 后到达访客语言版本。
- **备选（否决）**：所有页面都加 x-default 指向无前缀等价路径（镜像 `buildSharePostPath` 模式）。否决原因：单 locale 文章的无前缀路径协商后会 404，需要 per-post 分支；307 中转对爬虫的增益有限；复杂度不成比例。

### D2. Twitter 修复 = 布局瘦身 + og 回退，而非每页显式 twitter

布局 twitter 从 `{ card, title, description, creator }` 瘦身为 `{ card, creator }`；所有页面不定义 `twitter`。

- **理由**：一处改动全站生效（文章、分类、标签、关于页同时修正）；X/Twitter 官方文档明确支持 `twitter:*` 缺失时回退 `og:*`；og 回退后的标题是纯净文章标题（见 Context，模板不污染）。
- **备选（否决）**：`lib/seo.ts` 增加 `buildTwitterMeta` helper、每页显式全量 twitter。否决原因：重复代码多（card/creator 每页重复声明），且与「og 已有完整页面级数据」的现状重复。

### D3. `buildAlternates(path, locale)` 以 path 为核心参数

`buildPageUrl` 的既有 path 约定（空串 = 首页）复用为 helper 的切换信号：`path === ''` 时附 x-default。languages 值为绝对 URL（`buildPageUrl(path, l)` 遍历 `routing.locales`），顺带消除布局现有 `routing.locales[0]/[1]` 硬编码。返回对象固定含 `types: buildRssAlternateTypes(locale)`，页面不再单独拼。文章页走独立的 `buildPostAlternatesFull(slug, locale)`（canonical + `buildPostAlternates(slug)` + types），保持「仅存在语言」语义。

### D4. `buildOpenGraph({ title, description, url, locale })` 返回**全量** og

含 `siteName`、`type: 'website'`、`locale: toOgLocale(locale)`、`localeAlternate: [另一 locale 的映射]`、`images: [{ url: '/opengraph-image.png', alt: siteTitle }]`。全量是机制要求（整体替换语义下部分字段 = 丢失字段）。文章页**不使用**该 helper（保留现有手工 og + 同段文件约定图，仅 locale 改映射值并补 `localeAlternate`），避免误设 `images` 覆盖专属 OG 图。布局 og 的 `url` 改为 `buildPageUrl('', locale)`（首页是布局 og 的唯一继承者，使其 `og:url` 与 canonical 一致）。

### D5. 时区常量 `+08:00` 硬编码于 `lib/seo.ts`

`toIsoDateTime(dateStr)`：已含 `T` 透传，否则拼 `T00:00:00+08:00`（`AUTHOR_TZ_OFFSET` 常量 + 注释说明语义：发布日期按作者本地日界）。`validate-post.mjs` 已强制 frontmatter 为 `YYYY-MM-DD`，主路径输入可信；透传分支仅为前向兼容。否决 site.yaml 配置项：单作者站点过度设计。

### D6. 首页新增 `generateMetadata` 但只返回 alternates

`{ alternates: buildAlternates('', locale) }`——`title` 键不定义，`title.default`（"Ruixe Blog"）与站点级 description/og 照常继承，保住浏览器 tab 的干净标题（`page.tsx` 现有注释所记录的行为）。

## Risks / Trade-offs

- **[布局移除 languages 后，未来新页面漏调 helper → hreflang 全缺]** → 缓解：spec scenario 已写死「每页 MUST 调用构造函数」；验收脚本（tasks 末项）对全页面矩阵抽查，缺失立即暴露。失败模式从「静默错值」变为「显式缺失」，后者对爬虫伤害更小且可被工具发现。
- **[twitter 回退依赖 X 爬虫行为，卡片预览工具若不实现回退会显示空标题]** → 缓解：X 官方文档明确支持该回退；实际卡片渲染（X、Telegram、Slack 等）均读 og。残留风险接受——预览工具非真实分发渠道。
- **[og:locale 从 `zh` 改为 `zh_CN` 属对外输出变化，社交平台缓存可能短期内仍显示旧卡]** → 缓解：平台卡片缓存自然过期（X 约 7 天主动刷新）；canonical 不变，无 SEO 副作用。
- **[sitemap 非文章条目加 languages 后，与 Change B 的空 taxonomy 过滤修改同一 requirement]** → 顺序约束：先归档本 change 再实施 Change B；B 的 delta 以本 change 修订后的 requirement 文本为基础编写（B 的设计文档已注明）。
- **[JSON-LD 日期加时区后富媒体摘要可能短暂重爬]** → 接受：Google 对结构化数据变更常规重处理，无惩罚语义。

## Migration Plan

纯构建期变更，无数据迁移。部署即生效（Vercel auto-deploy `main`）。回滚 = revert 对应 commit，`<head>` 输出回到现状，无状态残留。验收顺序：`pnpm build` → 本地 `pnpm start` 跑 head 抽查脚本 → 合并部署 → 线上复跑抽查 + Rich Results Test 抽查文章页。

## Open Questions

（无——全部决策已在探索阶段与用户确认：D1 x-default 仅首页、D2 og 回退、D3 +08:00 硬编码。）
