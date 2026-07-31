## Why

博客内容随时间演进，文章可能被删除或搬迁。当前删除一篇 `.mdx` 文章后，其旧 URL（`/[lang]/posts/<slug>`）会命中 `notFound()` 返回 404，造成死链与 SEO 损失。需求文档（`.temp/my-first-blog-website.md`「文章删除处理」）要求：删除文章时自动创建原 URL 的 Redirect，并提示锁定对应的 Giscus 评论 Discussion。本变更实现一个 CLI 脚本驱动的删除流程，以与项目「文件驱动、零运行时依赖」架构一致的方式完成文章删除、重定向登记与评论锁定提示。

## What Changes

- 新增 `scripts/delete-post.mjs` CLI 脚本（纯 JS，依赖已有的 `yaml` 包与 Node 内置 `readline`/`fs`，**零新依赖**）：接收 `<slug>` 位置参数与 `--force`、`--dry-run`、`--target <destination>` 可选参数；扫描 `content/posts/` 下该 slug 的所有 locale 文件，确认后删除文件，并向重定向清单追加一条语义化记录
- 新增 `content/redirects.yaml`（由脚本管理，初始不存在，首次删除时创建）：以 `{ slug, deletedAt, locales[], destination? }` 语义化分组形式记录被删文章，`destination` 省略时默认 `/{lang}/posts`，支持内部路径（含 `{lang}` 占位符）与外部 URL
- 修改 `next.config.ts`：新增 `async redirects()`，构建时/dev 时读取 `content/redirects.yaml` 并展开为 308 永久重定向规则（`source: /{locale}/posts/{slug}` -> `destination`，`permanent: true`）；文件不存在时返回空数组
- 修改 `package.json`：新增 `"delete-post": "node scripts/delete-post.mjs"` script
- Giscus Discussion 锁定采用**手动提示**策略：脚本删除完成后打印 Discussions 分类链接 + slug 搜索链接 + 受影响 pathname 与文章标题清单，提示用户在 GitHub UI 手动锁定；脚本不调用 GitHub API、不依赖 `GITHUB_TOKEN`，保持 fresh clone 零配置

## Capabilities

### New Capabilities

- `post-deletion`: 文章删除子系统 - 定义 `pnpm delete-post` CLI 契约（参数、确认、dry-run、target 覆盖）、删除文件与重定向清单的写入行为、`content/redirects.yaml` 的语义化格式与 reader 展开规则、以及 Giscus 手动锁定提示的输出契约

### Modified Capabilities

- `mdx-content`: 新增「文章删除与重定向」需求 - 文章删除后 SHALL 产生 308 永久重定向以避免死链；`content/redirects.yaml` 作为重定向清单的单一事实来源，由 `next.config.ts` `redirects()` 在构建时读取并展开；补充 `generateStaticParams` 删除后不再预渲染旧 slug、靠 `redirects()` 兜底的行为约束

## Impact

- **代码**：`scripts/delete-post.mjs`（新增）、`content/redirects.yaml`（新增，脚本管理）、`next.config.ts`（新增 `redirects()`）、`package.json`（新增 script）
- **依赖**：无新增。`yaml`（^2.9.0，已用于 `lib/site-config.ts`/`lib/taxonomy.ts`）与 Node 内置 `node:fs`、`node:readline`、`node:path` 满足全部需求；不触碰已 pin 的 `typescript ~6.0.3` / `eslint ~9.39.5`
- **构建行为**：`next.config.ts` 新增 `redirects()` 在 dev 每请求执行、prod 构建时执行；读 `content/redirects.yaml` 不触发动态渲染，全路由保持 `● (SSG)`（需在实现后用 `pnpm build` 核验）。`redirects()` 优先于 `proxy.ts` middleware 与页面 `notFound()`，已删文章旧 URL 直接 308 重定向，不命中 404
- **向后兼容**：无破坏性变更。`content/redirects.yaml` 初始不存在时 `redirects()` 返回空数组，行为等同当前（无重定向）。首次运行 `pnpm delete-post <slug>` 时脚本创建该文件
- **Git 工作流**：脚本只删文件与写 YAML，不执行 `git rm` 或 `git commit`；用户自行 `git add -A && git commit`，保持脚本单一职责
- **Giscus**：脚本不自动锁定 Discussion（避免引入 token 依赖与 GraphQL 不确定性）；靠 308 重定向阻断旧 URL 的新评论访问路径，手动锁定作为额外防御
- **Server/client 边界**：`redirects()` 运行在 Next.js 配置层（Node 上下文），不涉及 RSC/client 边界；`content/redirects.yaml` 的读取逻辑内联进 `next.config.ts` 或放 `lib/redirects.ts`（不加 `import 'server-only'`，因为消费者是 next.config 而非 RSC）
- **已知坑点**：脚本扫描文件名得出 locale 列表（无硬编码 locale 数组，避免 `i18n/routing.ts` 漂移）；PowerShell 下脚本路径含括号无影响（`scripts/` 无 `[lang]` 段）；YAML 写入采用「读现有数组 -> 追加 -> 整体重写」以保证 header 注释与格式一致
