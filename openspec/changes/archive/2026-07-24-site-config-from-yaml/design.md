## Context

Ruixe Blog 当前的站点标识配置散落在两处：

1. **`.env` / 环境变量**：`GITHUB_USERNAME`（`.env*` 被 `.gitignore` 的 `.env*` 规则忽略，`.env.example` 也未被 git 追踪 - `git check-ignore .env.example` 确认匹配 `.env*` 规则）。当前**没有任何提交至 Git 的文件**包含 GitHub 用户名；新克隆仓库的开发者只能得到硬编码回退值 `'RuixeWolf'`，且无从得知配置来源。Vercel 部署也必须手动在项目设置中配置环境变量，尽管该值是静态、公开、跨环境一致的。
2. **`lib/site-config.ts` 硬编码常量**：`siteTitle`、`siteDescription` 直接写在源码中。

与此同时，项目已有成熟的"提交至 Git 的 YAML 配置"模式 - `content/taxonomy/{categories,tags}.yaml` 由 `lib/taxonomy.ts`（`import 'server-only'` + `fs.readFileSync` + `yaml` 包）加载并校验，且已在生产构建中验证全路由 `● (SSG)`。站点标识与 taxonomy 同属"静态、公开、随代码流转"的配置，却采用了截然不同的来源，存在架构不一致。

本变更将站点标识统一至 `content/site.yaml`，使配置随代码流转、消除环境变量依赖、与 taxonomy 模式对齐。

### 当前数据流

```
.env (gitignored, 未提交)
  GITHUB_USERNAME=RuixeWolf
        │
        ▼
lib/site-config.ts (客户端安全, 无 'server-only', 无 fs)
  process.env.GITHUB_USERNAME ?? 'RuixeWolf'
  -> siteConfig { githubUsername, githubUrl, siteUrl, siteTitle, siteDescription }
        │
        ├──► Server Components (ProfileCard, NavLinks, Header, app/layout.tsx)  ✓
        └──► Client Components (MobileHeader, MobileDrawer)  ◄── 隐式泄漏
              siteConfig.siteTitle (客户端 bundle 中 process.env.GITHUB_USERNAME
              为 undefined, 回退到 'RuixeWolf')
```

关键问题：`siteConfig` 未标记 `'server-only'`，因此客户端组件可以 import 它 - 客户端 bundle 中 `process.env.GITHUB_USERNAME` 为 `undefined`（未加 `NEXT_PUBLIC_` 前缀），静默回退到默认值。这是一个隐蔽的正确性陷阱。

## Goals / Non-Goals

**Goals:**

- 将 `githubUsername`、`siteTitle`、`siteDescription` 集中至提交至 Git 的 `content/site.yaml`
- `lib/site-config.ts` 标记 `server-only` 并通过 `fs` 加载 YAML，建立硬边界阻止客户端 import
- 客户端组件（`MobileHeader`、`MobileDrawer`）通过 prop 接收 `siteTitle`，不再直接 import `siteConfig`
- 与 `lib/taxonomy.ts` 的加载/校验/缓存模式对齐，保持架构一致性
- 消除 Vercel 部署对 `GITHUB_USERNAME` 环境变量的依赖

**Non-Goals:**

- 不移动 `siteUrl` 至 YAML - preview 与 production 部署可能需要不同值，保留 `NEXT_PUBLIC_SITE_URL` 环境变量（Vercel 惯例）
- 不引入运行时配置热更新 - `content/site.yaml` 编辑后需重启 dev server（与 `content/taxonomy/*.yaml` 相同限制）
- 不引入 Zod 等运行时校验库 - 沿用 `lib/taxonomy.ts` 的手动存在性校验模式，避免新依赖
- 不对 GitHub 用户名做格式正则校验 - 依赖 GitHub API 404 + `ProfileCard` 已有的优雅降级
- 不变更 `lib/github.ts` 的接口（继续接收 `username` 参数）
- 不变更服务端组件（`ProfileCard`、`NavLinks`、`Header`、`app/layout.tsx`）对 `siteConfig` 的直接 import 方式

## Decisions

### Decision 1: YAML 文件位置 - `content/site.yaml`

**选择**：`content/site.yaml`（单文件，与 `content/taxonomy/*.yaml` 同级）。

**理由**：与现有 YAML 配置同目录，复用 `content/` 的"提交至 Git 的静态内容"语义。单文件足够承载三个字段；若未来扩展（社交链接、作者简介等），可拆分为 `content/site/*.yaml`，但当前 MVP 无需预先拆分。

**备选方案**：

- `content/site/identity.yaml` + 预留 `content/site/socials.yaml`：过度设计，MVP 无需求驱动
- `config/site.yaml`（新建顶级目录）：引入新约定，与 `content/` 语义重叠
- `lib/site-config.yaml`：配置与代码混置，违背"内容与代码分离"

### Decision 2: `lib/site-config.ts` 改为 `server-only` + 模块级缓存

**选择**：`import 'server-only'` + `fs.readFileSync` + 模块级单例缓存 + 模块评估时 eager load。

```ts
import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

// 模块评估时加载并校验, 缓存至进程生命周期
export const siteConfig: SiteConfig = loadSiteConfig()
```

**理由**：

- `server-only` 包利用 `react-server` export condition - Server Component import 解析为 `empty.js`（no-op），Client Component import 解析为 `index.js`（运行时抛错），构建时即阻止客户端 bundle 泄漏（Context7 `/vercel/next.js/v16.2.2` 文档确认此机制）
- 模块级缓存与 `lib/taxonomy.ts` 的 `categoriesCache`/`tagsCache` 模式一致 - YAML 静态，进程内无需重新读取
- eager load（模块评估时调用）使配置错误在 import 时即抛错（fail-fast），与 taxonomy 的校验时机一致；保留了现有 `siteConfig.x` 的调用方人体工学，无需重构每个调用点
- `fs.readFileSync` 不被 Next.js 的动态渲染追踪（仅 `fetch`、`cookies()`、`headers()`、`searchParams` 被追踪），taxonomy 已验证全路由 `● (SSG)`

**备选方案**：

- 懒加载函数 `getSiteConfig()`：需重构所有调用点为 `await getSiteConfig()` 或同步 `getSiteConfig().x`，收益不明显（配置总会被读取）
- `next.config.ts` 注入：将 YAML 读取移至构建时配置 - 增加构建/运行时复杂度，且 `siteConfig` 需在运行时被 Server Component 读取，不如模块级直接
- 不加 `server-only`：保留客户端 import 能力 - 重新引入当前的隐蔽泄漏陷阱，违背设计目标

### Decision 3: 字段校验 - 手动存在性检查，无 Zod

**选择**：对每个必填字段做 `typeof === 'string' && length > 0` 检查，抛出明确错误信息指向 `content/site.yaml`。

**理由**：

- 与 `lib/taxonomy.ts` 的 `validateTaxonomy` 模式一致 - 手动遍历 + 明确错误消息
- 项目当前未使用 Zod，引入新依赖仅为此处校验不划算
- 字段集合小且稳定（3 个字段），手动校验可读性足够

**备选方案**：

- Zod schema：类型推导 + 校验一体，但新依赖、过度设计
- 不校验：依赖 YAML 解析的隐式行为 - `undefined` 字段会传播至 `githubUrl` 拼接（`https://github.com/undefined`），错误延迟到运行时且难定位

### Decision 4: `siteUrl` 保留为环境变量

**选择**：`siteUrl` 继续从 `process.env.NEXT_PUBLIC_SITE_URL` 读取，回退至 `https://ruixe-blog.vercel.app`。

**理由**：

- Vercel preview 部署的 URL 与 production 不同（`*.vercel.app` 子域），OG 标签、`metadataBase` 需要正确的 URL
- 环境变量是 Vercel 处理部署相关 URL 的惯例
- `siteUrl` 与 `githubUsername`/`siteTitle`/`siteDescription` 本质不同 - 后者跨环境一致，前者随部署变化

**备选方案**：

- 全部移入 `content/site.yaml`：preview 部署的 OG 标签会错误指向 production URL，降低正确性
- 从 Vercel 自动注入的 `VERCEL_URL` 读取：耦合 Vercel 平台，本地 dev 与其他平台需另设回退

### Decision 5: 客户端组件通过 prop 接收 `siteTitle`

**选择**：`app/[lang]/layout.tsx`（Server Component）读取 `siteConfig.siteTitle` 并作为 prop 传入 `MobileHeader`；`MobileHeader` 再将 `siteTitle` 透传至 `MobileDrawer`。

```
app/[lang]/layout.tsx (Server)
  siteConfig.siteTitle ──prop──► MobileHeader (Client) ──prop──► MobileDrawer (Client)
```

**理由**：

- `'server-only'` 边界阻止 `MobileHeader`/`MobileDrawer` 直接 import `siteConfig`，prop 传递是唯一可行路径
- 项目已采用此模式传递服务端渲染内容 - `MobileHeader` 已接收 `navLinks`/`sidebar` 作为 RSC payload prop
- 仅 `siteTitle` 一个字段需要传递（客户端组件只用到 `siteTitle`），prop 接口最小

**备选方案**：

- React Context：为单字段引入 Provider，过度设计
- 拆分 `lib/site-config.ts` 为客户端安全 + 服务端专用两个模块（探索阶段的"方案 B"）：保留两个配置来源，违背"统一"目标，且 `siteTitle` 仍需客户端可见
- 硬编码 `siteTitle` 到客户端组件：重新引入配置散落问题

### Decision 6: 移除 `GITHUB_USERNAME` 环境变量支持（硬切换）

**选择**：`lib/site-config.ts` 不再读取 `process.env.GITHUB_USERNAME`，YAML 为唯一来源。

**理由**：

- 用户明确要求"来源由 .env 文件更改为 yaml 文件" - 更改来源，而非新增层
- 分层（YAML 默认 + env 覆盖）增加条件逻辑，且单作者博客无多环境差异需求
- 硬切换使单一事实来源清晰，减少认知负担

**备选方案**：

- 分层（YAML 默认 + `GITHUB_USERNAME` 覆盖）：保留环境变量灵活性，但增加条件逻辑且违背"统一来源"目标

## Risks / Trade-offs

- **[风险] `content/site.yaml` 缺失或字段校验失败导致应用无法启动** -> 缓解：fail-fast 是期望行为 - 配置错误是部署问题而非运行时用户问题；提交至 Git 的文件意味着构建时即捕获；错误消息明确指向文件与字段
- **[风险] dev server 编辑 `content/site.yaml` 后不热更新** -> 缓解：文件不在模块图中，需手动重启 dev server；与 `content/taxonomy/*.yaml` 相同限制，已在项目惯例中接受；静态配置编辑频率极低
- **[权衡] `GITHUB_USERNAME` 环境变量不再生效（BREAKING）** -> 缓解：单作者博客仅一个生产部署，迁移成本极低（编辑 YAML 提交即可）；`.env.example` 同步更新文档；proposal 与 spec delta 明确标注 BREAKING
- **[风险] `process.cwd()` 在非项目根目录执行时路径错误** -> 缓解：Next.js 构建/dev/Vercel 均在项目根目录执行，`lib/taxonomy.ts` 已使用相同模式验证可行
- **[权衡] 客户端组件新增 `siteTitle` prop** -> 缓解：接口变更小（一个 prop），且项目已采用 RSC payload prop 模式；`MobileHeader`→`MobileDrawer` 仅一层透传
- **[风险] 未来客户端组件误 import `siteConfig`** -> 缓解：`server-only` 在构建时抛错，防止泄漏 - 这是本设计的安全特性而非风险
