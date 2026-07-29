## Context

Ruixe Blog 是单作者个人博客，采用 Next.js 16 App Router + Markdown/MDX 文件驱动架构，无 CMS、无数据库。阶段 1 核心功能（文章列表、详情、分类/标签、i18n、主题切换、移动端适配）已上线；阶段 2 的文章搜索功能已完成（PR #5）。本变更为阶段 2 的下一项：文章评论功能。

技术选型已在需求文档 `.temp/my-first-blog-website.md` 中确定为 Giscus（基于 GitHub Discussions），理由：无需自建用户登录/评论管理后端，零运维成本，与文件驱动型博客的整体架构契合。Giscus 配置值已通过 giscus.app 生成，仓库 `RuixeWolf/ruixe-blog` 已启用 GitHub Discussions 并创建专用 `Comments` 分类。

当前架构约束：

- `content/site.yaml` 是静态站点配置的唯一来源（随 Git 提交），`lib/site-config.ts` 为 server-only 模块，模块级单例缓存，fail-fast 校验
- `PostLayout` 是异步 Server Component（使用 `getTranslations`、`getCategory`），文章详情页在 `app/[lang]/posts/[slug]/page.tsx` 渲染
- 主题由 `next-themes` 管理（`attribute="class"`、`defaultTheme="system"`），`resolvedTheme` 给出实际 `light`/`dark`
- i18n 由 `next-intl` 提供，locale 通过 `/[lang]` URL 前缀，支持 `zh`（默认）、`en`
- 客户端组件不可 import server-only 模块，需通过 RSC props 传递数据（已有模式：`SearchProvider`/`SearchDialog`）

## Goals / Non-Goals

**Goals:**

- 在文章详情页正文后嵌入 Giscus 评论区，懒加载不阻塞首屏
- 评论区主题与博客主题实时同步（切换主题时 iframe 不重载）
- 评论区 UI 语言与博客 locale 同步（`zh`→`zh-CN`、`en`→`en`）
- 不同语言版本的文章（`/zh/...` 与 `/en/...`）拥有独立评论区
- Giscus 配置集中存于 `content/site.yaml`，随 Git 提交，无需环境变量
- 遵循 server-only 边界与现有 `lib/` 模块模式

**Non-Goals:**

- 文章删除时的 Giscus Discussion 锁定脚本（属于阶段 2 "文章删除功能"，本变更不实现）
- 本地 Giscus 审核界面（直接在 GitHub Discussions 管理）
- 自定义 Giscus 主题 CSS（使用内置 `light`/`dark_dimmed`）
- 评论邮件通知配置（GitHub 原生通知已足够）
- Giscus 配置的运行时动态切换（配置为静态，编辑后重启 dev server）

## Decisions

### 决策 1：使用 `@giscus/react` 组件而非手动嵌入 iframe 脚本

**选择**：安装 `@giscus/react`，在客户端组件中渲染 `<Giscus>` 组件，通过 props 传递配置。

**备选方案**：手动在页面注入 `<script src="https://giscus.app/client.js">` 并通过 `data-*` 属性配置。

**理由**：`@giscus/react` 提供类型安全的 props、React 生命周期集成、与 React 19 / React Compiler 兼容；手动脚本需处理 `next/script` 策略、DOM ref 与清理，且无法以 React 方式响应 theme/locale 变化。组件式集成更符合本项目的 React 架构。

### 决策 2：主题通过 `postMessage` 平滑切换，而非 `theme` prop

**选择**：`<Giscus>` 的 `theme` prop 仅用于初始渲染；主题变化时通过 `useEffect` + `postMessage({ giscus: { setConfig: { theme } } })` 向 iframe（`targetOrigin: 'https://giscus.app'`）发送更新消息，不改变 `theme` prop 值。

**备选方案**：将 `theme` 作为 `<Giscus>` 的 prop，依赖组件内部在 prop 变化时更新 iframe。

**理由**：`@giscus/react` 在 `theme` prop 变化时会整体重载 iframe（`iframe.src` 重新赋值），导致评论滚动位置丢失、闪烁，体验割裂。`postMessage` 的 `setConfig` 机制是 Giscus 官方推荐的无重载主题切换方式，保留滚动位置，切换瞬时完成。这是本设计的核心体验决策。

实现要点：

- `useTheme()` 读取 `resolvedTheme`（非 `theme` 偏好，因为 `system` 需解析为实际值）
- 映射：`light`→`light`、`dark`→`dark_dimmed`（Giscus 内置主题，零配置）
- `useEffect` 依赖 `resolvedTheme`；执行前检查 iframe ref 的 `contentWindow` 非空（懒加载未触发时跳过）
- `targetOrigin` 固定为 `'https://giscus.app'`（安全：仅发给 Giscus iframe）

### 决策 3：locale 映射在客户端组件内完成

**选择**：`Comments` 组件接收 `locale` prop，内部映射为 Giscus lang（`zh`→`zh-CN`、`en`→`en`），作为 `<Giscus>` 的 `lang` prop。

**备选方案**：在 `lib/site-config.ts` 或 `i18n` 层维护映射表。

**理由**：映射是 Giscus 特有的客户端关注点（Giscus 不支持裸 `zh`，需 `zh-CN`），与 `lib/` 的 server-only 职责无关；放在客户端组件内使数据流单一（locale prop → lang prop），便于测试与维护。locale 切换时 layout 重新渲染，`lang` prop 随之更新，`<Giscus>` 重载为对应语言 UI（可接受，locale 切换本身就是整页级变化）。

### 决策 4：mapping 使用 `pathname` 实现多语言独立评论区

**选择**：Giscus `mapping="pathname"`，使 `/zh/posts/x` 与 `/en/posts/x` 对应不同 Discussion。

**备选方案**：`mapping="title"`（按文章标题映射，使中英文版共享评论区）或 `mapping="url"`（含域名，不适合多部署环境）。

**理由**：不同语言版本的读者群体通常不同，独立评论区让读者以自己阅读的语言交流，体验更自然；`pathname` 不含域名，在 preview/production 不同部署环境下稳定。`strict=0` 避免因尾部斜杠等微小路径差异创建重复 Discussion。

### 决策 5：Giscus 配置存于 `content/site.yaml`，扩展 `lib/site-config.ts`

**选择**：`content/site.yaml` 新增 `giscus` 块；`lib/site-config.ts` 新增 `GiscusConfig` 类型、校验逻辑，`siteConfig.giscus` 派生字段。

**备选方案**：新建 `lib/giscus-config.ts` 独立模块；或使用环境变量（`.env`）。

**理由**：Giscus 配置是静态站点配置（不随部署环境变化），与 `githubUsername`/`siteTitle` 同类；集中存于 `site.yaml` 避免配置分散，复用现有 fail-fast 校验与模块级单例缓存模式，无需新增模块或环境变量。导出 `GiscusConfig` 类型供 `Comments` 组件 prop 类型标注（`import type`，编译期擦除，不引入 server-only 模块至客户端 bundle）。

### 决策 6：`Comments` 组件为 Client Component，通过 props 接收配置

**选择**：`components/posts/Comments.tsx` 标记 `'use client'`，`PostLayout`（Server Component）将 `siteConfig.giscus` 与 `locale` 作为 props 传入。

**备选方案**：将 `PostLayout` 改为 Client Component 直接读取配置。

**理由**：`PostLayout` 依赖 `getTranslations`/`getCategory` 等 server-only API，不可降级为客户端组件；`@giscus/react` 与 `useTheme` 必须在客户端运行。此 RSC→Client 边界模式与现有 `SearchProvider`/`SearchDialog` 一致，是本项目既定架构约定。

## Risks / Trade-offs

- **[Giscus 服务可用性]** 评论区依赖 `giscus.app` 与 GitHub Discussions 可用性 -> 接受：评论为非核心功能，不可用时文章正文仍可读；不在本地做容错（增加复杂度，收益低）
- **[iframe 主题同步时序]** 若用户在 iframe 加载前切换主题，`postMessage` 因 `contentWindow` 为 null 被跳过 -> 缓解：`useEffect` 检查 `contentWindow` 非空；iframe 加载时以初始 `resolvedTheme` 作为 `theme` prop 渲染，加载后主题正确
- **[Giscus lang 限制]** Giscus 不支持裸 `zh`，必须用 `zh-CN` -> 缓解：客户端组件内硬编码映射表（`zh`→`zh-CN`、`en`→`en`）；未来新增 locale 需更新映射表
- **[CSP 兼容性]** Vercel 默认 CSP 不阻止 `giscus.app` iframe；未来若引入严格 CSP，需允许 `frame-src https://giscus.app` -> 记录于 spec 与本设计，变更 CSP 时同步更新
- **[配置编辑无 HMR]** 编辑 `content/site.yaml` 需重启 dev server（文件不在模块图中） -> 接受：与现有 `site.yaml` 行为一致，已在项目约定中记录
- **[locale 切换时 iframe 重载]** locale 变化导致 `lang` prop 更新，`<Giscus>` 重载 iframe -> 接受：locale 切换本身是整页级变化（layout 重新渲染），评论区重载与页面整体行为一致，非体验问题
- **[`@giscus/react` 版本兼容性]** 该库需兼容 React 19 -> 缓解：安装后验证 `pnpm build` 与运行时无错误；React 19 已稳定，`@giscus/react` 维护活跃
- **[SEO]** 评论区客户端懒加载，不进入 SSR HTML -> 接受：评论非文章内容，不应被搜索引擎收录；不影响文章正文的 SEO

## Migration Plan

此为纯新增功能，无数据迁移、无破坏性变更：

1. 安装 `@giscus/react` 依赖
2. 在 `content/site.yaml` 追加 `giscus` 配置块（值已由 giscus.app 生成）
3. 扩展 `lib/site-config.ts`（类型、校验、`siteConfig.giscus`）
4. 新建 `components/posts/Comments.tsx`
5. 修改 `PostLayout.tsx` 渲染 `<Comments>`
6. 在 `i18n/messages/{zh,en}.json` 新增 `Comment` 命名空间
7. `pnpm format-lint` + `pnpm build` 验证
8. 本地 `pnpm dev` 验证：评论区渲染、主题切换平滑、locale 切换、懒加载

**回滚策略**：移除 `<Comments>` 渲染（或还原 `PostLayout`），其余变更（配置、类型、文案）为孤立新增，不影响现有功能。卸载 `@giscus/react` 可选。

## Open Questions

无。所有产品决策已在 explore 阶段与用户确认完毕，Giscus 配置值已由用户提供。
