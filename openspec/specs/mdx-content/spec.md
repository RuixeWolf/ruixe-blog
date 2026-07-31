# MDX Content Specification

## Purpose

定义 Ruixe Blog 的文件驱动 MDX 内容架构，包括 `content/` 目录结构、frontmatter schema、taxonomy 多语言、MDX 渲染管线、全局 MDX 组件映射、文章列表与详情页读取与渲染、TOC 目录导航、占位内容，以及分类/标签列表页与关于页面。

## Requirements

### Requirement: Content 目录结构

系统 SHALL 在项目根目录维护 `content/` 目录，结构如下：`content/posts/{slug}.{lang}.mdx` 存放文章，`content/taxonomy/categories.yaml` 与 `content/taxonomy/tags.yaml` 存放分类与标签翻译。同一篇文章的不同语言版本 MUST 共用同一 `slug`，通过文件扩展名区分语言。

#### Scenario: 同一文章的两种语言版本

- **WHEN** 文章 `hello-world` 存在中文与英文版本
- **THEN** `content/posts/` 下存在 `hello-world.zh.mdx` 与 `hello-world.en.mdx` 两个文件

### Requirement: Frontmatter Schema

每篇文章的 MDX 文件 MUST 在顶部包含 YAML frontmatter，字段如下：`title`（字符串，必填）、`description`（字符串，必填）、`publishedTime`（`YYYY-MM-DD` 日期字符串，必填）、`modifiedTime`（`YYYY-MM-DD` 日期字符串，可选）、`category`（分类 ID 字符串，必填，须引用 `categories.yaml` 中的 ID）、`tags`（标签 ID 字符串数组，必填，可为空数组，每项须引用 `tags.yaml` 中的 ID）。

#### Scenario: 完整 frontmatter

- **WHEN** 解析 `hello-world.zh.mdx`
- **THEN** frontmatter 含 `title`、`description`、`publishedTime: '2026-07-21'`、`category: 'frontend'`、`tags: ['next-js', 'react']`

#### Scenario: 缺失必填字段

- **WHEN** 某文章 frontmatter 缺失 `title`
- **THEN** 文章解析在开发环境抛出明确错误，构建时该文章不生成

### Requirement: Taxonomy 多语言

系统 SHALL 通过 `content/taxonomy/categories.yaml` 与 `content/taxonomy/tags.yaml` 定义分类与标签。每个 taxonomy ID MUST 唯一，MUST 为所有受支持 locale（`zh`、`en`）提供 `name` 翻译。分类与标签均不允许层级嵌套。删除或修改 taxonomy ID 时 MUST 考虑 URL 兼容性（添加 redirect）。

#### Scenario: 分类多语言名称

- **WHEN** 当前 locale 为 `zh` 且渲染分类 `frontend`
- **THEN** 显示名称为 `前端开发`

- **WHEN** 当前 locale 为 `en` 且渲染分类 `frontend`
- **THEN** 显示名称为 `Frontend Development`

#### Scenario: taxonomy ID 缺失翻译

- **WHEN** 某分类 ID 在 `categories.yaml` 中缺少 `en` 翻译
- **THEN** 构建时抛出明确错误，提示缺失的 locale

### Requirement: MDX 渲染管线

系统 SHALL 通过 `@next/mdx` 配置 MDX 渲染，在 `next.config.ts` 中组合 `withMDX` 与 `withNextIntl`。`pageExtensions` MUST 包含 `mdx`。remark/rehype 插件 MUST 包括：`remark-gfm`（GitHub Flavored Markdown）、`remark-frontmatter`（解析 frontmatter）、`rehype-slug`（为 headings 添加 id 锚点）。为兼容 Turbopack，插件名 MUST 以字符串形式声明。

#### Scenario: MDX 文件作为页面渲染

- **WHEN** 用户访问 `/zh/posts/hello-world`
- **THEN** 系统动态 import `@/content/posts/hello-world.zh.mdx` 并渲染其默认导出组件

#### Scenario: GFM 表格渲染

- **WHEN** MDX 内容包含 GFM 表格语法
- **THEN** 渲染为 HTML `<table>`，支持表格、删除线、任务列表等 GFM 特性

#### Scenario: heading 锚点

- **WHEN** MDX 内容包含 `## 简介`
- **THEN** 渲染的 `<h2>` 元素含 `id` 属性（如 `id="简介"` 或其 slug 化形式），可供 TOC 锚点跳转

### Requirement: 全局 MDX 组件映射

系统 SHALL 在项目根目录维护 `mdx-components.tsx`，将 HTML 元素映射至自定义 React 组件。映射范围 MUST 包括：`img`（映射至 `next/image`，自动获取宽高与 blurDataURL）、`a`（外链 `target="_blank"` + `rel="noopener noreferrer"`）、`pre`/`code`（自定义样式，代码高亮留待阶段 2）。其余元素（`h1`-`h6`、`p`、`ul`、`blockquote` 等）SHALL 使用 Tailwind Typography（`prose`）样式。

#### Scenario: MDX 中的图片使用 next/image

- **WHEN** MDX 内容含 `![alt](/img/foo.png)`
- **THEN** 渲染为 `next/image` 的 `<Image>` 组件，带 `alt`、`width`、`height`

#### Scenario: 外链安全属性

- **WHEN** MDX 内容含 `[example](https://example.com)`
- **THEN** 渲染的 `<a>` 含 `target="_blank"` 与 `rel="noopener noreferrer"`

### Requirement: 文章列表读取

系统 SHALL 通过 `lib/posts.ts`（标记 `'server-only'`）使用 `gray-matter` 解析 `content/posts/` 下所有 MDX 文件的 frontmatter，返回文章元数据列表。列表 MUST 按 `publishedTime` 降序排列（最新在前）。读取函数 MUST 支持按 locale 过滤、按 category 过滤、按 tag 过滤。`getAllPosts(lang)` SHALL 在 production 模式（`process.env.NODE_ENV === 'production'`）下使用 per-locale 的模块级 `Map` 缓存已解析的文章列表，避免重复 fs 扫描；在 development 模式下 MUST 不缓存，每次调用读文件系统以保证新增/修改文章立即可见。系统 SHALL 提供 `getCategoryPostCounts(lang)` 聚合函数，返回 `Record<string, number>`（categoryId 到文章数量的映射），该函数 MUST 通过遍历 `getAllPosts(lang)` 结果按 `post.category` 字段聚合计算。

#### Scenario: 获取所有中文文章

- **WHEN** 调用 `getAllPosts('zh')`
- **THEN** 返回所有 `*.zh.mdx` 文件的元数据，按 `publishedTime` 降序排列

#### Scenario: 按分类过滤文章

- **WHEN** 调用 `getPostsByCategory('frontend', 'zh')`
- **THEN** 返回 frontmatter `category` 为 `frontend` 的所有中文文章

#### Scenario: 按 tag 过滤文章

- **WHEN** 调用 `getPostsByTag('next-js', 'en')`
- **THEN** 返回 frontmatter `tags` 数组含 `next-js` 的所有英文文章

#### Scenario: 统计分类文章计数

- **WHEN** 调用 `getCategoryPostCounts('zh')` 且当前有 `frontend` 分类 1 篇文章、`backend` 分类 0 篇文章
- **THEN** 返回对象中 `frontend` 键值为 `1`，`backend` 键不存在（调用方用 `?? 0` 处理为 0）

#### Scenario: production 模式下 getAllPosts 缓存复用

- **WHEN** 在 `process.env.NODE_ENV === 'production'` 下多次调用 `getAllPosts('zh')`
- **THEN** 首次调用执行 fs 扫描与解析，后续调用返回缓存的同一数组引用，不重复扫描文件系统

#### Scenario: development 模式下 getAllPosts 不缓存

- **WHEN** 在 `process.env.NODE_ENV === 'development'` 下调用 `getAllPosts('zh')`，随后新增一篇 `new-post.zh.mdx` 文件，再次调用 `getAllPosts('zh')`
- **THEN** 第二次调用读文件系统，返回包含 `new-post` 的文章列表

### Requirement: 文章详情页渲染

系统 SHALL 在 `app/[lang]/posts/[slug]/page.tsx` 渲染文章详情。页面 MUST：校验 `lang` 与 `slug`；通过 `lib/posts.ts` 读取 frontmatter 元数据；动态 `import` 对应 `{slug}.{lang}.mdx` 文件并渲染；为 `<html>` 或文章容器设置基于 frontmatter 的 `metadata`（title、description、Open Graph）。文章不存在时 MUST 调用 `notFound()`。

#### Scenario: 渲染存在的文章

- **WHEN** 用户访问 `/zh/posts/hello-world` 且文件存在
- **THEN** 页面渲染文章标题、发布时间、分类、标签、正文内容

#### Scenario: 文章在当前 locale 不存在

- **WHEN** 用户访问 `/zh/posts/nonexistent` 且 `nonexistent.zh.mdx` 不存在
- **THEN** 系统返回 404

#### Scenario: 文章元数据注入

- **WHEN** 渲染文章详情页
- **THEN** 页面 `<title>` 与 `<meta name="description">` 来自 frontmatter 的 `title` 与 `description`

### Requirement: 文章详情页 generateStaticParams

系统 SHALL 在文章详情页通过 `generateStaticParams` 返回所有 `{ lang, slug }` 组合，使所有文章在构建时静态预渲染。

#### Scenario: 构建时生成所有文章静态页

- **WHEN** 执行 `next build` 且 `content/posts/` 含 `hello-world.zh.mdx` 与 `hello-world.en.mdx`
- **THEN** 生成 `/zh/posts/hello-world` 与 `/en/posts/hello-world` 两个静态 HTML

### Requirement: TOC 目录导航

系统 SHALL 通过 `lib/toc.ts` 使用正则表达式从文章 markdown 原文提取 `## ` 与 `### ` 开头的 heading（对应 h2、h3），生成 TOC 条目列表（含层级、文本、锚点 id）。锚点 id MUST 与 `rehype-slug` 生成的 heading id 一致，以支持点击跳转。

#### Scenario: 提取 TOC

- **WHEN** 文章 markdown 含 `## 简介`、`### 背景`、`## 总结`
- **THEN** TOC 含 3 个条目，层级依次为 `h2`、`h3`、`h2`

#### Scenario: 桌面端 TOC 显示在右侧

- **WHEN** 桌面端（`lg+`）渲染文章详情页
- **THEN** TOC 显示在主内容右侧，`sticky` 定位，点击条目滚动至对应 heading

#### Scenario: 移动端 TOC 折叠在正文上方

- **WHEN** 移动端（`<lg`）渲染文章详情页
- **THEN** TOC 以 HeroUI `Accordion` 形式显示在文章元信息与正文之间，默认折叠

### Requirement: 占位内容

系统 SHALL 在 `content/posts/` 提供 1-2 篇占位文章（`hello-world.{zh,en}.mdx`），内容为简短的"Hello World"测试文章，用于验证完整内容管线。占位文章的 frontmatter MUST 符合 schema，category 与 tags MUST 引用 `taxonomy/` 中已定义的 ID。

#### Scenario: 占位文章可被列表页读取

- **WHEN** 访问首页 `/zh`
- **THEN** 文章列表显示 `hello-world` 中文版本的标题与摘要

#### Scenario: 占位文章可被详情页渲染

- **WHEN** 访问 `/en/posts/hello-world`
- **THEN** 页面渲染英文版占位文章的完整内容

### Requirement: 分类与标签列表页

系统 SHALL 提供 `app/[lang]/categories/[categoryId]/page.tsx` 与 `app/[lang]/tags/[tagId]/page.tsx` 页面，分别展示指定分类或标签下的文章列表。页面 MUST 校验 `categoryId`/`tagId` 是否存在于对应 taxonomy 文件，不存在时返回 404。列表渲染 SHALL 复用首页文章列表组件。

#### Scenario: 访问存在的分类页

- **WHEN** 用户访问 `/zh/categories/frontend` 且 `frontend` 存在于 `categories.yaml`
- **THEN** 页面显示 `frontend` 分类的中文名称，以及该分类下所有中文文章列表

#### Scenario: 访问不存在的标签页

- **WHEN** 用户访问 `/zh/tags/nonexistent`
- **THEN** 系统返回 404

### Requirement: 关于页面

系统 SHALL 提供 `app/[lang]/about/page.tsx` 页面，展示关于博主与关于本博客的信息。页面内容 SHALL 通过 `next-intl` messages 或独立 MDX 文件提供多语言版本。

#### Scenario: 访问关于页

- **WHEN** 用户访问 `/zh/about`
- **THEN** 页面显示中文版关于信息

### Requirement: 文章列表页与首页等价

系统 SHALL 使 `app/[lang]/page.tsx`（首页）与 `app/[lang]/posts/page.tsx`（文章列表页）渲染相同的文章列表内容。首页 SHALL 额外在移动端显示简易版个人信息卡片（位于文章列表上方）。

#### Scenario: 首页与文章列表页内容一致

- **WHEN** 用户依次访问 `/zh` 与 `/zh/posts`
- **THEN** 两页显示相同的文章列表（标题、摘要、日期、分类、标签）

### Requirement: 文章删除与重定向

系统 SHALL 保证文章被删除后，其旧 URL（`/[lang]/posts/<slug>`）通过永久重定向指向有效目标，而非返回 404，以避免死链并保留 SEO 链接权重。重定向规则 MUST 由 `content/redirects.yaml`（重定向清单）驱动，`next.config.ts` 的 `redirects()` 在构建时与开发时读取该清单并展开为 308 永久重定向规则。删除操作 MUST 通过 `post-deletion` 能力定义的 CLI 脚本完成，该脚本同时负责删除 MDX 文件与向重定向清单追加记录。系统 MUST NOT 依赖运行时数据库或外部服务来维护已删文章的重定向映射。

#### Scenario: 已删文章旧 URL 重定向至列表页

- **WHEN** 文章 `hello-world` 被删除且 `content/redirects.yaml` 含其记录（默认目标）
- **THEN** 访问 `/zh/posts/hello-world` 返回 308 重定向至 `/zh/posts`，访问 `/en/posts/hello-world` 返回 308 重定向至 `/en/posts`

#### Scenario: 已删文章不产生 404

- **WHEN** 文章 `hello-world` 被删除并登记重定向后，用户访问其旧 URL
- **THEN** 系统返回 308 永久重定向，不调用 `notFound()`，不渲染 `app/[lang]/not-found.tsx`

#### Scenario: 未删除文章不受影响

- **WHEN** `content/redirects.yaml` 不含某 slug 的记录，且该 slug 的 MDX 文件存在
- **THEN** 访问该 slug 的详情页正常渲染文章内容，不触发重定向

### Requirement: 重定向清单作为单一事实来源

系统 SHALL 将 `content/redirects.yaml` 作为已删文章重定向映射的单一事实来源。该文件 MUST 以 YAML 数组形式存储，每项含 `slug`、`deletedAt`、`locales` 字段与可选的 `destination` 字段。`next.config.ts` `redirects()` MUST 是该文件的唯一消费者，MUST NOT 在其他位置（如代码内联数组、环境变量）维护已删文章的重定向规则。该文件由删除脚本管理，手动编辑需谨慎。

#### Scenario: 构建时读取重定向清单

- **WHEN** 执行 `next build` 且 `content/redirects.yaml` 存在并含有效记录
- **THEN** 构建产物包含清单展开后的全部 308 重定向规则

#### Scenario: 清单文件不存在时不阻断构建

- **WHEN** `content/redirects.yaml` 不存在时执行 `next build`
- **THEN** `redirects()` 返回空数组，构建正常完成，不产生任何重定向规则

### Requirement: 删除后 generateStaticParams 行为

文章详情页的 `generateStaticParams` MUST 通过扫描 `content/posts/` 目录下实际存在的 MDX 文件生成静态参数，已删文章的 slug MUST NOT 出现在预渲染结果中。当 `content/redirects.yaml` 含某 slug 的记录但 `content/posts/` 下已无对应文件时，该 slug MUST NOT 被预渲染，其旧 URL 完全由 `redirects()` 兜底。

#### Scenario: 已删 slug 不被预渲染

- **WHEN** `hello-world` 被删除（MDX 文件已移除）且重定向清单含其记录
- **THEN** `generateStaticParams` 不返回 `hello-world` 的 `{ lang, slug }` 组合，构建产物无其静态 HTML

#### Scenario: redirects 优先于 notFound

- **WHEN** 用户访问已删文章的旧 URL
- **THEN** `redirects()` 返回的 308 规则先生效，文章详情页组件不运行、`notFound()` 不触发
