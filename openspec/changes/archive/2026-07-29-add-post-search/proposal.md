## Why

当前博客 Header 右侧的搜索按钮是一个禁用的占位元素（`app-layout` spec 的「搜索按钮占位」需求），用户无法检索站内文章。单作者博客的内容随时间增长，读者需要一种快速定位文章的方式。本变更实现客户端模糊搜索：基于 Fuse.js 对当前 locale 的文章元数据与正文建立静态索引，通过 `⌘K`/`Ctrl+K` 快捷键或 Header 搜索按钮触发弹窗，在模态对话框中实时搜索并键盘导航结果，点击结果跳转至文章详情页。该方案与项目的文件驱动、SSG 架构天然契合——索引在构建时从 MDX 文件生成，内联进 RSC props 传递至客户端，零运行时数据库/服务端搜索开销。

## What Changes

- 新增 `fuse.js` 依赖（客户端模糊搜索库，零依赖）
- 新增 `lib/search.ts`（`import 'server-only'`）：从 `getAllPosts(lang)` 构建轻量搜索索引，对正文做正则 `stripMarkdown` 预处理（剥离 frontmatter/代码块/链接/图片/HTML 标签/转义字符），将 `categoryId`/`tagIds` 预本地化为当前 locale 的名称，输出 `SearchIndexItem[]`
- 新增客户端搜索组件群（`components/search/`）：
  - `SearchProvider`（`'use client'`，Context Provider）：在 layout 层注入，管理搜索弹窗 `isOpen` 状态，注册全局 `⌘K`/`Ctrl+K` 快捷键监听器，渲染单一 `SearchDialog` 实例
  - `SearchDialog`（`'use client'`）：基于 HeroUI v3 `Modal` 的搜索弹窗，内含 `SearchField` 输入框与结果列表，Fuse 索引通过 `useMemo` 缓存，查询经 200ms 防抖，实现键盘导航（↑↓ 选择、Enter 跳转、ESC 清空/关闭）
  - `SearchResultItem`（`'use client'`）：单条搜索结果渲染，接收预本地化数据（无需客户端 import `server-only` 模块）
  - `SearchTrigger`（`'use client'`）：替换 Header 中的占位搜索按钮，点击触发 `setIsOpen(true)`，桌面端附带 `⌘K`/`Ctrl+K` `Kbd` 提示（`useMounted` 守卫避免 hydration 不匹配）
- 修改 `app/[lang]/layout.tsx`：在 locale 布局中注入 `SearchProvider`，将当前 locale 的 `SearchIndexItem[]` 作为 prop 传入（包裹 Header、MobileHeader 与 children）
- 修改 `components/layout/Header.tsx` 与 `components/layout/MobileHeader.tsx`：将占位搜索 `Button`（`isDisabled`）替换为 `SearchTrigger` 组件
- 修改 `i18n/messages/zh.json` 与 `en.json`：新增 `Search` 命名空间（弹窗标题、占位符、空状态、键盘提示、结果计数等 key），删除 `Header.SearchComingSoon`（占位文案，功能已实现）
- 搜索范围限定为**当前 locale** 的文章（zh 搜索只查中文文章，en 搜索只查英文文章），不跨 locale 混合

## Capabilities

### New Capabilities

- `post-search`: 站内文章搜索子系统 - 定义搜索索引构建（元数据 + 预处理正文，服务端本地化分类/标签）、客户端模糊搜索（Fuse.js 加权搜索，当前 locale 范围）、搜索弹窗 UI（HeroUI v3 Modal + SearchField + 结果列表）、键盘交互（⌘K/Ctrl+K 触发、结果导航、ESC 行为）与结果跳转的完整行为契约

### Modified Capabilities

- `app-layout`: 桌面端 Header 与移动端 Header 的「搜索按钮占位」需求由"阶段 2 待实现、按钮禁用无交互"变更为"点击搜索按钮（或按 ⌘K/Ctrl+K）打开搜索弹窗"，搜索按钮从禁用占位变为可用交互元素

## Impact

- **代码**：`lib/search.ts`（新增）、`components/search/`（新增 4 个组件）、`app/[lang]/layout.tsx`（注入 Provider + 传递索引）、`components/layout/Header.tsx`、`components/layout/MobileHeader.tsx`、`i18n/messages/zh.json`、`i18n/messages/en.json`
- **依赖**：新增 `fuse.js`（客户端库，无 peer dependency 冲突，不触碰已 pin 的 `typescript`/`eslint` 版本）
- **构建行为**：搜索索引在构建时由 `lib/search.ts`（`server-only`，使用 `node:fs`）生成，随 `getAllPosts` 的生产缓存一同缓存；索引数据通过 RSC props 内联至客户端，不产生新的动态路由（全路由保持 `● (SSG)`）。需在 `pnpm build` 后核验 RSC payload 大小与 SSG 状态
- **向后兼容**：搜索按钮占位行为被移除（此前为禁用状态，无既有功能依赖），不构成破坏性变更；`Header.SearchComingSoon` message key 被删除，若有外部引用需更新（仅限项目内部组件）
- **客户端边界**：`SearchProvider`/`SearchDialog`/`SearchResultItem`/`SearchTrigger` 均为 `'use client'`，MUST NOT import `lib/search`、`lib/posts`、`lib/taxonomy` 等 `server-only` 模块——所有数据通过 RSC props（`SearchIndexItem[]`，已预本地化分类/标签名称）传入，延续项目的 server/client 边界约定
- **HeroUI v3 风险**：`Modal` 与 `SearchField` 为 v3 beta 组件，API 与训练数据可能不一致；实现时须以 `heroui-react` MCP 文档为准，并在 dev server + `next-devtools` 中核验 Modal focus trap 与 SearchField `autoFocus` 的实际运行时行为
- **i18n**：新增 `Search` 命名空间，所有 key 遵循 PascalCase（如 `Search.DialogTitle`、`Search.Placeholder`、`Search.EmptyState`），与现有命名空间约定一致
