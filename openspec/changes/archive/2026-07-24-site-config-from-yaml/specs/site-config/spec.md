## ADDED Requirements

### Requirement: 站点配置文件

系统 SHALL 在 `content/site.yaml` 维护站点标识配置（提交至 Git），包含以下必填字段：

- `githubUsername`：GitHub 登录用户名，驱动 ProfileCard 数据获取与外部 GitHub 链接
- `siteTitle`：站点标题，显示于 Header、MobileDrawer 与浏览器标签页 metadata
- `siteDescription`：站点描述，用于 SEO metadata 与 Open Graph

字段 MUST 为非空字符串。`siteUrl` 不在此文件中 - 它由 `NEXT_PUBLIC_SITE_URL` 环境变量提供（preview 与 production 部署可能不同）。

#### Scenario: 配置文件存在且字段完整

- **WHEN** `content/site.yaml` 存在且包含 `githubUsername`、`siteTitle`、`siteDescription` 三个非空字符串字段
- **THEN** 系统成功加载配置，`siteConfig.githubUsername`、`siteConfig.siteTitle`、`siteConfig.siteDescription` 反映文件值

#### Scenario: 配置文件缺失

- **WHEN** `content/site.yaml` 不存在
- **THEN** 系统 import `lib/site-config` 时抛错，错误消息明确指出文件路径缺失

#### Scenario: 必填字段缺失或为空

- **WHEN** `content/site.yaml` 中 `githubUsername`、`siteTitle` 或 `siteDescription` 任一字段缺失、非字符串或为空字符串
- **THEN** 系统 import `lib/site-config` 时抛错，错误消息明确指出缺失的字段名与文件路径

#### Scenario: 配置文件随代码提交至 Git

- **WHEN** 开发者克隆仓库
- **THEN** `content/site.yaml` 存在于工作区（未被 `.gitignore` 忽略），站点标识开箱即用，无需创建 `.env` 文件或配置环境变量

### Requirement: 站点配置加载模块

系统 SHALL 在 `lib/site-config.ts` 提供 `siteConfig` 对象作为站点配置的统一访问入口。模块 MUST 标记 `import 'server-only'` 以阻止客户端 bundle 泄漏。模块 MUST 通过 `node:fs` 从 `content/site.yaml` 加载配置（`process.cwd()` 解析项目根目录），使用 `yaml` 包解析，并在模块评估时完成加载与校验（fail-fast）。模块 MUST 在进程内缓存解析结果（模块级单例），避免重复文件读取。模块 MUST 导出包含 `githubUsername`、`githubUrl`（派生自 `https://github.com/${githubUsername}`）、`siteTitle`、`siteDescription`、`siteUrl` 的不可变 `siteConfig` 对象。

#### Scenario: Server Component 读取配置

- **WHEN** Server Component（如 `ProfileCard`、`NavLinks`、`app/layout.tsx`）import 并读取 `siteConfig.githubUsername` 或 `siteConfig.siteTitle`
- **THEN** 返回 `content/site.yaml` 中对应的字段值

#### Scenario: 模块缓存命中

- **WHEN** 同一进程内多次 import `lib/site-config`
- **THEN** `content/site.yaml` 仅在首次 import 时读取与解析一次，后续 import 返回缓存的 `siteConfig` 对象

#### Scenario: Client Component 尝试 import 配置模块

- **WHEN** 标记 `'use client'` 的组件尝试 `import { siteConfig } from '@/lib/site-config'`
- **THEN** 构建时抛错（`server-only` 包阻止客户端 bundle 纳入该模块），阻止配置模块泄漏至客户端

#### Scenario: siteUrl 从环境变量读取

- **WHEN** `process.env.NEXT_PUBLIC_SITE_URL` 已设置
- **THEN** `siteConfig.siteUrl` 反映该环境变量值

#### Scenario: siteUrl 环境变量未设置时回退

- **WHEN** `process.env.NEXT_PUBLIC_SITE_URL` 未设置
- **THEN** `siteConfig.siteUrl` 回退至硬编码值 `https://ruixe-blog.vercel.app`

### Requirement: 客户端组件通过 prop 接收站点标题

系统 SHALL 在客户端组件需要站点标题时，由 Server Component（`app/[lang]/layout.tsx`）读取 `siteConfig.siteTitle` 并通过 prop 传递，而非由客户端组件直接 import `siteConfig`。`MobileHeader` MUST 接收 `siteTitle` prop 并将其透传至 `MobileDrawer`。`MobileDrawer` MUST 接收 `siteTitle` prop 并在 Drawer 标题处渲染。`MobileHeader` 与 `MobileDrawer` MUST NOT 直接 import `lib/site-config`。

#### Scenario: MobileHeader 接收 siteTitle prop

- **WHEN** `app/[lang]/layout.tsx` 渲染 `<MobileHeader>`
- **THEN** 传入 `siteTitle={siteConfig.siteTitle}` prop，`MobileHeader` 在站点标题位置渲染该值

#### Scenario: MobileDrawer 接收透传的 siteTitle prop

- **WHEN** `MobileHeader` 渲染 `<MobileDrawer>`
- **THEN** 透传 `siteTitle` prop，`MobileDrawer` 在 Drawer 标题位置渲染该值

#### Scenario: 客户端组件不直接依赖配置模块

- **WHEN** 构建客户端 bundle
- **THEN** `MobileHeader` 与 `MobileDrawer` 的依赖图中不包含 `lib/site-config`（由 `server-only` 边界保证）
