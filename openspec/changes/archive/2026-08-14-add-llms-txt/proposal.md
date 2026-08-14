## Why

博客网站的受众除了人类读者，还包括 LLM/Agent（如编程助手检索文章内容、聊天助手回答关于博客的问题）。现有页面均为 HTML，LLM 需从 HTML 中剥离导航/脚本/样式才能提取正文，效率低且易丢失上下文。llms.txt 规范（v2）提供了一种标准化的 Markdown 索引文件方案，让 LLM 高效发现并获取站点内容的纯净 Markdown 版本。作为 AI Coding 时代产物的个人博客，提供 llms.txt 既是技术实践，也是内容可发现性的提升。

## What Changes

- 新增 `/llms.txt` 根路径索引文件（Route Handler），遵循 llms.txt v2 规范格式：H1 标题 + blockquote 摘要 + 按语言分节的 H2 文件列表 + Optional 节，链接指向每篇文章的 Markdown 版本 URL
- 新增文章 Markdown 版本 Route Handler（`/[lang]/posts/[slug]/index.md`），返回 `PostMeta.content`（frontmatter 剥离后的原始 Markdown 正文），通过 `generateStaticParams` 构建时预渲染
- 新增 `lib/llms-txt.ts`（server-only）模块，封装 llms.txt 内容构建逻辑
- 新增 `lib/seo.ts` 中的 `buildPostMarkdownUrl` 辅助函数，构建文章 Markdown 版本的绝对 URL
- 新增文章详情页 Markdown 链接按钮组件（`components/posts/MarkdownLinkButton.tsx`，client component），提供"查看原文"（新标签页打开 .md）与"复制 Markdown 链接"（复制绝对 URL 到剪贴板）两个操作
- 修改 `components/posts/PostLayout.tsx`，在 header 标签行之后插入 Markdown 链接按钮
- 新增 i18n 消息键 `PostDetail.ViewMarkdown` 与 `PostDetail.CopyMarkdownLink`（zh/en 双语）

## Capabilities

### New Capabilities

- `llms-txt`: llms.txt 规范实现能力，包括根路径索引文件生成、文章 Markdown 版本路由、以及文章详情页的 Markdown 链接入口

### Modified Capabilities

（无 -- 本次变更不修改任何既有 spec 的需求级别行为）

## Impact

- **新增文件**：`app/llms.txt/route.ts`、`app/[lang]/posts/[slug]/index.md/route.ts`、`lib/llms-txt.ts`、`components/posts/MarkdownLinkButton.tsx`
- **修改文件**：`lib/seo.ts`（新增 helper）、`components/posts/PostLayout.tsx`（插入按钮）、`i18n/messages/zh.json`、`i18n/messages/en.json`（新增消息键）
- **构建产物**：`/llms.txt` 静态文件、每篇文章 × locale 的 `/{locale}/posts/{slug}/index.md` 静态文件
- **无依赖变更**：不引入新 npm 包，完全复用现有 `lib/posts.ts`、`lib/taxonomy.ts`、`lib/site-config.ts`、`lib/seo.ts` 模块
- **无破坏性变更**：不修改任何现有 URL 或页面行为；既有 HTML 文章页、RSS feed、sitemap 均不受影响
- **SSG 影响**：新增的 Route Handler 通过 `generateStaticParams` 预渲染，所有路由保持静态生成（`○`），不引入动态渲染
- **proxy.ts**：`/llms.txt` 与 `/{locale}/posts/{slug}/index.md` 路径含 `.`，已被现有 matcher `.*\\..*` 正则排除，middleware 不拦截，无需修改 matcher
