## Why

项目当前仅为 HeroUI 冒烟测试脚手架（`app/page.tsx`），无任何业务结构。阶段 1 需建立博客网站的三大基石——国际化路由、响应式页面布局、MDX 文件驱动的内容管线——使真实博客文章能够被发布、浏览，并为后续阶段（搜索、评论、SEO、PWA 等）提供稳定的架构底座。

## What Changes

- **BREAKING**: 移除 `app/page.tsx` 冒烟测试页，根路径改为通过 `proxy.ts` 重定向至 `/[lang]`
- 新增 `app/[lang]/` 路由结构，覆盖首页、文章列表、文章详情、分类、标签、关于页
- 新增 `next-intl` i18n 体系：`proxy.ts` 语言检测重定向、`i18n/` 配置目录、`messages/{zh,en}.json` UI 文案
- 新增响应式页面布局：桌面端（`lg+`）常驻 Header + 左侧 Sidebar；移动端（`<lg`）Header + Drawer 抽屉
- 新增深浅色主题切换（`next-themes`），Header 右侧功能栏含主题切换按钮
- 新增 `content/` 目录：`posts/{slug}.{lang}.mdx` 文章 + `taxonomy/{categories,tags}.yaml` 分类标签
- 新增 `@next/mdx` 文件驱动渲染管线：`next.config.ts` 组合 `withMDX` + `withNextIntl`，`mdx-components.tsx` 全局组件映射
- 新增文章详情页：动态 import MDX、gray-matter 解析 frontmatter、正则提取 headings 生成 TOC 导航
- 新增 `lib/` 服务端工具：`posts.ts`（文章读取）、`taxonomy.ts`（YAML 加载）、`toc.ts`（TOC 提取）、`github.ts`（GitHub API + ISR 缓存）
- 新增 1-2 篇占位文章（`hello-world.{zh,en}.mdx`）用于验证完整内容管线

## Capabilities

### New Capabilities

- `i18n-routing`: 基于 `[lang]` URL 前缀的国际化路由，包含语言检测重定向、locale 校验、语言切换 UI、UI 文案多语言
- `app-layout`: 持久化页面布局框架，包含 Header 导航、左侧 Sidebar（GitHub 名片 + 分类 + 标签）、移动端 Drawer、`lg` 断点响应式切换、深浅色主题切换
- `mdx-content`: MDX 文件驱动的内容管线，包含 `content/` 目录结构、frontmatter schema、taxonomy 多语言、MDX 渲染、文章详情页 TOC 导航

### Modified Capabilities

无（项目尚无既有 spec）。

## Impact

**新增依赖（package.json）：**

- `next-intl` - i18n 路由与文案
- `@next/mdx`、`@mdx-js/loader`、`@mdx-js/react`、`@types/mdx` - MDX 渲染
- `gray-matter` - frontmatter 解析
- `remark-gfm`、`remark-frontmatter`、`rehype-slug` - MDX 插件（GFM、frontmatter、heading 锚点）
- `next-themes` - 主题切换
- `yaml` - taxonomy YAML 解析

**配置文件变更：**

- `next.config.ts` - 组合 `withMDX`（remark/rehype 插件用字符串名以兼容 Turbopack）+ `withNextIntl`
- `proxy.ts`（新增）- `next-intl/middleware` 语言检测重定向
- `mdx-components.tsx`（新增）- `@next/mdx` 必需的全局组件映射

**代码结构变更：**

- `app/layout.tsx` - 重构为根布局（`<html lang="zh">`/`<body>` + 字体 + ThemeProvider + Analytics + SpeedInsights + 站点级静态 `metadata`）
- `app/page.tsx` - 删除（根路径由 proxy.ts 重定向）
- `app/[lang]/`（新增）- locale 布局（Header/Sidebar/NextIntlClientProvider/`setRequestLocale`/`generateMetadata` hreflang）+ 所有业务页面
- `components/layout/`（新增）- Header、MobileHeader、Sidebar、MobileDrawer、ProfileCard
- `components/theme/`（新增）- ThemeProvider、ThemeToggle
- `components/posts/`（新增）- PostList、TableOfContents、PostLayout
- `lib/`（新增）- posts.ts、taxonomy.ts、toc.ts、github.ts（均 `'server-only'`）
- `i18n/`（新增）- routing.ts、navigation.ts、request.ts、messages/
- `content/`（新增）- posts/、taxonomy/

**版本约束（来自 AGENTS.md，不得变更）：**

- `typescript: ~6.0.3`（TS 7 崩溃 `@typescript-eslint/typescript-estree`）
- `eslint: ~9.39.5`（ESLint 10 崩溃 `eslint-plugin-react`）

**风险点：**

- React Compiler 与 MDX 生成组件的兼容性需验证；若有问题，用 `'use no memo'` 退路
- `next-intl@4.13.2` 已验证支持 `next: ^16.0.0` 与 `proxy.ts`
- `gray-matter` 依赖 Node `fs`，相关 `lib/` 文件须标记 `'server-only'`，仅在 Server Component 中使用
