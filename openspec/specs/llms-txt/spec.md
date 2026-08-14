# llms-txt Specification

## Purpose

定义 Ruixe Blog 的 llms.txt 规范实现能力，使 LLM/Agent 能高效发现并获取站点文章内容的纯净 Markdown 版本。包括根路径 `/llms.txt` 索引文件生成、文章 Markdown 版本路由（`/[locale]/posts/<slug>/index.md`）、以及文章详情页中的 Markdown 链接入口（查看与复制）。

## Requirements

### Requirement: 根路径 llms.txt 索引文件生成

系统 SHALL 在根路径 `/llms.txt` 生成一个遵循 llms.txt v2 规范的 Markdown 索引文件。文件 MUST 以 H1 标题开头，内容为 `siteConfig.siteTitle`。H1 之后 MUST 紧跟一个 blockquote（`>` 前缀）摘要，内容为 `siteConfig.siteDescription`，并补充说明文章多语言支持与 Markdown 版本 URL 约定（在文章 URL 后追加 `/index.md`）。文件 MUST 为每个受支持 locale 生成一个 H2 分节，节标题为该语言的本地化名称（`中文文章` / `English Posts`）。每个 H2 节下 MUST 为该 locale 下 `getAllPosts(locale)` 返回的每篇文章生成一个 Markdown 列表项，格式为 `- [{title}]({markdownUrl}): {description}`，其中 `title` 与 `description` 来自文章 frontmatter，`markdownUrl` 为文章 Markdown 版本的绝对 URL。文件 MUST 包含一个标题为 `Optional` 的 H2 节，列出次要信息：GitHub 仓库链接与每语言的 RSS feed 链接。`/llms.txt` SHALL 通过 Route Handler 实现，HTTP 响应 `Content-Type` MUST 为 `text/markdown; charset=utf-8`。

#### Scenario: llms.txt 包含 H1 标题与 blockquote 摘要

- **WHEN** 系统生成 `/llms.txt`
- **THEN** 文件首行为 `# Ruixe Blog`（`siteConfig.siteTitle`），第二行为空行，第三行为 `> ` 后跟 `siteConfig.siteDescription` 及多语言与 Markdown URL 约定的补充说明

#### Scenario: 每语言独立 H2 分节

- **WHEN** 系统支持 `zh` 与 `en` 两个 locale
- **THEN** `/llms.txt` 包含 `## 中文文章` 与 `## English Posts` 两个 H2 节

#### Scenario: 文章列表项格式

- **WHEN** 文章 `hello-world` 的 zh 版本 frontmatter 为 `title: '我的第一个博客'`、`description: '记录开发过程'`
- **THEN** `/llms.txt` 的 `## 中文文章` 节下存在列表项 `- [我的第一个博客](https://{siteUrl}/zh/posts/hello-world/index.md): 记录开发过程`

#### Scenario: Optional 节包含 GitHub 与 RSS 链接

- **WHEN** 系统生成 `/llms.txt`
- **THEN** 文件包含 `## Optional` 节，且该节下包含指向 `siteConfig.githubUrl` 的 GitHub 仓库链接项，以及指向 `/{locale}/feed.xml` 的每语言 RSS feed 链接项

#### Scenario: llms.txt 响应 Content-Type

- **WHEN** 客户端请求 `/llms.txt`
- **THEN** HTTP 响应头 `Content-Type` 为 `text/markdown; charset=utf-8`

#### Scenario: 仅列出实际存在的语言版本

- **WHEN** 文章 `draft-post` 只存在 `draft-post.zh.mdx` 而无 `draft-post.en.mdx`
- **THEN** `/llms.txt` 的 `## 中文文章` 节下列出该文章，`## English Posts` 节下不列出该文章

### Requirement: 文章 Markdown 版本路由

系统 SHALL 为每篇文章的每个存在语言版本生成一个 Markdown 版本路由，URL 为 `/{locale}/posts/{slug}/index.md`。该路由 SHALL 通过 Route Handler 实现，并通过 `generateStaticParams` 在构建时为每篇存在的文章 × locale 组合预渲染为静态文件。`dynamicParams` MUST 为 `false`，使不存在的 slug 或 locale 请求返回 404 而非动态生成。路由的 HTTP 响应 body MUST 为文章的原始 Markdown 正文（frontmatter 剥离后的内容，即 `PostMeta.content`），响应 `Content-Type` MUST 为 `text/markdown; charset=utf-8`。当请求的 slug 在对应 locale 下不存在时，路由 MUST 返回 404。

#### Scenario: 文章 Markdown 版本构建时静态化

- **WHEN** 执行 `pnpm build`
- **THEN** 每篇存在的文章 × locale 组合生成一个静态 `/{locale}/posts/{slug}/index.md` 文件，运行时直接返回缓存

#### Scenario: Markdown 版本返回原始正文

- **WHEN** 客户端请求 `/zh/posts/hello-world/index.md`
- **THEN** HTTP 响应 body 为 `hello-world.zh.mdx` 文件 frontmatter 剥离后的原始 Markdown 正文，不包含 YAML frontmatter

#### Scenario: Markdown 版本响应 Content-Type

- **WHEN** 客户端请求 `/zh/posts/hello-world/index.md`
- **THEN** HTTP 响应头 `Content-Type` 为 `text/markdown; charset=utf-8`

#### Scenario: 不存在的文章返回 404

- **WHEN** 客户端请求 `/zh/posts/nonexistent-slug/index.md`（该 slug 无对应 `.mdx` 文件）
- **THEN** 系统返回 404 响应

#### Scenario: 不存在的 locale 返回 404

- **WHEN** 客户端请求 `/fr/posts/hello-world/index.md`（`fr` 非受支持 locale）
- **THEN** 系统返回 404 响应

### Requirement: 文章 Markdown 版本 URL 构建辅助函数

系统 SHALL 提供 `buildPostMarkdownUrl` 辅助函数，接收文章 slug 与 locale，返回文章 Markdown 版本的绝对 URL（`{siteUrl}/{locale}/posts/{slug}/index.md`）。该函数 SHALL 复用 `buildPostUrl` 构建 HTML 版本 URL 后追加 `/index.md` 后缀。

#### Scenario: 构建文章 Markdown 版本 URL

- **WHEN** 调用 `buildPostMarkdownUrl('hello-world', 'zh')`，且 `siteConfig.siteUrl` 为 `https://ruixe-blog.vercel.app`
- **THEN** 返回 `https://ruixe-blog.vercel.app/zh/posts/hello-world/index.md`

### Requirement: 文章详情页 Markdown 链接按钮

文章详情页（`/[locale]/posts/<slug>`）的 header 区域 SHALL 展示 Markdown 链接按钮组件，位于文章元信息（分类、发布时间、标签）之后。组件 SHALL 提供两个操作：一个"查看原文"链接按钮（在新标签页打开文章 Markdown 版本 URL，即 `/{locale}/posts/{slug}/index.md`）与一个"复制 Markdown 链接"图标按钮（将文章 Markdown 版本的绝对 URL 复制到剪贴板）。组件 MUST 为 client component，以支持剪贴板交互。"查看原文"按钮 SHALL 使用 `target="_blank"` 与 `rel="noopener noreferrer"` 属性在新标签页打开。复制按钮在复制成功后 MUST 提供视觉反馈（图标从"复制"切换为"已复制"状态，持续 2 秒后恢复）。组件 SHALL 通过 i18n 消息键 `PostDetail.ViewMarkdown` 与 `PostDetail.CopyMarkdownLink` 获取本地化的按钮标签与 aria-label。当 Clipboard API 不可用时（SSR 或非安全上下文），复制操作 SHALL 静默失败，不进入卡死的"已复制"状态。

#### Scenario: 查看原文按钮在新标签页打开 Markdown 版本

- **WHEN** 用户在文章详情页点击"查看原文"链接按钮
- **THEN** 浏览器在新标签页打开 `/{locale}/posts/{slug}/index.md` URL

#### Scenario: 复制按钮复制绝对 URL 到剪贴板

- **WHEN** 用户在文章详情页点击"复制 Markdown 链接"按钮
- **THEN** 文章 Markdown 版本的绝对 URL（`{siteUrl}/{locale}/posts/{slug}/index.md`）被复制到系统剪贴板

#### Scenario: 复制成功后视觉反馈

- **WHEN** 用户点击复制按钮且 Clipboard API 写入成功
- **THEN** 按钮图标切换为"已复制"状态图标，2 秒后自动恢复为"复制"状态图标

#### Scenario: Clipboard API 不可用时静默失败

- **WHEN** 用户在非安全上下文（HTTP，非 HTTPS）或 SSR 阶段点击复制按钮
- **THEN** 复制操作静默失败，按钮不进入"已复制"状态

#### Scenario: 按钮位于文章元信息之后

- **WHEN** 用户访问文章详情页 `/zh/posts/hello-world`
- **THEN** 页面 header 区域在分类、发布时间、标签之后展示 Markdown 链接按钮

#### Scenario: 按钮标签本地化

- **WHEN** 用户访问中文文章详情页 `/zh/posts/hello-world`
- **THEN** "查看原文"按钮的文本为 `PostDetail.ViewMarkdown` 的 zh 翻译值
- **WHEN** 用户访问英文文章详情页 `/en/posts/hello-world`
- **THEN** "查看原文"按钮的文本为 `PostDetail.ViewMarkdown` 的 en 翻译值
