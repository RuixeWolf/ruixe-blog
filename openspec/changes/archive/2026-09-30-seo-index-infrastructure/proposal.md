# Proposal

## Why

issue #30 的 P3 层三项索引基础设施缺口：全站无 `<meta name="robots">`（Google Discover 大图预览依赖 `max-image-preview:large`，缺失时 AI Overviews/Discover 只能取小图）；IndexNow 未配置（Bing 索引是 ChatGPT Search / Copilot 的引用来源，新文章的发现从「天级爬虫调度」退化为被动等待，IndexNow 可将其缩短为分钟级）；零篇分类/标签页（如 `/zh/categories/backend`、`/zh/tags/typescript`）返回 200 空状态却进入 sitemap 与侧边栏——浪费抓取预算、制造 thin content 信号，并把访问者引向空页。

## What Changes

- **robots meta**：`app/[lang]/layout.tsx` 根 metadata 增加 `robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large' } }`（Next 16 原生渲染 `googlebot` meta，源码与官方文档双核实）
- **空 taxonomy 过滤（已确认决策）**：sitemap 与侧边栏（`SidebarContent`，桌面 Sidebar 与移动 Drawer 共享）按 **per-locale** 文章数过滤零篇分类/标签；**页面本身保留可访问、不加 noindex**（避免该 taxonomy 后续有内容时被 noindex 状态卡住降权）
- **`lib/posts.ts` 新增 `getTagPostCounts(lang)`**：与既有 `getCategoryPostCounts` 对称的聚合函数（侧边栏标签云过滤与分类计数共用同一数据源模式）
- **IndexNow（已确认决策）**：key 文件入 `public/{key}.txt`（key 为公网验证 token，与既有 `public/google*.html` 同构，提交安全）；新增 `scripts/seo-index-now.mjs`（抓取线上 sitemap.xml → 解析 `<loc>` → 批量 JSON 端点提交；硬编码生产 host 防护，非生产域名直接拒绝）与 `pnpm seo-index-now` 命令；不做 CI 自动化（后续可选增强）

**依赖顺序**：本 change 修改 `seo` 能力的「sitemap.xml 生成」requirement，其 delta 文本包含 `seo-metadata-consistency` 对同一 requirement 的修订内容——**必须先归档 `seo-metadata-consistency` 再实施/归档本 change**，否则归档合并会互相覆盖。

## Capabilities

### New Capabilities

（无——全部为现有能力的新增/修订 requirement）

### Modified Capabilities

- `seo`:
  1. **ADDED**「robots meta 标签」requirement（全站 index/follow + googleBot `max-image-preview:large`）
  2. **ADDED**「IndexNow 主动提交」requirement（key 文件、提交脚本、生产 host 防护）
  3. **MODIFIED**「sitemap.xml 生成」requirement（零篇 taxonomy 条目按 locale 过滤；文本含 `seo-metadata-consistency` 的 alternates 修订，见依赖顺序）
- `app-layout`: **MODIFIED**「桌面端常驻 Sidebar」requirement——分类列表与标签云过滤当前 locale 下零篇的条目；**撤销**现有「计数为 0 的分类 MUST 显示 `0`（不隐藏、不灰化）」条款（与已确认决策 #2 冲突，属有意的行为变更）
- `mdx-content`: **MODIFIED**「文章列表读取」requirement——新增 `getTagPostCounts(lang)` 聚合函数（遍历 `getAllPosts(lang)` 按 `post.tags` 聚合，零篇标签不存在于返回对象，语义与分类计数一致）

## Impact

- **代码**：`app/[lang]/layout.tsx`（+robots）、`app/sitemap.ts`（taxonomy 条目过滤）、`components/layout/SidebarContent.tsx`（分类列表 + 标签云过滤）、`lib/posts.ts`（+getTagPostCounts）
- **新增文件**：`public/<indexnow-key>.txt`（key 文件）、`scripts/seo-index-now.mjs`；`package.json` scripts 增加 `seo-index-now`
- **对外行为**：`<head>` 多 robots meta；sitemap 与侧边栏不再列出零篇 taxonomy（对应**页面 URL 本身不变**、仍 200 可访问）；IndexNow 属部署后运维动作，不影响构建
- **明确不做**：taxonomy 页 noindex（决策否决）、CI 自动提交（后续可选）、IndexNow key 走 `.env`（key 非机密）
