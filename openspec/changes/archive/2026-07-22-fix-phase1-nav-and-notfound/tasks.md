## 1. 共享导航组件 NavLinks

- [x] 1.1 创建 `components/layout/NavLinks.tsx`（Server Component，顶部 `import 'server-only'`）：导出 `NavLinks` 组件，接收 `variant: 'header' | 'drawer'` prop
- [x] 1.2 NavLinks 内部用 `getTranslations('Nav')` 读取导航文案（`Home`/`About`/`Github`），用 `siteConfig.githubUrl` 读取 GitHub 外链 URL
- [x] 1.3 NavLinks 渲染 `<nav aria-label="Primary navigation">`，含三个导航项：Home（`Link` from `@/i18n/navigation`，`href="/"`）、About（`Link` from `@/i18n/navigation`，`href="/about"`）、GitHub（`Link` from `@heroui/react`，`href={siteConfig.githubUrl}`，`target="_blank"`，`rel="noopener noreferrer"`）
- [x] 1.4 GitHub 外链前显示 `ExternalLink` 图标（`lucide-react`，`className="size-4"`）
- [x] 1.5 根据 `variant` 切换样式：`header` 为 `flex items-center gap-4` + `text-sm text-muted hover:text-foreground`；`drawer` 为 `flex flex-col gap-1` + `text-base text-muted hover:bg-secondary hover:text-foreground px-3 py-2 rounded-medium`
- [x] 1.6 为 NavLinks 组件编写 JSDoc 注释（说明 Server Component 身份、`variant` 用途、与 Header/Drawer 的复用关系）
- [x] 1.7 运行 `pnpm format-lint` 验证 `NavLinks.tsx` 无类型与 lint 错误

## 2. Header 改用 NavLinks 组件

- [x] 2.1 修改 `components/layout/Header.tsx`：删除内联 `<nav>` 及其三个导航项渲染代码（Home/About/GitHub 的 `NavLink`/`Link` + `ExternalLink` 图标）
- [x] 2.2 在 Header 原导航位置渲染 `<NavLinks variant="header" />`，保留外层布局 `<div className="flex items-center gap-8">` 中的标题 `NavLink`
- [x] 2.3 从 Header 移除不再使用的 import（如 `ExternalLink` from `lucide-react`、`Link` from `@heroui/react`、`siteConfig` 若已无其他引用）；保留 `getTranslations('Nav')` 若仍用于其他文案，否则移除
- [x] 2.4 运行 `pnpm dev`，桌面端（`>=1024px`）验证 Header 导航（首页、关于、GitHub）显示与点击行为与改造前一致
- [x] 2.5 运行 `pnpm format-lint` 验证 Header.tsx 无错误

## 3. MobileHeader 与 locale layout 集成 NavLinks

- [x] 3.1 修改 `app/[lang]/layout.tsx`：在 `LocaleLayout` 中渲染 `<NavLinks variant="drawer" />`，作为 `navLinks` prop 传入 `<MobileHeader>`（与现有 `sidebar={<SidebarContent locale={locale} />}` 模式一致）
- [x] 3.2 修改 `components/layout/MobileHeader.tsx`：新增 `navLinks: React.ReactNode` prop（RSC payload，与 `sidebar` prop 模式一致）
- [x] 3.3 在 `MobileDrawer` 的 `Drawer.Body` 内，用 `<div onClick={() => setIsDrawerOpen(false)}>` click-interceptor 包裹 `{navLinks}` 与 `{sidebar}`（children），实现任意导航链接点击自动关闭 Drawer
- [x] 3.4 click-interceptor `<div>` 不调用 `e.preventDefault()`，确保 Next.js Link 客户端导航正常继续；`onClick` 仅调用 `setIsDrawerOpen(false)`
- [x] 3.5 为 `navLinks` prop 与 click-interceptor 编写 JSDoc 注释（说明 RSC payload 传递模式、click-interceptor 事件冒泡原理）
- [x] 3.6 运行 `pnpm dev`，移动端视口（`<1024px`，可用浏览器 DevTools 设备模拟）验证：点击汉堡按钮打开 Drawer，Drawer 内容从上至下依次显示导航（首页/关于/GitHub）、名片、分类、标签
- [x] 3.7 移动端验证：点击 Drawer 内"关于"导航项，Drawer 关闭并导航至关于页
- [x] 3.8 移动端验证：点击 Drawer 内分类链接（如 `frontend`），Drawer 关闭并导航至分类页
- [x] 3.9 移动端验证：点击 Drawer 内标签链接（如 `next-js`），Drawer 关闭并导航至标签页
- [x] 3.10 移动端验证：点击 Drawer 内 GitHub 外链，Drawer 关闭并在新标签页打开 GitHub 主页
- [x] 3.11 运行 `pnpm format-lint` 验证 `MobileHeader.tsx` 与 `layout.tsx` 无错误

## 4. 本地化 404 页面

- [x] 4.1 创建 `app/[lang]/not-found.tsx`（非 async Server Component，**不**加 `'server-only'`，因 not-found 边界需在客户端导航时渲染）
- [x] 4.2 用 `useTranslations('NotFound')` 读取 `Title`、`Description`、`BackHome` 翻译文案（与 next-intl 官方 not-found 模式一致，hooks 在非 async Server Component 中可用）
- [x] 4.3 渲染品牌化 404 页面：`<h1>` 显示 `Title`、`<p>` 显示 `Description`、`Link` from `@/i18n/navigation`（locale-aware）`href="/"` 显示 `BackHome`，按钮样式用 Tailwind（如 `rounded-medium bg-primary px-4 py-2 text-primary-foreground`）
- [x] 4.4 页面布局居中：外层 `<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">`
- [x] 4.5 为 not-found 页面编写 JSDoc 注释（说明用 `useTranslations` 而非 `getTranslations` 的原因--next-intl 官方 not-found 模式，not-found 边界上下文可能不完整）
- [x] 4.6 运行 `pnpm dev`，访问 `/zh/posts/nonexistent-slug` 验证渲染中文 404 页面（"页面未找到"、"你访问的页面不存在或已被移除"、"返回首页"按钮）
- [x] 4.7 访问 `/en/posts/nonexistent-slug` 验证渲染英文 404 页面（"Page Not Found"、"The page you are looking for does not exist or has been removed"、"Back to home"按钮）
- [x] 4.8 访问 `/zh/categories/nonexistent` 与 `/zh/tags/nonexistent` 验证分类/标签页 404 同样渲染本地化页面
- [x] 4.9 点击"返回首页"按钮验证导航至当前 locale 首页（`/zh` 或 `/en`）
- [x] 4.10 验证 404 页面在 locale layout 内渲染（复用 Header、Sidebar chrome，非裸页面）
- [x] 4.11 运行 `pnpm format-lint` 验证 `not-found.tsx` 无错误

## 5. 构建验证与最终测试

- [x] 5.1 运行 `pnpm build` 全量构建，确认无错误、无类型问题；检查 `.next/` 输出的静态页数量符合预期（2 locale × N 页，含 404 路由）
- [x] 5.2 桌面端（`>=1024px`）回归测试：Header 导航（首页/关于/GitHub）正常，Sidebar 分类/标签跳转正常，主题/语言切换正常
- [x] 5.3 移动端（`<1024px`）回归测试：Drawer 打开/关闭，Drawer 内导航项点击自动关闭并跳转，分类/标签点击自动关闭并跳转
- [x] 5.4 404 回归测试：无效 locale（`/jp`）、不存在 slug、不存在分类、不存在标签均渲染本地化 404 页面
- [x] 5.5 语言切换回归测试：在首页、文章详情页、分类页、标签页切换语言，URL 与文案正确变化
- [x] 5.6 运行 `pnpm format-lint` 全量格式化与 lint，确保无错误
- [x] 5.7 用 `next-devtools` MCP 的 `nextjs_index` + `nextjs_call` 检查运行时无错误、路由列表符合预期
- [x] 5.8 提交 git commit（`fix: complete phase 1 mobile drawer nav and localized 404`），推送至 `feat/phase-1` 分支
