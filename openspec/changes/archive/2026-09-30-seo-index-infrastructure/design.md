# Design

## Context

三项互相独立的索引基础设施增强（robots meta / 空 taxonomy 过滤 / IndexNow），共享「提升发现与索引效率」目标。关键现状：

- 布局 metadata 当前无 `robots` 键；Next 16 `resolveRobots`（`resolve-basics.js:130-158`）白名单原生含 `'max-image-preview'`，官方文档示例与本站版本一致，配置即生效。布局级定义会被所有未自定义 robots 的页面继承——本站无任何页面定义 robots，一处配置全站覆盖。
- 侧边栏 `SidebarContent` 已调用 `getCategoryPostCounts` 渲染分类计数（`counts[id] ?? 0`，零篇显示 `0`），但标签云无计数、不过滤。**现有 `app-layout` spec 明文要求「计数为 0 的分类 MUST 显示 0」——与已确认决策 #2 冲突，delta 属有意撤销该条款**。
- `lib/posts.ts` 有 `getCategoryPostCounts`，无标签对称函数。
- 现有脚本（`delete-post.mjs`、`validate-post.mjs`）均不 import `lib/`（server-only 在纯 Node 下 `import 'server-only'` 解析到抛错入口）；IndexNow 脚本遵循同一约束，URL 清单来自线上 sitemap（它同时是爬虫的事实清单，天然一致）。
- `public/` 已有 GSC 验证文件先例（`google387ac33a73742a33.html`，公开 token），IndexNow key 文件同构。
- sitemap 的 taxonomy 条目当前全量生成（`getCategories(locale)` / `getTags(locale)` 无过滤）。

依赖顺序：本 change 的「sitemap.xml 生成」requirement delta 包含 `seo-metadata-consistency` 对同一 requirement 的修订（alternates/x-default）。**必须先归档 A 再实施 B**；B 归档时整体替换该 requirement，文本已含两者合并结果。

## Goals / Non-Goals

**Goals:**

- 全站输出 `index, follow` + `googlebot: max-image-preview:large`
- sitemap 与侧边栏不再出现零篇 taxonomy 条目（per-locale 口径），页面本体保留 200 可访问
- 新文章可通过 `pnpm seo-index-now` 分钟级推送给 Bing 系索引

**Non-Goals:**

- 不给空 taxonomy 页加 noindex（决策否决：内容出现后会被 noindex 状态卡住）
- 不做 CI 自动提交（部署完成时机与 GH Actions 无干净耦合；单人发布频率手动足够）
- 不动 search 索引 / RSS / llms.txt 的 taxonomy 处理（它们本来就只含文章）

## Decisions

### D1. 过滤口径 = per-locale，计数源 = 新增 `getTagPostCounts`

「分类/标签在 locale X 是否为空」以 `getAllPosts(X)` 的计数判断（与页面实际渲染内容一致）。分类复用 `getCategoryPostCounts`；标签新增对称 `getTagPostCounts`（遍历 `post.tags` 累加，零篇键不存在）——而不是在调用方各自 `getPostsByTag(...).length`（O(tags×posts) 且逻辑重复）。侧边栏只过滤不新增标签计数显示（最小改动；将来要显示计数可直接用该函数）。

- **备选（否决）**：全局过滤（任一 locale 有文章则两个 locale 都显示）——会把 en 访问者引向 en 空页，与过滤目的矛盾。

### D2. taxonomy 页保留在 `generateStaticParams`（继续预渲染）

零篇 taxonomy 页仍 200（空状态 UI 已存在），仅从 sitemap 与侧边栏移除发现入口。**不加 noindex、不从预渲染移除**——否则「该分类后来有文章」时页面要么 404 要么残留 noindex，都需要额外交互才恢复。

### D3. robots 放布局级单点

`app/[lang]/layout.tsx` `generateMetadata` 增加 `robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } }`。无页面级覆盖需求（全站统一可索引）；merge 语义下页面未定义 robots 即继承布局。

### D4. IndexNow 脚本 = 线上 sitemap 驱动 + 生产 host 硬防护

`scripts/seo-index-now.mjs`：读环境或默认 `https://blog.ruixe.net/sitemap.xml` → 正则/`DOMParser` 级轻量解析 `<loc>` → 校验所有 URL host 均为 `blog.ruixe.net`（任何异 host 或目标站点非生产域名即退出）→ POST `https://api.indexnow.org/indexnow`（JSON `{ host, key, keyLocation, urlList }`，本站约 60 条 URL 远低于 10k 上限）。key 从 `public/` 下的 key 文件名读取（单一事实来源：文件名即 key，内容即校验体）。依赖仅 Node 内置 `fetch`（Node 18+）。

- **备选（否决）**：脚本内重建 URL 清单（复用 `lib/`）——server-only 边界阻断；本地 content 与线上部署可能不同步。
- **备选（否决）**：key 走 `.env`——key 非机密（公网可访问文件），入 `.env` 反而破坏「fresh clone 无需 .env」原则。

### D5. key 文件命名与生成

key 为 32 位十六进制（`crypto.randomUUID().replace(/-/g, '')` 或 `openssl rand -hex 16` 生成一次，人工执行）。文件 `public/<key>.txt` 内容 = key 原文。tasks 中记录生成步骤；key 本身提交 Git。

## Risks / Trade-offs

- **[撤销「显示 0」条款是行为回退，en 侧边栏可能比 zh 短]** → 预期行为（per-locale 内容真实度优先）；空分类页仍可通过直链/未来文章恢复发现。
- **[sitemap 过滤后，已被索引的空 taxonomy URL 短暂留在索引]** → Google 会随 recrawl 自然清除（200 + 无入口 + canonical 自引用，无重复内容风险）；不提交移除请求。
- **[IndexNow API 限流/失败无重试]** → 手动脚本场景可重跑；输出含响应状态与文档 URL 便于诊断。后续若自动化再加重试。
- **[与 `seo-metadata-consistency` 修改同一 requirement]** → 严格顺序（先归档 A）；本 design 与 delta 文本均已注明合并基础。
- **[robots googleBot 增加 `max-image-preview` 后图片流量增大]** → 接受（Discover 引流量是目标本身）。

## Migration Plan

部署即生效。IndexNow 需人工两步：生成 key 文件（进 Git）→ 部署后跑一次 `pnpm seo-index-now`（验证 200/202 与 BWT 抓取日志）。回滚：robots/过滤改动 revert commit；IndexNow 停跑即静默，key 文件留存无害。

## Open Questions

（无——D4-A（手动脚本）、D5-A（per-locale 过滤、不加计数显示）均已在探索阶段确认。）
