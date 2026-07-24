## 1. lib/posts.ts 缓存与聚合函数

- [x] 1.1 在 `lib/posts.ts` 顶部新增模块级缓存 `const postsCache = new Map<Locale, PostMeta[]>()`
- [x] 1.2 修改 `getAllPosts(lang)`：在 `process.env.NODE_ENV === 'production'` 时优先读 `postsCache`，命中则返回引用；未命中时执行现有 fs 扫描逻辑，结果写入 `postsCache` 后返回；development 模式跳过缓存逻辑
- [x] 1.3 更新 `getAllPosts` 的 JSDoc，注明"返回缓存引用，调用方不得 mutate"（production 模式）
- [x] 1.4 新增 `getCategoryPostCounts(lang: Locale): Record<string, number>` 函数：遍历 `getAllPosts(lang)` 结果，按 `post.category` 聚合计数，使用 `for...of` 循环风格（与 `getAllPosts` 现有风格一致）
- [x] 1.5 为 `getCategoryPostCounts` 编写 JSDoc，说明返回 `Record<categoryId, number>`、无文章的分类不在结果中（调用方用 `?? 0` 处理）

## 2. SidebarContent 分类计数渲染

- [x] 2.1 在 `components/layout/SidebarContent.tsx` 导入 `getCategoryPostCounts`（从 `@/lib/posts`）
- [x] 2.2 在 `SidebarContent` 中调用 `const counts = getCategoryPostCounts(locale)`，与 `getCategories(locale)` 并列
- [x] 2.3 修改分类列表项的 `<NavLink>`：`className` 改为 `flex items-center justify-between text-sm text-muted transition-colors hover:text-foreground`
- [x] 2.4 在 `<NavLink>` 内部，分类名 `category.name` 后追加 `<span className="tabular-nums">{counts[category.id] ?? 0}</span>`
- [x] 2.5 确认移动端 Drawer 复用同一 `SidebarContent`，计数在 Drawer 中同样显示（无需额外改动，验证即可）

## 3. 验证

- [x] 3.1 运行 `pnpm format-lint`，确认无格式与 lint 错误
- [x] 3.2 运行 `pnpm build`，确认所有路由保持 `● (SSG)`，无新增 `ƒ`（动态渲染）路由
- [x] 3.3 启动 `pnpm dev`，访问 `/zh` 确认侧栏 `前端开发` 显示 `1`、`后端开发` 与 `运维与部署` 显示 `0`
- [x] 3.4 在 dev 模式下新增一篇 `test-post.zh.mdx`（category: backend），刷新 `/zh` 确认 `后端开发` 计数变为 `1`（验证 dev 不缓存）
- [x] 3.5 访问 `/en` 确认英文侧栏计数正确（`Frontend Development 1`）
- [x] 3.6 访问 `/zh/posts/hello-world` 确认文章详情页侧栏同样显示计数（验证"所有页面"一致性）
- [x] 3.7 在移动端视口（<lg）打开 Drawer，确认分类项计数显示正确
- [x] 3.8 清理：删除验证用的 `test-post.zh.mdx` 文件
