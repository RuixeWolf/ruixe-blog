## Context

项目当前为 Next.js 16 + HeroUI v3 beta 的冒烟测试脚手架（`app/page.tsx`），无业务结构。本 change 建立阶段 1 三大基石：国际化路由、响应式页面布局、MDX 文件驱动内容管线。

**当前状态：**

- `next.config.ts` 仅启用 `reactCompiler: true`
- `app/layout.tsx` 根布局含 Geist 字体、Analytics、SpeedInsights
- `app/page.tsx` 为 HeroUI 冒烟测试（待删除）
- 无 `content/`、`i18n/`、`lib/`、`components/` 目录
- 无 OpenSpec specs

**约束：**

- TypeScript `~6.0.3`、ESLint `~9.39.5` 版本锁定（见 AGENTS.md）
- HeroUI v3 beta 为 compound components，无 `Provider`，无 `Navbar` 组件
- Next.js 16 中 `middleware.ts` 已废弃，改用 `proxy.ts`
- remark/rehype 生态为 ESM-only，`next.config.ts` 已为 `.ts` 满足要求
- Turbopack 为默认打包器，动态 import MDX 需用模板字符串，remark/rehype 插件须用字符串名

## Goals / Non-Goals

**Goals:**

- 建立 `/[lang]/...` URL 路由结构，支持 `zh`/`en`，根路径自动检测重定向
- 实现桌面端（`lg+`）Header + 常驻 Sidebar 布局，移动端（`<lg`）Header + Drawer 布局
- 实现 MDX 文件驱动内容管线：`content/posts/` 读取、frontmatter 解析、动态 import 渲染
- 实现文章详情页 TOC 导航（桌面右侧 sticky / 移动端 Accordion 折叠）
- 实现深浅色主题切换（`next-themes`），无 hydration 闪烁
- 实现 GitHub 个人信息名片（GitHub API + ISR 缓存 1 小时）
- 提供 1-2 篇占位文章验证完整管线

**Non-Goals:**

- 文章搜索功能（阶段 2，Fuse.js）
- 文章评论功能（阶段 2，Giscus）
- Cloudflare R2 图片媒体接入（阶段 2）
- SEO 优化（sitemap、RSS、llms.txt、PWA）（阶段 3）
- 代码高亮（阶段 2，rehype-pretty-code 或 shiki）
- 在线编辑文章（文件驱动型架构不涉及）
- 文章删除 redirect 机制（首个 change 不删除文章，后续 change 再处理）
- `create-post` Agent Skill（阶段 3）

## Decisions

### Decision 1: i18n 方案--next-intl

**选择：** `next-intl@4.13.2`

**理由：**

- 社区生态成熟，App Router + RSC 原生支持
- 已验证 peerDependencies 含 `next: ^16.0.0`，支持 `proxy.ts`
- 支持 ICU 消息格式，未来扩展（复数、性别）无成本
- 支持 `setRequestLocale` 静态渲染按 locale 预渲染
- 未来前端动态切换语言、类型安全翻译键等需求有成熟方案

**备选方案与否决理由：**

- Next.js 16 原生 i18n（`getDictionary`）：无 ICU、无类型安全、无 `useTranslations` hook，扩展性弱
- `next-i18next`：仅适用 Pages Router，与 App Router 不兼容

### Decision 2: URL 段名--`[lang]`

**选择：** `[lang]`（而非 `[locale]`）

**理由：**

- 与 Next.js 16 官方 i18n 文档约定一致
- 短名，URL 更简洁
- 全代码统一用 `lang`（`params.lang`、`routing.locales` 内部变量），减少认知负担

**备选方案与否决理由：**

- `[locale]`：与需求文档 `.temp/my-first-blog-website.md` 原始描述一致，但与官方文档偏离。同步更新 AGENTS.md 中 `[locale]` -> `[lang]`。

### Decision 3: 根布局与 locale 布局分离

**选择：** 方案 A

- `app/layout.tsx`：`<html lang="zh">`/`<body>` + Geist 字体 + ThemeProvider + Analytics + SpeedInsights + 站点级静态 `metadata`
- `app/[lang]/layout.tsx`：Header + Sidebar + Main + `NextIntlClientProvider` + `setRequestLocale` + locale 级 `generateMetadata`（`hreflang` alternates）

**理由：**

- 根布局保持极简，未来可加非 locale 路由（如 `/api`、`/feed.xml`、`/sitemap.xml`）而不被 locale 逻辑污染
- locale 相关逻辑（翻译、Header 文案）集中在 `[lang]/layout.tsx`
- 根布局作为项目根级入口，便于未来接入 SEO 相关功能（sitemap、robots.txt、RSS、llms.txt、结构化数据）

**实现注意：** 根布局的 `<html lang>` 设为默认 locale `"zh"`，而非动态读取 locale。原因是根布局位于 `[lang]` 动态段之上，在构建时无法确定 locale；若调用 `getLocale()` 动态读取，会使所有页面退出静态预渲染（变为 server-rendered on demand）。设默认 `"zh"` 保留静态预渲染，locale 定位由 `[lang]/layout.tsx` 的 `generateMetadata` 返回的 `hreflang` alternates 承担——搜索引擎以 `hreflang` 作为语言/地区定位的主信号。详见风险 3。

**备选方案与否决理由：**

- 方案 B（根布局直接挪到 `[lang]/layout.tsx`）：绑死 locale，未来非 locale 路由需额外处理；且 `<html lang>` 虽可动态设置，但会失去根级入口
- 方案 C（根布局用 `getLocale()` 动态读取 locale 设置 `<html lang>`）：实测会使所有 23 个页面变为动态渲染（`ƒ`），放弃

### Decision 4: Header 导航--自建 flex 布局

**选择：** 自建 `flex` 容器 + HeroUI `Link`/`Button` + `lucide-react` 图标

**理由：**

- HeroUI v3 beta 无 `Navbar` 组件
- `Toolbar` 偏向工具栏语义，导航语义弱
- 自建布局完全可控，语义清晰（`<header><nav>`），Tailwind 响应式断点易实现
- 导航项数量少（首页、关于、GitHub），无需复杂键盘导航

**备选方案与否决理由：**

- `Toolbar`：语义不符，且需额外处理 `aria-label` 与导航角色
- 等 v3 正式版 `Navbar`：阻塞开发，时间未知

### Decision 5: 主题切换--next-themes

**选择：** `next-themes` + `attribute="class"` + `defaultTheme="light"` + `enableSystem`

**理由：**

- HeroUI v3 官方文档推荐 `next-themes` 做主题切换
- `attribute="class"` 与 HeroUI 主题 CSS（`.light`/`.dark` 类切换变量）天然兼容
- `suppressHydrationWarning` 避免 hydration 闪烁
- 主题持久化至 `localStorage`，用户切换后跨会话保留

**实现：**

- `components/theme/ThemeProvider.tsx`（`'use client'`）封装 `ThemeProvider`
- `app/layout.tsx` 包裹 `<ThemeProvider>`（根布局，不涉及 locale）
- `components/theme/ThemeToggle.tsx`（`'use client'`）用 `useTheme()` 切换，`lucide-react` 的 `Sun`/`Moon` 图标

### Decision 6: 移动端断点--`lg`

**选择：** Tailwind `lg` 断点（`>= 1024px`）

**理由：**

- 平板横屏（1024px+）显示桌面端布局，Sidebar 始终可见，体验更好
- 768-1023px（平板竖屏）显示移动端 Drawer 布局，避免 Sidebar 挤压主内容
- 与 GitHub 个人主页等参考站点一致

**备选方案与否决理由：**

- `md`（768px）：平板竖屏显示桌面端，Sidebar 过窄

### Decision 7: TOC 生成--正则提取

**选择：** `lib/toc.ts` 用正则从 markdown 原文提取 `^## ` 与 `^### ` heading

**理由：**

- 博客文章结构简单，正则足够
- 零额外依赖，零编译时插件复杂度
- 锚点 id 由 `rehype-slug` 生成，TOC 提取时用相同 slug 算法（`github-slugger`）保证一致

**实现：**

- 正则 `/^(#{2,3})\s+(.+)$/gm` 提取 h2/h3
- 用 `github-slugger`（`rehype-slug` 底层依赖）生成与 heading id 一致的锚点
- 若 `github-slugger` 未直接安装，可复用 `rehype-slug` 的 slug 逻辑或手动实现

**备选方案与否决理由：**

- 自定义 remark 插件：准确但复杂度高，阶段 1 过度设计
- `remark-toc`：生成内联 TOC，无法提取为独立数据结构供侧栏使用

### Decision 8: MDX 自定义组件--中等范围

**选择：** 方案 C

- `img` -> `next/image`（自动 width/height/blurDataURL）
- `a` -> 自定义（外链 `target="_blank"` + `rel="noopener noreferrer"`）
- `pre`/`code` -> 自定义样式（代码高亮留阶段 2）
- 其余元素（`h1`-`h6`、`p`、`ul`、`blockquote` 等）-> Tailwind `prose` 样式

**理由：**

- `img` 必须替换以用 `next/image` 优化
- `a` 替换保证外链安全
- 代码高亮涉及 shiki/rehype-pretty-code，阶段 2 接入
- `prose` 提供良好默认排版，无需逐元素自定义

**实现：** `mdx-components.tsx` 在根目录，导出 `useMDXComponents`。

### Decision 9: 文章列表数据源--真实读取 content/

**选择：** `lib/posts.ts` 真实读取 `content/posts/` 目录，放 1-2 篇占位文章

**理由：**

- 尽早验证完整 MDX 管道（文件 -> gray-matter -> 列表渲染）
- 阶段 2 只需增加文章数量，无需重构数据层
- 占位文章可验证 frontmatter schema、taxonomy 引用、多语言切换

### Decision 10: 占位文章内容--简短 Hello World

**选择：** 简短"Hello World"测试文章

**理由：**

- 验证管线为主，内容无关紧要
- 避免占用真实文章内容（首篇真实文章将单独撰写）
- 中英文各一份，验证多语言

### Decision 11: GitHub 名片--ISR 缓存 1 小时

**选择：** `fetch(url, { next: { revalidate: 3600 } })`

**理由：**

- GitHub API 有限流（未认证 60 次/小时/IP），每次请求都调会耗尽配额
- 1 小时缓存平衡实时性与配额消耗
- ISR 失效后自动重新获取，无需手动刷新

**实现：**

- `lib/github.ts` 封装 `getGitHubUser(username)`，`'server-only'`
- `components/layout/ProfileCard.tsx`（Server Component）调用并渲染
- GitHub 用户名通过环境变量 `GITHUB_USERNAME` 或配置文件配置

**备选方案与否决理由：**

- 每次请求都调：浪费 API 配额
- 构建时获取：数据会过时，且 Vercel 部署后无法自动更新

### Decision 12: next-intl 变量名--统一 `lang`

**选择：** 全代码统一用 `lang`（URL 段名、`params.lang`、`routing` 内部变量）

**理由：**

- 与 URL 段名 `[lang]` 一致，减少认知负担
- next-intl 文档用 `locale`，但库本身不强制变量名，`routing.locales` 等属性名不可变，但解构出的变量名自由

### Decision 13: 404 处理--默认 404 页

**选择：** `notFound()` 触发默认 404 页

**理由：**

- 语义清晰，SEO 友好
- 无效 locale（`/jp/...`）或不存在的 slug 直接 404
- 阶段 3 可自定义 `not-found.tsx` 美化

### Decision 14: next.config.ts 插件组合顺序

**选择：** `withNextIntl(withMDX(nextConfig))`

**理由：**

- `withMDX` 处理 `pageExtensions` 与 MDX 编译
- `withNextIntl` 注入 next-intl 的 RSC 支持
- 顺序：先 MDX（文件级），再 next-intl（请求级），外层包裹内层

**remark/rehype 插件用字符串名：**

```ts
remarkPlugins: ['remark-gfm', 'remark-frontmatter'],
rehypePlugins: ['rehype-slug'],
```

为兼容 Turbopack（Rust 不能接收 JS 函数），插件名须用字符串。这意味着这些插件须在 `package.json` 中安装为运行时依赖。

### Decision 15: next-intl request 配置文件位置

**选择：** `i18n/request.ts`（项目根目录下 `i18n/`，非 `src/i18n/`）

**理由：**

- 项目无 `src/` 目录（create-next-app 选项）
- `createNextIntlPlugin` 默认查找 `i18n/request.ts`
- 显式传路径 `createNextIntlPlugin('./i18n/request.ts')` 确保解析

## Risks / Trade-offs

### 风险 1：React Compiler 与 MDX 兼容性

- **风险：** `reactCompiler: true` 可能与 `@next/mdx` 生成的组件不兼容，导致编译错误或运行时异常
- **缓解：** 先按默认配置跑，若 MDX 渲染报错，在 `mdx-components.tsx` 或相关组件加 `'use no memo'` 指令退路；必要时为 MDX 相关文件禁用 React Compiler
- **验证：** `pnpm build` + `pnpm dev` 渲染占位文章，检查无报错

### 风险 2：Turbopack 动态 import MDX 模板字符串

- **风险：** `await import(\`@/content/posts/${slug}.${lang}.mdx\`)` 在 Turbopack 下可能无法正确解析
- **缓解：** Next.js 16 官方文档示例即此用法，已验证可行；若失败，退路为 `@mdx-js/mdx` 的 `compile` + `run` 手动编译
- **验证：** `pnpm build` 时 `generateStaticParams` 生成的所有文章页成功预渲染

### 风险 3：`<html lang>` 设置位置（已解决）

- **风险：** 根布局含 `<html>`，但 locale 在 `[lang]/layout.tsx` 才知道，无法直接在根布局设 `lang` 属性
- **缓解（已实施）：** 根布局 `<html lang="zh">` 设为默认 locale。locale 定位由 `[lang]/layout.tsx` 的 `generateMetadata` 返回 `alternates.languages`（`zh`/`en` 互指）承担，搜索引擎以 `hreflang` 为语言定位主信号
- **否决方案：** 根布局用 `getLocale()` 动态读取 locale 设置 `<html lang>`——实测会使所有 23 个页面退出静态预渲染变为动态（`ƒ`），放弃
- **验证：** `pnpm build` 确认 23 个页面均为静态预渲染（`●` SSG）；查看页面 HTML 的 `<head>` 含正确的 `hreflang` link 标签

### 风险 4：gray-matter 在 Edge Runtime

- **风险：** `gray-matter` 依赖 Node `fs`，若误用于 Edge Runtime 或 Client Component 会报错
- **缓解：** `lib/posts.ts`、`lib/taxonomy.ts` 顶部加 `'server-only'` 确保仅服务端调用
- **验证：** 构建无 Edge Runtime 相关错误

### 风险 5：TOC 锚点 id 与 rehype-slug 不一致

- **风险：** 正则提取 heading 文本后手动 slug 化，可能与 `rehype-slug` 生成的 id 不一致，导致 TOC 点击跳转失败
- **缓解：** 复用 `github-slugger`（`rehype-slug` 底层依赖）生成 slug，保证算法一致
- **验证：** 点击 TOC 条目，页面正确滚动至对应 heading

### 风险 6：next-themes hydration 闪烁

- **风险：** 主题切换在 SSR 时不知道用户偏好，可能先渲染浅色再闪烁至深色
- **缓解：** `<html suppressHydrationWarning>` + `next-themes` 的内联 script 在 HTML 解析阶段即设置 class
- **验证：** 深色主题下刷新页面，无浅色闪烁

### 风险 7：HeroUI v3 beta 稳定性

- **风险：** HeroUI v3 仍为 beta，API 可能在阶段 1 实现期间变更
- **缓解：** 锁定 `@heroui/react@^3.2.2`，实现前用 `heroui-react` MCP 查最新文档；Drawer、Accordion 等组件用法以 MCP 文档为准
- **验证：** `pnpm build` 无类型错误，组件渲染正常

## Migration Plan

本 change 为项目首个业务 change，无既有业务代码需迁移。部署步骤：

1. **分支：** 在 `main` 分支创建 feature 分支 `feature/phase1-core-foundation`
2. **实施：** 按 `tasks.md` 顺序执行，每完成一个任务组提交一次
3. **本地验证：** `pnpm format-lint` + `pnpm build` + `pnpm dev` 手动测试
4. **PR：** 提交 PR 至 `RuixeWolf/ruixe-blog`，Code Review 后合并至 `main`
5. **Vercel 部署：** Vercel 自动部署 `main`，PR 生成 preview 部署
6. **回滚：** 若部署后发现问题，revert 合并 commit，Vercel 自动重新部署上一版本

## Open Questions

无--所有 14 项决策已在探索阶段与用户确认。实现中若遇到新问题，记录至本节并提问。
