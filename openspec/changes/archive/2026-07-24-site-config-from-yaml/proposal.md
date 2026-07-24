## Why

GitHub 用户名、站点标题、站点描述等站点标识当前散落在 `.env`（`GITHUB_USERNAME`，且 `.env*` 被 gitignore，从未提交至 Git）与硬编码常量中。新克隆仓库的开发者无法从代码中得知配置来源，Vercel 部署也必须手动设置环境变量，而这些都是静态的、跨环境一致的公开标识 - 与已有的 `content/taxonomy/*.yaml` 模式同构。本变更将站点标识集中到一个**提交至 Git** 的 YAML 文件，使配置随代码流转、无需环境变量即可开箱即用。

## What Changes

- 新增 `content/site.yaml`（提交至 Git），承载 `githubUsername`、`siteTitle`、`siteDescription` 三个静态站点标识字段
- 重构 `lib/site-config.ts`：标记 `import 'server-only'`，通过 `fs.readFileSync` + `yaml` 包从 `content/site.yaml` 加载配置（模块级缓存 + 显式字段校验），移除 `process.env.GITHUB_USERNAME` 读取
- `siteUrl` 保留为 `NEXT_PUBLIC_SITE_URL` 环境变量（preview 与 production 部署可能不同，遵循 Vercel 惯例），硬编码回退 `https://ruixe-blog.vercel.app`
- **BREAKING**（对部署流程）：移除 `GITHUB_USERNAME` 环境变量支持 - Vercel 项目设置中的该环境变量不再生效，改为编辑 `content/site.yaml`
- `app/[lang]/layout.tsx` 读取 `siteConfig.siteTitle` 并作为 prop 传入客户端组件 `MobileHeader`
- `MobileHeader.tsx`、`MobileDrawer.tsx`（均为 `'use client'`）接收 `siteTitle` prop，移除对 `siteConfig` 的直接 import（`'server-only'` 边界阻止客户端 import）
- 更新 `.env.example`：移除 `GITHUB_USERNAME` 行，新增 `NEXT_PUBLIC_SITE_URL` 文档说明
- `lib/github.ts` 无需变更（继续接收 `username` 参数）

## Capabilities

### New Capabilities

- `site-config`: 站点配置子系统的加载、校验与服务端边界 - 定义 `content/site.yaml` 作为静态站点标识（GitHub 用户名、站点标题、站点描述）的唯一提交来源，`lib/site-config.ts` 作为 `server-only` 模块加载并校验配置，`siteUrl` 仍由环境变量提供

### Modified Capabilities

- `app-layout`: 导航与名片需求中对 GitHub 用户名配置来源的描述由"环境变量 `GITHUB_USERNAME`"变更为"`content/site.yaml` 的 `githubUsername` 字段"

## Impact

- **代码**：`lib/site-config.ts`（重构为 server-only YAML 加载）、`content/site.yaml`（新建）、`app/[lang]/layout.tsx`、`components/layout/MobileHeader.tsx`、`components/layout/MobileDrawer.tsx`、`.env.example`
- **依赖**：无新增 - 复用已有的 `yaml` 包（`lib/taxonomy.ts` 已使用）与 `server-only` 包（已在依赖中）
- **部署**：Vercel 项目不再需要 `GITHUB_USERNAME` 环境变量；可选保留 `NEXT_PUBLIC_SITE_URL` 用于覆盖 OG 标签中的站点 URL
- **向后兼容**：`GITHUB_USERNAME` 环境变量不再被读取 - 任何依赖该环境变量的部署需迁移至 `content/site.yaml`（单作者博客仅有一个生产部署，迁移成本极低）
- **构建行为**：`content/site.yaml` 缺失或字段校验失败时，模块 import 即抛错（fail-fast），与 `lib/taxonomy.ts` 的校验模式一致；构建时 `fs.readFileSync` 不影响 SSG（`taxonomy` 已验证全路由 `● (SSG)`）
- **开发体验**：编辑 `content/site.yaml` 后需重启 dev server（文件不在模块图中，与 `content/taxonomy/*.yaml` 相同限制）
