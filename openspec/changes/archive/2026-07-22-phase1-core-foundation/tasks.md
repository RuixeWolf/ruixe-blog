## 1. 依赖安装与基础配置

- [x] 1.1 安装 i18n 依赖：`pnpm add next-intl`
- [x] 1.2 安装 MDX 依赖：`pnpm add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx`
- [x] 1.3 安装 frontmatter 与 MDX 插件依赖：`pnpm add gray-matter remark-gfm remark-frontmatter rehype-slug github-slugger`
- [x] 1.4 安装 taxonomy 解析依赖：`pnpm add yaml` + `pnpm add -D @types/yaml`
- [x] 1.5 安装主题切换依赖：`pnpm add next-themes`
- [x] 1.6 重构 `next.config.ts`：组合 `withMDX` + `withNextIntl`，`pageExtensions` 含 `mdx`，remark/rehype 插件用字符串名（`remark-gfm`、`remark-frontmatter`、`rehype-slug`）
- [x] 1.7 创建 `mdx-components.tsx`（根目录，最小占位版：仅导出空 `useMDXComponents`，后续 Group 8 增强）
- [x] 1.8 运行 `pnpm format-lint` 与 `pnpm build` 验证配置无报错

## 2. i18n 基础设施

- [x] 2.1 创建 `i18n/routing.ts`：`defineRouting({ locales: ['zh', 'en'], defaultLocale: 'zh' })`
- [x] 2.2 创建 `i18n/navigation.ts`：`createNavigation(routing)` 导出 `Link`、`redirect`、`usePathname`、`useRouter`、`getPathname`
- [x] 2.3 创建 `i18n/request.ts`：`getRequestConfig` 读取 `requestLocale`，校验后加载 `messages/{lang}.json`
- [x] 2.4 创建 `i18n/messages/zh.json`：含导航（首页、关于、GitHub）、Header 功能栏（搜索、语言、主题）、Sidebar（分类、标签）、文章列表（阅读更多、发布于）、文章详情（目录、上一篇、下一篇）、关于页等 UI 文案
- [x] 2.5 创建 `i18n/messages/en.json`：与 `zh.json` 键完全一致的英文翻译
- [x] 2.6 创建 `proxy.ts`（根目录）：`export default createMiddleware(routing)` + `config.matcher` 排除 `api`、`_next`、`_vercel`、含点路径
- [x] 2.7 运行 `pnpm dev`，访问 `/` 验证重定向至 `/zh`；访问 `/en` 验证不报错

## 3. content 目录与占位内容

- [x] 3.1 创建 `content/posts/hello-world.zh.mdx`：frontmatter（title、description、publishedTime: 2026-07-21、category: frontend、tags: [next-js, react]）+ 简短"Hello World"中文正文（含 h2、h3、段落、列表、图片占位、代码块、链接，用于验证 MDX 组件）
- [x] 3.2 创建 `content/posts/hello-world.en.mdx`：与中文版同结构英文内容
- [x] 3.3 创建 `content/taxonomy/categories.yaml`：含 `frontend`、`backend`、`devops` 三个分类，每个含 `name.zh` 与 `name.en`
- [x] 3.4 创建 `content/taxonomy/tags.yaml`：含 `next-js`、`react`、`typescript` 三个标签，每个含 `name.zh` 与 `name.en`
- [x] 3.5 验证 YAML 语法正确（可用 `node -e "require('yaml').parse(require('fs').readFileSync('content/taxonomy/categories.yaml','utf8'))"`）

## 4. lib 服务端工具

- [x] 4.1 创建 `lib/posts.ts`（顶部 `'server-only'`）：定义 `PostMeta` 类型（slug、lang、title、description、publishedTime、modifiedTime?、category、tags、content 原文）；实现 `getAllPosts(lang)`、`getPostBySlug(slug, lang)`、`getPostsByCategory(categoryId, lang)`、`getPostsByTag(tagId, lang)`；用 `gray-matter` 解析 frontmatter；按 `publishedTime` 降序排列
- [x] 4.2 创建 `lib/taxonomy.ts`（顶部 `'server-only'`）：用 `yaml` 包加载 `categories.yaml` 与 `tags.yaml`；实现 `getCategories(lang)`、`getCategory(id, lang)`、`getTags(lang)`、`getTag(id, lang)`；校验每个 ID 含所有受支持 locale 翻译，缺失抛错
- [x] 4.3 创建 `lib/toc.ts`：实现 `extractToc(markdownContent)`，正则 `/^(#{2,3})\s+(.+)$/gm` 提取 h2/h3，用 `github-slugger` 生成与 `rehype-slug` 一致的锚点 id；返回 `TocItem[]`（`{ level, text, id }`）
- [x] 4.4 创建 `lib/github.ts`（顶部 `'server-only'`）：实现 `getGitHubUser(username)`，`fetch('https://api.github.com/users/{username}', { next: { revalidate: 3600 }, headers: { 'User-Agent': 'ruixe-blog' } })`；失败时返回 `null` 供调用方降级
- [x] 4.5 创建 `lib/site-config.ts`：导出 `siteConfig` 对象（`githubUsername`、`siteUrl`、`siteTitle` 等），从环境变量 `GITHUB_USERNAME` 读取或提供默认值
- [x] 4.6 创建 `.env.example`：含 `GITHUB_USERNAME=RuixeWolf`
- [x] 4.7 运行 `pnpm format-lint` 验证 `lib/` 无类型与 lint 错误

## 5. 主题切换组件

- [x] 5.1 创建 `components/theme/ThemeProvider.tsx`（`'use client'`）：封装 `next-themes` 的 `ThemeProvider`，`attribute="class"`、`defaultTheme="light"`、`enableSystem`、`disableTransitionOnChange`
- [x] 5.2 创建 `components/theme/ThemeToggle.tsx`（`'use client'`）：用 `useTheme()` 获取当前主题，`lucide-react` 的 `Sun`/`Moon` 图标按钮切换；处理 `mounted` 状态避免 hydration 不匹配（未 mounted 时渲染占位）
- [x] 5.3 用 `heroui-react` MCP 查询 HeroUI v3 `Button` 与 `Tooltip` 用法，确保 `ThemeToggle` 使用正确的 compound 组件 API
- [x] 5.4 运行 `pnpm format-lint` 验证无错误

## 6. 根布局重构

- [x] 6.1 创建 `app/layout.tsx`：渲染 `<html lang="zh" suppressHydrationWarning>` + `<body>`；保留 Geist 字体、ThemeProvider、Analytics、SpeedInsights；导出静态站点级 `metadata`（`title.default`/`title.template`/`description`/`metadataBase`/`openGraph`）；不包含任何 locale chrome（Header/Sidebar 等）
- [x] 6.2 暂时保留 `app/page.tsx`（冒烟测试），待 Group 7 的 `[lang]/layout.tsx` 与 Group 9 的首页就绪后再删除
- [x] 6.3 运行 `pnpm dev` 验证根布局渲染正常，主题切换按钮可点击且无 hydration 报错

## 7. locale 布局与布局组件

- [x] 7.1 创建 `app/[lang]/layout.tsx`：`async` 函数，`await params` 取 `lang`，`hasLocale` 校验后 `setRequestLocale(lang)`；`getMessages()` 获取文案；`<NextIntlClientProvider locale={lang} messages={messages}>` 包裹 `<Header />` + `<MobileHeader />` + `<Sidebar />` + `<MobileDrawer />` + `<main>{children}</main>`（不渲染 `<html>`/`<body>`，由根布局提供）；导出 `generateStaticParams` 返回 `routing.locales.map(lang => ({ lang }))`；导出 `generateMetadata` 返回 `alternates.languages`（hreflang）与 `openGraph.locale`
- [x] 7.2 用 `heroui-react` MCP 查询 HeroUI v3 `Drawer`、`Accordion`、`Card`、`Avatar`、`Link`、`Button` 的 compound 组件 API（记录关键用法）
- [x] 7.3 创建 `components/layout/Header.tsx`（Server Component）：`hidden lg:flex` 桌面端 Header；左侧 `Ruixe Blog` 标题（`next-intl/navigation` 的 `Link` 指向 `/`）+ 导航（首页 `/`、关于 `/about`、GitHub 外链 `target="_blank"`）；右侧功能栏（搜索按钮占位 `Button` + `LanguageSwitcher` + `ThemeToggle`）；`sticky top-0 z-40` 定位
- [x] 7.4 创建 `components/layout/MobileHeader.tsx`（Client Component，`'use client'`）：`lg:hidden`；左侧汉堡按钮（`Menu` 图标，点击触发 Drawer 打开状态）；中间 `Ruixe Blog` 标题；右侧搜索按钮占位 + 设置按钮（点击弹出 `Popover` 含 `LanguageSwitcher` + `ThemeToggle`）
- [x] 7.5 创建 `components/layout/LanguageSwitcher.tsx`（Client Component）：用 `usePathname`、`useRouter`（来自 `i18n/navigation`）获取当前路径；下拉或按钮组切换 `zh`/`en`，导航至目标 locale 的对应路径
- [x] 7.6 创建 `components/layout/ProfileCard.tsx`（Server Component）：调用 `lib/github.ts` 的 `getGitHubUser(siteConfig.githubUsername)`；渲染 GitHub 头像（`next/image` 或 HeroUI `Avatar`）、用户名、Bio、联系方式、跳转 GitHub 主页按钮；API 失败时降级显示配置用户名与默认头像
- [x] 7.7 创建 `components/layout/Sidebar.tsx`（Server Component）：`hidden lg:block` 桌面端常驻侧栏；从上至下：`ProfileCard`、分类列表（调用 `lib/taxonomy.ts` 的 `getCategories(lang)`，每项 `Link` 至 `/categories/{id}`）、标签云（`getTags(lang)`，每项 `Link` 至 `/tags/{id}`）；用 HeroUI `Card` 或 `Surface` 包裹各区
- [x] 7.8 创建 `components/layout/MobileDrawer.tsx`（Client Component）：用 HeroUI `Drawer`（`placement="left"`）；内容与 `Sidebar` 一致（复用 `ProfileCard`、分类、标签渲染逻辑，提取共享子组件或直接复用）；通过 context 或 props 与 `MobileHeader` 的汉堡按钮联动开关状态
- [x] 7.9 运行 `pnpm dev`，桌面端（`>=1024px`）验证 Header + Sidebar 显示；移动端（`<1024px`）验证 Header + Drawer 打开/关闭；切换语言验证 URL 变化
- [x] 7.10 运行 `pnpm format-lint` 验证无错误

## 8. MDX 全局组件映射增强

- [x] 8.1 增强 `mdx-components.tsx`：`img` 映射至 `next/image`（`sizes="100vw"`、`style={{ width: '100%', height: 'auto' }}`，透传 `alt`）；`a` 映射至自定义组件（外链 `href` 以 `http` 开头时加 `target="_blank"` + `rel="noopener noreferrer"`）；`pre`/`code` 映射至带 Tailwind 样式的组件（代码高亮留待阶段 2，仅排版）；其余元素用 Tailwind `prose` 类
- [x] 8.2 验证 MDX 内容含图片、外链、代码块时渲染正确（用占位文章测试）
- [x] 8.3 运行 `pnpm format-lint` 验证无错误

## 9. 文章列表与首页

- [x] 9.1 创建 `components/posts/PostCard.tsx`（Server Component）：接收 `PostMeta` + `lang`；渲染标题（`Link` 至 `/posts/{slug}`）、描述摘要、发布日期、分类名（`getCategory`）、标签名（`getTag`）；用 HeroUI `Card` compound 组件（`Card.Header`、`Card.Content` 等）
- [x] 9.2 创建 `components/posts/PostList.tsx`（Server Component）：接收 `PostMeta[]` + `lang`；映射渲染 `PostCard` 列表；空列表时显示空状态文案（`next-intl` 翻译）
- [x] 9.3 创建 `app/[lang]/page.tsx`（首页）：`setRequestLocale`；`getAllPosts(lang)` 获取文章；渲染 `PostList`；移动端在列表上方显示简易版 `ProfileCard`（`lg:hidden`）
- [x] 9.4 创建 `app/[lang]/posts/page.tsx`（文章列表页）：与首页逻辑一致，渲染 `PostList`，不显示简易 ProfileCard
- [x] 9.5 运行 `pnpm dev`，访问 `/zh` 与 `/zh/posts` 验证占位文章 `hello-world` 显示在列表中；点击文章标题跳转详情页（Group 10 实现前会 404，预期）
- [x] 9.6 运行 `pnpm format-lint` 验证无错误

## 10. 文章详情页与 TOC

- [x] 10.1 创建 `components/posts/TableOfContents.tsx`（Server Component）：接收 `TocItem[]`；桌面端（`hidden lg:block`）渲染为 `sticky` 导航列表，每项 `Link` 至 `#{id}` 锚点；用 HeroUI `Card` 或 `nav` 语义化标签；含 `aria-label`
- [x] 10.2 创建 `components/posts/PostLayout.tsx`（Server Component）：接收 `PostMeta`、`TocItem[]`、`children`；渲染文章元信息（标题、发布/修改日期、分类、标签）；桌面端布局为 `<article>{children}</article>` + 右侧 `<TableOfContents />`；移动端在元信息与正文间插入折叠的 `<Accordion>` TOC（`defaultExpanded={false}`）
- [x] 10.3 创建 `app/[lang]/posts/[slug]/page.tsx`：`async` 函数；`await params` 取 `lang`/`slug`；`hasLocale` 校验 + `setRequestLocale`；`getPostBySlug(slug, lang)` 获取 meta，不存在则 `notFound()`；`extractToc(meta.content)` 生成 TOC；动态 `import(\`@/content/posts/${slug}.${lang}.mdx\`)`获取`default` 组件；`generateMetadata`返回`{ title, description, openGraph: { title, description } }`；渲染 `<PostLayout meta={meta} toc={toc}><Post /></PostLayout>`
- [x] 10.4 实现 `generateStaticParams`：遍历 `content/posts/` 所有 `{slug}.{lang}.mdx` 文件，返回 `{ lang, slug }[]`；`dynamicParams = false` 使未生成路由 404
- [x] 10.5 运行 `pnpm dev`，访问 `/zh/posts/hello-world` 验证文章正文、元信息、TOC 渲染正确；点击 TOC 条目验证滚动至对应 heading；切换至 `/en/posts/hello-world` 验证英文版
- [x] 10.6 运行 `pnpm build` 验证静态预渲染生成 `/zh/posts/hello-world` 与 `/en/posts/hello-world`
- [x] 10.7 运行 `pnpm format-lint` 验证无错误

## 11. 分类、标签、关于页

- [x] 11.1 创建 `app/[lang]/categories/[categoryId]/page.tsx`：`await params` 取 `lang`/`categoryId`；`setRequestLocale`；`getCategory(categoryId, lang)` 校验存在，不存在 `notFound()`；`getPostsByCategory(categoryId, lang)` 获取文章；渲染分类名标题 + `PostList`；`generateStaticParams` 遍历所有 locale × category ID 组合
- [x] 11.2 创建 `app/[lang]/tags/[tagId]/page.tsx`：逻辑同分类页，用 `getTag` + `getPostsByTag`；`generateStaticParams` 遍历所有 locale × tag ID 组合
- [x] 11.3 创建 `app/[lang]/about/page.tsx`：`setRequestLocale`；从 `messages` 读取关于博主与关于博客的文案，或用独立 MDX 文件（`content/about.{lang}.mdx`）渲染；阶段 1 用 messages 文案即可
- [x] 11.4 为分类页与标签页实现 `generateMetadata`：返回分类/标签名作为 title
- [x] 11.5 运行 `pnpm dev`，访问 `/zh/categories/frontend`、`/zh/tags/next-js`、`/zh/about` 验证渲染；访问不存在的分类/标签验证 404
- [x] 11.6 运行 `pnpm format-lint` 验证无错误

## 12. 冒烟测试移除与最终验证

- [x] 12.1 删除 `app/page.tsx`（HeroUI 冒烟测试页）；确认根路径 `/` 由 `proxy.ts` 重定向至 `/[lang]`
- [x] 12.2 更新 `AGENTS.md`：将 `URLs: /[locale]` 等描述中的 `[locale]` 改为 `[lang]`，同步 i18n 方案为 `next-intl`（原文字可能提及 `[locale]`）
- [x] 12.3 运行 `pnpm format-lint` 全量格式化与 lint
- [x] 12.4 运行 `pnpm build` 全量构建，确认无错误、无类型问题；检查 `.next/` 输出的静态页数量符合预期（2 locale × N 页）
- [x] 12.5 运行 `pnpm dev`，按以下清单手动测试：
  - 访问 `/` 重定向至 `/zh`（浏览器首选中文时）
  - 桌面端 Header + Sidebar 显示，移动端 Header + Drawer 打开/关闭
  - 主题切换正常，刷新无闪烁
  - 语言切换在首页、文章详情页、分类页均正确跳转
  - 文章列表显示占位文章，点击进入详情页
  - 文章详情页 TOC 点击跳转，桌面右侧、移动端 Accordion 折叠
  - 分类页、标签页、关于页正常渲染
  - 不存在的 locale（`/jp`）、不存在的 slug 返回 404
- [x] 12.6 用 `next-devtools` MCP 的 `nextjs_index` + `nextjs_call` 检查运行时无错误、路由列表符合预期
- [x] 12.7 提交 git commit（`feat: implement phase 1 core foundation`），推送至 feature 分支
- [x] 12.8 创建 PR 至 `RuixeWolf/ruixe-blog`，等待 Vercel preview 部署，在 preview 环境再次验证关键路径
