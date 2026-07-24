## Context

Ruixe Blog 的侧栏（`SidebarContent`，Server Component）由 `app/[lang]/layout.tsx` 渲染，出现在所有 `[lang]/*` 页面（首页、文章列表、文章详情、分类页、标签页、关于页）。当前分类列表只渲染分类名称，不显示文章数量。`lib/posts.ts` 已有 `getAllPosts(lang)` 返回带 `category` 字段的文章元数据，但：(1) 无聚合函数统计分类计数；(2) `getAllPosts` 每次调用全量 `fs.readdirSync` + `gray-matter` 解析，无缓存，在 SSG 构建期被多个页面重复调用。

`lib/taxonomy.ts` 已有模块级缓存先例（`categoriesCache`），但该缓存在 dev 模式下会导致改 YAML 后需重启 dev server--对低频变更的 taxonomy 可接受，但对高频变更的 posts 不可接受。

## Goals / Non-Goals

**Goals:**

- 侧栏分类列表每项显示该分类下的文章计数，所有页面一致显示。
- 引入 `getCategoryPostCounts` 聚合函数，职责单一、可独立缓存。
- 为 `getAllPosts` 增加构建期缓存，消除 SSG 构建期的重复 fs 扫描，同时不损害 dev 模式下写文章的即时预览体验。
- 保持纯 Server Component 实现，不引入 client component。

**Non-Goals:**

- 标签云不加计数（本次仅分类；标签可未来单独变更）。
- 不修改 `lib/taxonomy.ts` 的缓存策略（独立变更，避免范围蔓延）。
- 不引入 `React.cache`（见决策 3）。
- 不改变 `getAllPosts` 的返回类型（保持 `PostMeta[]`，不加 `readonly`）。
- 不新增 i18n 消息键（计数为纯数字）。
- 不改变路由结构或 layout 组件树。

## Decisions

### 决策 1：计数在所有页面显示（而非仅首页）

**选择**：侧栏作为全局 chrome，计数在所有渲染 `SidebarContent` 的页面恒定显示。

**备选**：仅首页显示（通过 client island + `usePathname()` 判断）。

**理由**：

- `SidebarContent` 由 `app/[lang]/layout.tsx` 渲染，App Router 的 layout 不感知当前 children 的具体路由。要实现"仅首页"需引入 client component（`usePathname` 是 client-only hook）或改路由结构（parallel routes），成本高。
- "仅首页"会导致用户跨页面导航时计数闪烁式出现/消失，违反侧栏作为 persistent chrome 的稳定性预期。
- 在分类页本身显示计数有额外 UX 价值：用户点进"前端开发"分类，侧栏显示"前端开发 1"，印证当前分类规模。
- "所有页面"在每一项实现成本上都更简单或相等（纯 server，零 client component，零路由改动）。

### 决策 2：纯 Server Component 实现

**选择**：`SidebarContent` 保持 Server Component，直接在服务端算好 counts 并渲染为纯文本 `<span>`。

**备选**：新建 `CategoryCount` client island 组件用 `usePathname()` 条件渲染。

**理由**：决策 1 已确定所有页面显示，无需页面判断，故无需 client component。计数数据（`getAllPosts`）在服务端读取，渲染为纯文本 span 无 hydration 风险。

### 决策 3：模块级 `Map` 缓存 + `NODE_ENV` 守卫，而非 `React.cache`

**选择**：在 `lib/posts.ts` 使用 `const postsCache = new Map<Locale, PostMeta[]>()`，仅在 `process.env.NODE_ENV === 'production'` 下启用缓存。

**备选 A**：`React.cache`（Next.js 官方推荐的请求级去重模式）。

**备选 B**：无 `NODE_ENV` 守卫的纯模块级缓存（同 `lib/taxonomy.ts`）。

**理由**：

- Context7 拉取的 Next.js 16.2.9 官方文档明确：`React.cache` 仅在**单个渲染过程（render pass）**内去重，不跨请求、不跨页面渲染持久化。SSG 构建期每个页面的渲染是独立的 render pass，`React.cache` 无法消除跨页面的重复 fs 扫描，不满足本变更的构建期优化目标。
- 模块级 `Map` 在 Node.js 进程生命周期内持久，跨页面、跨 `generateStaticParams` 调用复用，符合构建期"每 locale 只扫一次"的目标。
- `NODE_ENV` 守卫确保 dev 模式（`pnpm dev`，`NODE_ENV=development`）始终读文件系统，新增/修改文章立即可见，不损害 DX。production 模式（`pnpm build` / `pnpm start`，`NODE_ENV=production`）启用缓存。
- `lib/taxonomy.ts` 已用模块级缓存先例，本决策在风格上一致；额外加 `NODE_ENV` 守卫是因为 posts 变更频率远高于 taxonomy，DX 要求不同。

### 决策 4：`getCategoryPostCounts` 返回 `Record<string, number>`

**选择**：`getCategoryPostCounts(lang: Locale): Record<string, number>`，返回 categoryId 到计数的映射。

**备选**：`getCategoriesWithCounts(lang)` 返回 `(TaxonomyEntry & { count: number })[]`。

**理由**：

- `SidebarContent` 已是 join 点（join ProfileCard + taxonomy + 现在 counts）。分离 `getCategories`（taxonomy 读取）与 `getCategoryPostCounts`（posts 聚合）保持职责单一，各自可独立缓存。
- 不让 `lib/posts.ts` 反向耦合 taxonomy name 读取，保持现有分层（posts 模块不管 taxonomy 显示名）。
- `Record<id, number>` 让调用方用 `counts[category.id] ?? 0` 处理"分类存在但无文章"的情况，天然支持 0 计数显示。

### 决策 5：缓存返回引用 + JSDoc 警告，不加 `readonly`

**选择**：`getAllPosts` 在缓存命中时返回 `PostMeta[]` 引用，JSDoc 注明"返回缓存引用，不得 mutate"。

**备选**：返回 `readonly PostMeta[]`（类型层面禁止 mutate）。

**理由**：

- 现有所有调用方（`getPostsByCategory`、`getPostsByTag`、`HomePage`、`PostsPage`）均使用 `.filter()`（返回新数组）或只读遍历，无 mutate。
- `lib/taxonomy.ts` 的缓存先例也返回引用，风格一致。
- 加 `readonly` 会连锁影响 `PostList` props、`getPostsByCategory`/`getPostsByTag` 返回类型等，侵入性大，收益不成比例。
- `getCategoryPostCounts` 不需要额外缓存：它内部调 `getAllPosts`（已缓存），剩余只是 O(n) 内存遍历，微秒级，加缓存反而引入失效心智负担。

### 决策 6：UI 呈现--右对齐 `tabular-nums` 纯文本，不用 Badge

**选择**：分类项 `<NavLink>` 改为 `flex items-center justify-between`，左侧分类名，右侧 `<span className="text-muted tabular-nums">{count}</span>`。

**备选**：HeroUI `Badge` 包裹计数。

**理由**：

- 纯数字计数用 Badge 过重，博客侧栏的克制美学更适合 muted 纯文本。
- `tabular-nums` 让数字等宽对齐，多位数（如 12 vs 1）不会引起宽度抖动。
- 0 计数显示 `0`（不隐藏、不灰化），保持分类列表完整性，让访客知道"这个分类存在但还没内容"。

## Risks / Trade-offs

- **[缓存返回引用被 mutate]** -> JSDoc 注明约束；现有调用方均不 mutate（已审计）；未来若需更强保证可追加 `readonly`（独立变更）。
- **[dev 模式忘记重启导致缓存陈旧]** -> 本设计用 `NODE_ENV` 守卫避免 dev 缓存，dev 模式始终读 fs，无此风险。
- **[taxonomy 缓存有同样 DX 问题但本次不改]** -> 记录为已知技术债；taxonomy 变更低频，可接受；未来独立变更处理。
- **[计数在文章详情页对某些用户是噪音]** -> 接受；侧栏一致性优先；若未来需"阅读态隐藏"可独立变更（但会重新引入 client island 复杂度）。
