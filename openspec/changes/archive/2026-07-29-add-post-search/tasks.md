# Implementation Tasks: Add Post Search

## 1. 依赖与基础设施

- [x] 1.1 运行 `pnpm add fuse.js`，确认安装成功且未触发 `typescript`/`eslint` 版本漂移（检查 `pnpm-lock.yaml` 与 `package.json`，若 pinned 版本被升级则回滚并重建 lockfile）
- [x] 1.2 确认 `fuse.js` 在 `package.json` 的 `dependencies` 中（非 devDependencies），版本为最新稳定版

## 2. 服务端搜索索引（lib/search.ts）

- [x] 2.1 创建 `lib/search.ts`，顶部 `import 'server-only'`，import `getAllPosts`、`PostMeta` from `@/lib/posts`、`getCategory`、`getTag` from `@/lib/taxonomy`、`Locale` from `@/i18n/routing`
- [x] 2.2 定义并导出 `SearchIndexItem` 接口（`slug`、`title`、`description`、`contentText`、`categoryName`、`tagNames: string[]`、`publishedTime`）
- [x] 2.3 实现 `stripMarkdown(content: string): string` 私有函数，按 design 决策 12 的正则链顺序处理：代码块（```与~~~）→ 行内代码 → 图片 → 链接（保留文本）→ HTML 标签 → 标题/列表/引用标记符 → 强调标记 → 转义反斜杠 → 折叠空白
- [x] 2.4 实现 `buildSearchIndex(lang: Locale): SearchIndexItem[]`，遍历 `getAllPosts(lang)`，对每篇 `PostMeta` 调用 `stripMarkdown(content)` 得 `contentText`、`getCategory(category, lang).name[lang]` 得 `categoryName`、`tags.map(id => getTag(id, lang).name[lang])` 得 `tagNames`，组装 `SearchIndexItem`
- [x] 2.5 验证 `buildSearchIndex` 复用 `getAllPosts` 的生产级缓存（不重复实现缓存逻辑，直接依赖 `getAllPosts` 的 `process.env.NODE_ENV === 'production'` 缓存）
- [x] 2.6 核验 `lib/search.ts` 不破坏 SSG：模块仅 `import 'server-only'` + `node:fs`（经 `getAllPosts` 间接），无动态 API 调用

## 3. 客户端搜索 Context（SearchProvider）

- [x] 3.1 创建 `components/search/SearchContext.ts`，定义 `SearchContext`（含 `isOpen: boolean`、`setIsOpen: (open: boolean) => void`）与 `useSearch()` hook（消费 Context，未在 Provider 内抛错）
- [x] 3.2 创建 `components/search/SearchProvider.tsx`（`'use client'`），内部 `useState<boolean>` 管理 `isOpen`，`useEffect` 注册全局 `keydown` 监听器：`(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'` 时 `e.preventDefault()` + `setIsOpen(true)`
- [x] 3.3 `SearchProvider` 接收 `searchIndex: SearchIndexItem[]` prop 并存入 Context（或直接传给 `SearchDialog`），渲染 `{children}` 与单个 `<SearchDialog searchIndex={searchIndex} isOpen={isOpen} onOpenChange={setIsOpen} />` 实例
- [x] 3.4 核验 `⌘K`/`Ctrl+K` 监听器依赖为 `[]`（`setIsOpen` 来自 useState 稳定引用），React Compiler 不会误优化；`setIsOpen(true)` 幂等性确认

## 4. 搜索弹窗主体（SearchDialog）

- [x] 4.1 创建 `components/search/SearchDialog.tsx`（`'use client'`），接收 `searchIndex`、`isOpen`、`onOpenChange` props；查询 `useDeferredValue` 实现 200ms 防抖
- [x] 4.2 `useMemo` 构造 Fuse 实例（依赖 `[searchIndex]`），配置加权 keys（title 0.4、description 0.25、tagNames 0.2、categoryName 0.1、contentText 0.05）、`threshold: 0.4`、`ignoreLocation: true`、`minMatchCharLength: 2`、`includeScore: true`
- [x] 4.3 `useMemo`（依赖 `[fuse, debouncedQuery]`）计算搜索结果，`debouncedQuery` 非空时 `fuse.search(query).slice(0, 10)`，否则空数组
- [x] 4.4 用 HeroUI v3 `Modal` 渲染弹窗：`Modal.Backdrop`（`isOpen`/`onOpenChange`/`isDismissable`/`isKeyboardDismissDisabled`）> `Modal.Container`（`placement="top"`、桌面端 `className="sm:max-w-2xl"`、移动端 `size="cover"`）> `Modal.Dialog` > `Modal.Body`（`scroll` 启用）
- [x] 4.5 在 Modal.Body 顶部渲染 `SearchField`（`SearchField.Group` > `SearchField.SearchIcon` + `SearchField.Input` + `SearchField.ClearButton`），`value`/`onChange` 绑定 query，`onClear` 清空 query
- [x] 4.6 实现键盘导航状态：`useState<number>` 跟踪 `activeIndex`（-1 表示无激活）；`SearchField.Input` 的 `onKeyDown` 处理 `ArrowDown`（activeIndex 循环递增）、`ArrowUp`（循环递减）、`Enter`（跳转 `results[activeIndex]`）；ESC 经 document 级 capture 监听器处理（query 非空时清空 query，否则 `onOpenChange(false)`）
- [x] 4.7 `SearchField.Input` 设 `role="combobox"`、`aria-expanded={isOpen}`、`aria-controls="search-results-listbox"`、`aria-activedescendant={activeIndex >= 0 ? \`search-result-${activeIndex}\` : undefined}`；`autoFocus`或在`onOpenChange`为 true 时手动`inputRef.current?.focus()`
- [x] 4.8 query 非空时渲染结果列表 `<ul role="listbox" id="search-results-listbox">`，每项为 `<SearchResultItem>`（包裹 `<li role="option" id={\`search-result-${i}\`} aria-selected={i === activeIndex} onClick={...} onKeyDown={...}>`）；无匹配时渲染空状态文案
- [x] 4.9 结果项跳转：`onClick` 或 `Enter` 时先 `onOpenChange(false)` 再 `router.push(\`/posts/${slug}\`)`（用 `next-intl/navigation`的`useRouter`，locale-aware）；跳转后重置 query 与 activeIndex
- [x] 4.10 核验 Modal focus trap 与 SearchField.Input 聚焦协调：若 `autoFocus` 失效，在 `useEffect([isOpen])` 中 `isOpen` 为 true 时 `inputRef.current?.focus()`

## 5. 搜索结果项（SearchResultItem）

- [x] 5.1 创建 `components/search/SearchResultItem.tsx`（`'use client'`），接收 `item: SearchIndexItem`、`isActive: boolean`、`onClick: () => void` props
- [x] 5.2 渲染标题（主，`font-semibold`）、描述（次，`line-clamp-2` 截断）、底部 meta 行：分类名 + 标签名（Chip 或纯文本）+ 发布日期（复用 `PostList` 的日期格式化 message key）
- [x] 5.3 视觉风格参考 `PostCard` 但更紧凑（padding/字号更小），激活项（`isActive`）高亮（`bg-default/50` 或类似）
- [x] 5.4 确认组件不 import `lib/taxonomy`/`lib/posts`（数据全来自 `SearchIndexItem` prop，已预本地化）

## 6. 搜索触发按钮（SearchTrigger）

- [x] 6.1 创建 `components/search/SearchTrigger.tsx`（`'use client'`），`useSearch()` 消费 `setIsOpen`，点击调用 `setIsOpen(true)`
- [x] 6.2 渲染 HeroUI v3 `Button`（`isIconOnly`、`variant="ghost"`、`aria-label={t('Search.Trigger')}`）+ `lucide-react` `Search` 图标
- [x] 6.3 实现 `useMounted()` hook（复用 `ThemeToggle.tsx` 的 `useSyncExternalStore` 模式，React Compiler 友好）；桌面端 `mounted` 为 true 时在按钮旁渲染 `Kbd` 提示
- [x] 6.4 平台检测：`navigator.platform.includes('Mac')` 为 true 显示 `⌘K`，否则 `Ctrl+K`；用 HeroUI v3 `Kbd`（`Kbd.Abbr` + `Kbd.Content`）渲染
- [x] 6.5 接收 `variant: 'desktop' | 'mobile'` prop，`mobile` 时不渲染 Kbd；`desktop` 时渲染 Kbd（受 `useMounted` 守卫）

## 7. 布局与 Header 集成

- [x] 7.1 修改 `app/[lang]/layout.tsx`：import `buildSearchIndex` from `@/lib/search` 与 `SearchProvider` from `@/components/search/SearchProvider`；在 layout 中调用 `buildSearchIndex(lang)` 得 `searchIndex`
- [x] 7.2 用 `<SearchProvider searchIndex={searchIndex}>` 包裹 Header、MobileHeader 与 `{children}`（Provider 在 NextIntlClientProvider 内层，确保 `useLocale` 等 client hook 可用）
- [x] 7.3 修改 `components/layout/Header.tsx`：移除占位搜索 `Button`（`isDisabled`），替换为 `<SearchTrigger variant="desktop" />`
- [x] 7.4 修改 `components/layout/MobileHeader.tsx`：移除占位搜索 `Button`（`isDisabled`），替换为 `<SearchTrigger variant="mobile" />`
- [x] 7.5 移除 `Header.tsx`/`MobileHeader.tsx` 中对 `Header.SearchComingSoon` message key 的引用（若有）

## 8. i18n 文案

- [x] 8.1 在 `i18n/messages/zh.json` 新增 `Search` 命名空间，包含 key：`DialogTitle`、`Placeholder`、`EmptyState`、`EmptyStateHint`、`KeyboardHint`（如"按 Enter 跳转，ESC 关闭"）、`ResultsCount`（如"找到 {count} 条结果"）等
- [x] 8.2 在 `i18n/messages/en.json` 新增对应 `Search` 命名空间英文翻译
- [x] 8.3 从 `zh.json` 与 `en.json` 删除 `Header.SearchComingSoon` key
- [x] 8.4 保留 `Header.Search`（按钮 aria-label）与 `Header.SearchPlaceholder` key
- [x] 8.5 核验所有新 key 遵循 PascalCase 命名约定，命名空间为 `Search`

## 9. 验证与核验

- [x] 9.1 运行 `pnpm dev`，启动 dev server；用 `next-devtools` MCP（`nextjs_index`）检查无编译/运行时错误
- [x] 9.2 浏览器核验：⌘K（Mac）/Ctrl+K（Windows）打开弹窗、Header 按钮打开弹窗、弹窗输入框自动聚焦
- [x] 9.3 浏览器核验：中文搜索（输入标题/正文关键词）、英文搜索、结果列表显示分类/标签/日期、键盘 ↑↓ 导航、Enter 跳转、ESC 先清空后关闭
- [x] 9.4 浏览器核验：移动端视口（<1024px）弹窗全屏覆盖、布局正常
- [x] 9.5 浏览器核验：切换 locale（zh↔en）后搜索索引更新，结果对应新 locale
- [x] 9.6 运行 `pnpm build`，确认全路由保持 SSG（`●`，无 `ƒ` 动态路由）；检查 `.next` 构建输出无警告
- [x] 9.7 检查 RSC payload 体积合理（当前仅 2 篇文章，预期增长可忽略）；若过大记录到 design 的 Risks
- [x] 9.8 运行 `pnpm format-lint`（Prettier + ESLint），确认通过；特别检查 import 排序（`@ianvs/prettier-plugin-sort-imports`）、Tailwind class 排序、无 semicolons
- [x] 9.9 核验 `proxy.ts` matcher 仍为纯字符串数组（未受本次改动影响，但项目已知坑点）
- [x] 9.10 手动测试 Fuse.js 中文短词 threshold：若 2-3 字中文词召回率过低，适度上调 threshold（0.4 → 0.5）并在 design 记录调整
