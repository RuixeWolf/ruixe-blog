# Implementation Tasks: add-llms-txt

> 任务拆分为 5 个组，按依赖顺序执行。每组可在独立 AI Session 中完成。
> 前置依赖：Group 1 -> Group 2 -> Group 3 + Group 4（并行）-> Group 5。

## 1. SEO 辅助函数（前置基础）

> 为后续 Route Handler 与 UI 组件提供 URL 构建能力。无 UI 改动，纯 lib 层。

- [x] 1.1 在 `lib/seo.ts` 新增 `buildPostMarkdownUrl(slug: string, locale: Locale): string` 函数，复用 `buildPostUrl` 构建 HTML URL 后追加 `/index.md`，返回绝对 URL
- [x] 1.2 为 `buildPostMarkdownUrl` 添加 JSDoc 注释，说明用途、参数、返回值，参考同文件 `buildPostUrl` 的注释风格
- [x] 1.3 运行 `pnpm lint` 确认无类型错误与 lint 问题
- [x] 1.4 验证：在 `app/[lang]/posts/[slug]/page.tsx` 临时调用或在 dev server 中确认 `buildPostMarkdownUrl('hello-world', 'zh')` 返回 `https://{siteUrl}/zh/posts/hello-world/index.md`

## 2. 文章 Markdown 版本 Route Handler

> 创建 `/{locale}/posts/{slug}/index.md` 路由，返回文章原始 Markdown 正文。参考 `app/[lang]/feed.xml/route.ts` 模式。

- [x] 2.1 创建目录 `app/[lang]/posts/[slug]/index.md/`，新建 `route.ts` 文件
- [x] 2.2 实现 `generateStaticParams()`：复用 `getAllPostSlugs()`（来自 `lib/posts.ts`），返回所有 `{ lang, slug }` 组合，参考 `app/[lang]/posts/[slug]/page.tsx` 的同名函数
- [x] 2.3 导出 `dynamicParams = false`，使未知 slug/locale 返回 404
- [x] 2.4 实现 `GET` handler：`await params` 获取 `{ lang, slug }`，用 `getPostBySlug(slug, lang as Locale)` 获取文章；若返回 `null` 则调用 `notFound()`；否则返回 `new Response(post.content, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })`
- [x] 2.5 为 `generateStaticParams`、`dynamicParams`、`GET` 添加 JSDoc 注释，说明构建时预渲染、404 行为、Content-Type，参考 `app/[lang]/feed.xml/route.ts` 的注释风格
- [x] 2.6 运行 `pnpm lint` 确认无类型错误与 lint 问题
- [x] 2.7 验证：`pnpm build` 后确认构建输出中 `/{locale}/posts/{slug}/index.md` 路由标记为 `○`（静态）
- [x] 2.8 验证：`pnpm dev` 后用 `curl http://localhost:3000/zh/posts/hello-world/index.md` 确认返回 `hello-world.zh.mdx` 的 frontmatter 剥离后正文，Content-Type 为 `text/markdown; charset=utf-8`
- [x] 2.9 验证：`curl http://localhost:3000/zh/posts/nonexistent/index.md` 返回 404

## 3. llms.txt 索引文件生成

> 创建 `/llms.txt` 根路径索引文件与 `lib/llms-txt.ts` 构建模块。依赖 Group 1 的 `buildPostMarkdownUrl`。

- [x] 3.1 创建 `lib/llms-txt.ts`，文件首行 `import 'server-only'`
- [x] 3.2 实现 `buildLlmsTxt(): string` 函数，构建 llms.txt 内容：
  - H1：`# ${siteConfig.siteTitle}`
  - 空行 + blockquote：`> ${siteConfig.siteDescription}` + 多语言与 Markdown URL 约定补充说明（英文）
  - 空行 + 每语言 H2 节：`## 中文文章`（zh）/ `## English Posts`（en），节下遍历 `getAllPosts(locale)` 生成 `- [${post.title}](${buildPostMarkdownUrl(post.slug, locale)}): ${post.description}`
  - 空行 + `## Optional` 节：GitHub 仓库链接（`siteConfig.githubUrl`）+ 每语言 RSS feed 链接（`buildFeedUrl(locale)`，来自 `lib/feed.ts`）
- [x] 3.3 为 `buildLlmsTxt` 添加 JSDoc 注释，说明 llms.txt v2 规范格式、分节逻辑、复用的模块（`siteConfig`、`getAllPosts`、`buildPostMarkdownUrl`、`buildFeedUrl`），参考 `lib/feed.ts` 的 `buildRssFeed` 注释风格
- [x] 3.4 创建 `app/llms.txt/route.ts`，实现 `GET` handler：调用 `buildLlmsTxt()`，返回 `new Response(content, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })`
- [x] 3.5 为 `app/llms.txt/route.ts` 的 `GET` 添加 JSDoc 注释，说明根路径索引文件、Content-Type、middleware 不拦截（路径含 `.` 被 matcher 排除），参考 `app/robots.ts` 的注释风格
- [x] 3.6 运行 `pnpm lint` 确认无类型错误与 lint 问题
- [x] 3.7 验证：`pnpm build` 后确认构建输出中 `/llms.txt` 路由标记为 `○`（静态）
- [x] 3.8 验证：`pnpm dev` 后用 `curl http://localhost:3000/llms.txt` 确认输出包含 H1 标题、blockquote 摘要、`## 中文文章`/`## English Posts` 分节、每篇文章列表项、`## Optional` 节
- [x] 3.9 验证：确认 Content-Type 为 `text/markdown; charset=utf-8`
- [x] 3.10 验证：确认仅单语言存在的文章只出现在对应语言节下（若当前 content/ 下有此类文章）

## 4. 文章详情页 Markdown 链接按钮（UI 组件 + 集成）

> 创建 client component 并集成到 PostLayout。依赖 Group 1 的 `buildPostMarkdownUrl`。

- [x] 4.1 在 `i18n/messages/zh.json` 的 `PostDetail` 对象新增 `"ViewMarkdown": "查看原文"` 与 `"CopyMarkdownLink": "复制 Markdown 链接"`
- [x] 4.2 在 `i18n/messages/en.json` 的 `PostDetail` 对象新增 `"ViewMarkdown": "View Markdown"` 与 `"CopyMarkdownLink": "Copy Markdown link"`
- [x] 4.3 创建 `components/posts/MarkdownLinkButton.tsx`，首行 `'use client'`
- [x] 4.4 实现 props 接口 `{ url: string }`（`url` 为绝对 Markdown URL，由 server 传入）
- [x] 4.5 实现"查看原文"链接按钮：使用 HeroUI `Link`（`@heroui/react`），`href={url}`、`target="_blank"`、`rel="noopener noreferrer"`，用 `buttonVariants({ variant: 'tertiary', size: 'sm' })`（`@heroui/styles`）样式，内含 `ExternalLink` 图标（`lucide-react`）+ `useTranslations('PostDetail')('ViewMarkdown')` 文本
- [x] 4.6 实现"复制"按钮：使用 HeroUI `Button`（`@heroui/react`），`isIconOnly`、`variant="tertiary"`、`size="sm"`，`onPress={handleCopy}`，`aria-label` 为 `useTranslations('PostDetail')(copied ? 'Copied' : 'CopyMarkdownLink')`，图标在 `copied` 时为 `Check`（`text-success`），否则为 `Copy`（参考 `CodeBlock.tsx` 的 `handleCopy` 逻辑）
- [x] 4.7 复制 `CodeBlock.tsx` 的 `handleCopy` 逻辑：`navigator.clipboard` 可用性检查、`writeText(url)`、`copied` 状态、2 秒重置计时器（`COPIED_RESET_DELAY = 2000`）、unmount 清理计时器、catch 静默失败
- [x] 4.8 为 `MarkdownLinkButton` 组件添加 JSDoc 注释，说明 props、双按钮行为、复用 CodeBlock 剪贴板模式、SSR 安全（Clipboard API 不可用静默失败），参考 `CodeBlock.tsx` 的注释风格
- [x] 4.9 修改 `components/posts/PostLayout.tsx`：在 header 的 tags 区块之后（`</div>` 闭合标签后、`</header>` 之前）插入 `<MarkdownLinkButton url={buildPostMarkdownUrl(meta.slug, locale)} />`
- [x] 4.10 在 `PostLayout.tsx` 顶部 import `MarkdownLinkButton` 与 `buildPostMarkdownUrl`，确保 import 顺序符合 `.prettierrc.json`（`@/*` 别名在第三方之后）
- [x] 4.11 运行 `pnpm lint` 确认无类型错误与 lint 问题
- [x] 4.12 验证：`pnpm dev` 后访问 `/zh/posts/hello-world`，确认 header 标签行之后展示"查看原文"链接按钮与复制图标按钮
- [x] 4.13 验证：点击"查看原文"在新标签页打开 `/zh/posts/hello-world/index.md`，内容为文章 Markdown 正文
- [x] 4.14 验证：点击复制按钮后图标变为 Check（绿色），2 秒后恢复为 Copy；粘贴确认剪贴板内容为绝对 URL
- [x] 4.15 验证：切换到 `/en/posts/hello-world` 确认按钮文本为英文（"View Markdown"）

## 5. 格式化、Lint、构建验证与文档

> 全局验证与收尾。依赖 Group 1-4 全部完成。

- [x] 5.1 运行 `pnpm format-lint` 统一格式化与 lint 修复
- [x] 5.2 运行 `pnpm build` 确认构建成功，所有新路由（`/llms.txt`、`/{locale}/posts/{slug}/index.md`）标记为 `○`（静态），无动态路由（`ƒ`）
- [x] 5.3 验证 `proxy.ts` matcher 未被修改（`/llms.txt` 与 `.md` 路径已被 `.*\\..*` 排除，无需改动），运行 `pnpm format-lint` 后确认 matcher 仍为纯字符串数组（未被 Prettier 转为 `String.raw`）
- [x] 5.4 端到端验证：`curl http://localhost:3000/llms.txt` 确认输出格式正确（H1 + blockquote + H2 分节 + 文章列表 + Optional 节）
- [x] 5.5 端到端验证：`curl http://localhost:3000/zh/posts/hello-world/index.md` 确认返回 Markdown 正文，无 frontmatter
- [x] 5.6 端到端验证：浏览器访问 `/zh/posts/hello-world`，确认 Markdown 链接按钮可见且两个按钮功能正常
- [x] 5.7 端到端验证：浏览器访问 `/en/posts/hello-world`，确认按钮文本为英文
- [x] 5.8 确认未修改 `next.config.ts`（本次变更不需要 rewrite 或其他配置改动）
- [x] 5.9 确认未引入新 npm 依赖（`package.json` 无变更）
- [x] 5.10 运行 OpenSpec 验证：`openspec validate add-llms-txt` 确认变更 artifacts 合规
