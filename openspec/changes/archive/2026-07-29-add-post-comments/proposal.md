## Why

博客文章详情页缺少读者互动入口。需求文档（`.temp/my-first-blog-website.md`）将"文章评论功能"列为阶段 2 功能，技术选型已确定为 Giscus（基于 GitHub Discussions）——无需自建用户登录、评论管理后端，零运维成本，契合文件驱动型博客的整体架构。当前阶段 1 核心功能已上线，阶段 2 的文章搜索功能已完成（PR #5），评论功能是阶段 2 的下一项。

## What Changes

- 在 `content/site.yaml` 新增 `giscus` 配置块（repo、repoId、category、categoryId、mapping、reactionsEnabled、inputPosition、strict、emitMetadata 等字段），随代码提交至 Git
- 扩展 `lib/site-config.ts`：新增 `GiscusConfig` 类型与校验逻辑，`siteConfig` 暴露 `giscus` 字段（fail-fast 校验，模块级缓存复用现有模式）
- 新建客户端组件 `components/posts/Comments.tsx`（`'use client'`），封装 `@giscus/react` 的 `<Giscus>` 组件，负责：
  - 从 `next-themes` 读取 `resolvedTheme` 并映射为 Giscus 内置主题（`light` / `dark_dimmed`）
  - 将博客 locale（`zh`/`en`）映射为 Giscus lang（`zh-CN`/`en`）
  - 通过 `postMessage` 平滑切换 iframe 主题（避免 iframe 整体重载，保留滚动位置）
  - 懒加载（`loading="lazy"`），不阻塞文章首屏
- 修改 `components/posts/PostLayout.tsx`：在文章正文（`<article>`）之后渲染 `<Comments>`，将 `siteConfig.giscus` 与 `locale` 作为 props 传入（遵循 RSC→Client 边界，客户端组件不直接 import server-only 模块）
- 在 `i18n/messages/zh.json` 与 `en.json` 新增 `Comment` 命名空间（评论区标题等文案）
- 安装新依赖 `@giscus/react`

## Capabilities

### New Capabilities

- `post-comments`: 基于 Giscus（GitHub Discussions）的文章评论系统，包括配置加载、主题与语言同步、懒加载渲染，以及评论区的 i18n 文案

### Modified Capabilities

- `site-config`: `content/site.yaml` 新增 `giscus` 配置块作为必填字段，`siteConfig` 对象新增 `giscus` 派生字段，加载模块新增 Giscus 配置的解析与校验

## Impact

- **新增依赖**：`@giscus/react`（React 组件式 Giscus 集成）
- **配置文件**：`content/site.yaml` 新增 `giscus` 块（编辑后需重启 dev server，文件不在模块图中，无 HMR）
- **服务端模块**：`lib/site-config.ts` 扩展类型与校验逻辑，`fs.readFileSync` 仍不强制动态渲染（所有路由保持 SSG）
- **客户端组件**：新增 `Comments.tsx`（`'use client'`），通过 props 接收配置，不破坏 server-only 边界
- **文章详情页**：`PostLayout` 在正文后多渲染一个评论区，懒加载不显著影响首屏性能
- **外部依赖**：Giscus iframe 加载自 `giscus.app`，Vercel 默认 CSP 不阻止；未来若加 CSP 需允许 `frame-src https://giscus.app`
- **SEO**：评论区为客户端懒加载，不影响 SSR HTML 与搜索引擎收录
- **关联功能**：阶段 2 的"文章删除功能"（未实现）需要在删除文章时通过 GitHub API 锁定对应 Giscus Discussion，本变更在 spec 中记录此关联但不实现删除脚本
