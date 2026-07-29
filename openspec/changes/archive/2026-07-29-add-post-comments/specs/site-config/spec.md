# Site Config Specification (Delta)

## MODIFIED Requirements

### Requirement: 站点配置文件

系统 SHALL 在 `content/site.yaml` 维护站点配置（提交至 Git），包含以下必填字段：

站点标识字段（原有）：

- `githubUsername`：GitHub 登录用户名，驱动 ProfileCard 数据获取与外部 GitHub 链接
- `siteTitle`：站点标题，显示于 Header、MobileDrawer 与浏览器标签页 metadata
- `siteDescription`：站点描述，用于 SEO metadata 与 Open Graph

Giscus 评论配置字段（新增）：

- `giscus.repo`：GitHub 仓库全名（格式 `owner/repo`），如 `RuixeWolf/ruixe-blog`
- `giscus.repoId`：仓库 ID（由 giscus.app 生成，base64 编码）
- `giscus.category`：GitHub Discussions 分类名，如 `Comments`
- `giscus.categoryId`：分类 ID（由 giscus.app 生成，base64 编码）
- `giscus.mapping`：路径到 Discussion 的映射策略，如 `pathname`
- `giscus.reactionsEnabled`：是否开启 reaction（`0` 关闭 / `1` 开启）
- `giscus.inputPosition`：评论框位置（`top` 或 `bottom`）
- `giscus.strict`：是否严格匹配路径（`0` 关闭 / `1` 开启）
- `giscus.emitMetadata`：是否向页面 emit Discussion 元数据（`0` 关闭 / `1` 开启）

所有标识字段 MUST 为非空字符串。`giscus` 子块下的 `repo`、`repoId`、`category`、`categoryId`、`mapping` MUST 为非空字符串；`reactionsEnabled`、`inputPosition`、`strict`、`emitMetadata` MUST 为有效值（`reactionsEnabled`/`strict`/`emitMetadata` 为 `0` 或 `1`；`inputPosition` 为 `top` 或 `bottom`）。`siteUrl` 不在此文件中 - 它由 `NEXT_PUBLIC_SITE_URL` 环境变量提供（preview 与 production 部署可能不同）。

#### Scenario: 配置文件存在且字段完整

- **WHEN** `content/site.yaml` 存在且包含 `githubUsername`、`siteTitle`、`siteDescription` 三个非空字符串字段，以及完整且合法的 `giscus` 子块
- **THEN** 系统成功加载配置，`siteConfig.githubUsername`、`siteConfig.siteTitle`、`siteConfig.siteDescription`、`siteConfig.giscus.*` 反映文件值

#### Scenario: 配置文件缺失

- **WHEN** `content/site.yaml` 不存在
- **THEN** 系统 import `lib/site-config` 时抛错，错误消息明确指出文件路径缺失

#### Scenario: 站点标识必填字段缺失或为空

- **WHEN** `content/site.yaml` 中 `githubUsername`、`siteTitle` 或 `siteDescription` 任一字段缺失、非字符串或为空字符串
- **THEN** 系统 import `lib/site-config` 时抛错，错误消息明确指出缺失的字段名与文件路径

#### Scenario: giscus 子块缺失

- **WHEN** `content/site.yaml` 缺少 `giscus` 子块或 `giscus` 不是映射类型
- **THEN** 系统 import `lib/site-config` 时抛错，错误消息明确指出 `giscus` 配置块缺失

#### Scenario: giscus 必填字符串字段缺失或为空

- **WHEN** `giscus` 子块中 `repo`、`repoId`、`category`、`categoryId` 或 `mapping` 任一字段缺失、非字符串或为空字符串
- **THEN** 系统 import `lib/site-config` 时抛错，错误消息明确指出缺失的 `giscus.*` 字段名

#### Scenario: giscus 数值/枚举字段非法

- **WHEN** `giscus.reactionsEnabled`、`giscus.strict`、`giscus.emitMetadata` 不是 `0` 或 `1`，或 `giscus.inputPosition` 不是 `top` 或 `bottom`
- **THEN** 系统 import `lib/site-config` 时抛错，错误消息明确指出非法字段名与期望值范围

#### Scenario: 配置文件随代码提交至 Git

- **WHEN** 开发者克隆仓库
- **THEN** `content/site.yaml` 存在于工作区（未被 `.gitignore` 忽略），站点标识与 Giscus 评论配置开箱即用，无需创建 `.env` 文件或配置环境变量

### Requirement: 站点配置加载模块

系统 SHALL 在 `lib/site-config.ts` 提供 `siteConfig` 对象作为站点配置的统一访问入口。模块 MUST 标记 `import 'server-only'` 以阻止客户端 bundle 泄漏。模块 MUST 通过 `node:fs` 从 `content/site.yaml` 加载配置（`process.cwd()` 解析项目根目录），使用 `yaml` 包解析，并在模块评估时完成加载与校验（fail-fast）。模块 MUST 在进程内缓存解析结果（模块级单例），避免重复文件读取。模块 MUST 导出包含 `githubUsername`、`githubUrl`（派生自 `https://github.com/${githubUsername}`）、`siteTitle`、`siteDescription`、`siteUrl`、`giscus`（类型为 `GiscusConfig`）的不可变 `siteConfig` 对象。模块 MUST 导出 `GiscusConfig` 类型（供 `Comments` 组件通过 prop 类型标注引用，避免客户端 bundle 引入 `site-config` 模块本身）。Giscus 配置的校验 MUST 与站点标识配置在同一 `validateSiteConfig` 流程中完成（fail-fast）。

#### Scenario: Server Component 读取配置

- **WHEN** Server Component（如 `ProfileCard`、`NavLinks`、`app/layout.tsx`、`PostLayout`）import 并读取 `siteConfig.githubUsername`、`siteConfig.siteTitle` 或 `siteConfig.giscus`
- **THEN** 返回 `content/site.yaml` 中对应的字段值

#### Scenario: 模块缓存命中

- **WHEN** 同一进程内多次 import `lib/site-config`
- **THEN** `content/site.yaml` 仅在首次 import 时读取与解析一次，后续 import 返回缓存的 `siteConfig` 对象

#### Scenario: Client Component 尝试 import 配置模块

- **WHEN** 标记 `'use client'` 的组件尝试 `import { siteConfig } from '@/lib/site-config'`
- **THEN** 构建时抛错（`server-only` 包阻止客户端 bundle 纳入该模块），阻止配置模块泄漏至客户端

#### Scenario: Comments 组件通过 prop 接收 giscus 配置

- **WHEN** `PostLayout`（Server Component）渲染 `<Comments>`
- **THEN** 传入 `config={siteConfig.giscus}` prop，`Comments`（Client Component）以 `GiscusConfig` 类型标注该 prop，不 import `lib/site-config`

#### Scenario: siteUrl 从环境变量读取

- **WHEN** `process.env.NEXT_PUBLIC_SITE_URL` 已设置
- **THEN** `siteConfig.siteUrl` 反映该环境变量值

#### Scenario: siteUrl 环境变量未设置时回退

- **WHEN** `process.env.NEXT_PUBLIC_SITE_URL` 未设置
- **THEN** `siteConfig.siteUrl` 回退至硬编码值 `https://ruixe-blog.vercel.app`
