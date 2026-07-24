## Why

侧栏的分类列表当前只显示分类名称，访客无法在浏览时感知每个分类下有多少篇文章。对于内容逐渐丰富的博客，分类规模是重要的导航线索——访客希望知道"前端开发有 12 篇"还是"后端开发还是空的"。当前 `lib/posts.ts` 已有计算分类下文章所需的全部数据（`getAllPosts` + `post.category`），但缺少聚合函数，且 `getAllPosts` 每次调用都全量扫描文件系统、无缓存，在 SSG 构建期会被多个页面重复调用。

## What Changes

- 新增 `getCategoryPostCounts(lang)` 聚合函数（位于 `lib/posts.ts`），返回 `Record<categoryId, number>`，按 locale 统计每个分类下的文章数量。
- 为 `getAllPosts(lang)` 增加 per-locale 的模块级 `Map` 缓存，复用 `lib/taxonomy.ts` 已验证的缓存模式；缓存仅在 `process.env.NODE_ENV === 'production'` 下启用，dev 模式始终读文件系统以保证新增/修改文章立即可见（DX）。
- 修改 `SidebarContent`（Server Component）分类列表渲染：每项分类名称右侧显示该分类的文章计数，使用右对齐的 `text-muted tabular-nums` 纯文本样式，不使用 HeroUI `Badge`。
- 计数为 0 的分类显示 `0`（不隐藏、不灰化），保持分类列表的完整性。
- 计数在所有渲染 `SidebarContent` 的页面（桌面 Sidebar 与移动 Drawer）一致显示——侧栏是全局 chrome，计数恒在，无跨页面闪烁。
- 标签云**不**加计数（本次范围仅分类）。
- 零 i18n 改动（计数为纯数字，无需翻译键）。

## Capabilities

### New Capabilities

<!-- 无新能力。本变更仅修改两个现有能力的 spec。 -->

### Modified Capabilities

- `app-layout`: 桌面端常驻 Sidebar 与移动端 Drawer 的分类列表项 SHALL 额外显示该分类下的文章计数（右对齐纯文本，0 计数显示为 `0`）。
- `mdx-content`: `lib/posts.ts` SHALL 新增 `getCategoryPostCounts` 聚合函数；`getAllPosts` SHALL 在 production 模式下使用 per-locale 模块级缓存，dev 模式不缓存。

## Impact

- **代码**：`lib/posts.ts`（新增聚合函数 + 缓存逻辑）、`components/layout/SidebarContent.tsx`（分类项渲染加计数）。零新文件、零路由改动、零 layout 改动、零 client component 新增。
- **依赖**：无新增依赖。复用现有 `gray-matter`、`fs`、`Map`。
- **构建**：production 构建期 `getAllPosts` 的 fs 扫描从"每页面一次"降为"每 locale 一次"，惠及首页、文章列表页、分类页、标签页、侧栏的所有调用。
- **DX**：dev 模式不受缓存影响，写新文章仍可即时预览（与当前行为一致）。
- **SSG**：所有路由保持 `● (SSG)`，缓存不引入动态渲染。
- **向后兼容**：纯增量，无 breaking change。现有 `getAllPosts`/`getPostsByCategory`/`getPostsByTag` 的返回类型与语义不变。
