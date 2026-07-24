## Context

Phase 1 核心基础（`2026-07-22-phase1-core-foundation`）已实现并归档，建立了 i18n 路由、响应式布局、MDX 内容管线三大基石。但实现验证发现两处 gap：

1. **移动端 Drawer 缺主导航**：`SidebarContent` 被桌面 `Sidebar` 与移动 `MobileDrawer` 共用，内容为"名片+分类+标签"。桌面端导航在 Header 中（`hidden lg:flex`），移动端 Header（`lg:hidden`）无导航，且 Drawer 也未补充导航--导致 `<lg` 视口下 About 页与 GitHub 外链不可达。
2. **404 页面未本地化**：`i18n/messages/{zh,en}.json` 已有 `NotFound` 翻译 key（`Title`/`Description`/`BackHome`），但未创建 `app/[lang]/not-found.tsx`。无效 locale、不存在 slug/category/tag 触发 `notFound()` 后回退到 Next.js 默认 404 页。

现有 spec 矛盾：`app-layout` 的"移动端 Drawer" requirement 声明"内容与桌面端 Sidebar 一致（名片、导航、分类、标签）"包含导航，但"桌面端常驻 Sidebar" requirement 声明 Sidebar 内容为"名片、分类、标签"无导航--两者共享同一组件但内容需求不同。

**技术约束：**

- `siteConfig.githubUrl` 读取 `process.env.GITHUB_USERNAME`（未加 `NEXT_PUBLIC_` 前缀），仅在 Server Component 中可用。Client Component 引用会永远回退到默认值 `'RuixeWolf'`，忽略环境变量。
- HeroUI v3 `Link` 包装 `react-aria-components/Link`，渲染原生 `<a>`，标准 `onClick` 透传到 DOM。
- next-intl 官方推荐 `not-found.tsx` 用 `useTranslations`（非 async Server Component hook），而非 `getTranslations`（async Server API）--因 not-found 边界上下文可能不完整。
- 项目所有页面均标记 `'server-only'`，Server/Client 边界通过 RSC payload 传递（如 `MobileHeader` 的 `sidebar` prop 模式）。

## Goals / Non-Goals

**Goals:**

- 移动端 Drawer 包含主导航（Home/About/GitHub），与桌面 Header 复用同一 `NavLinks` 组件。
- Drawer 内任何导航链接点击后自动关闭 Drawer。
- 创建本地化 404 页面，复用已就绪的 `NotFound` 翻译文案。
- Header 导航逻辑提取为共享组件，避免重复定义。
- 不破坏现有 Server/Client 边界与 RSC payload 传递模式。

**Non-Goals:**

- 不新增 root `app/not-found.tsx`（middleware 已拦截非 locale 前缀路径，极端边界由 Next.js 默认 404 兜底）。
- 不实现搜索功能（Phase 2 范围）。
- 不修改 `SidebarContent` 的纯粹职责（名片+分类+标签），导航由 Drawer 外层组合。
- 不修改 `MobileDrawer` 组件本身（仍是 `children` 透传），关闭逻辑在 `MobileHeader` 层处理。
- 不新增 i18n 翻译 key（`Nav` 与 `NotFound` 命名空间已完整就绪）。

## Decisions

### Decision 1: NavLinks 为 Server Component + click-interceptor div

**选择：** NavLinks 是 Server Component；Drawer 内通过父级 `<div onClick={close}>` 包裹 NavLinks + SidebarContent，拦截点击冒泡实现自动关闭。

**备选方案 A：NavLinks 为 Client Component + onNavigate prop**

- 每个 `<Link>` 单独传 `onClick={onNavigate}`。
- 问题：`siteConfig.githubUrl` 在 Client Component 中不可用（`process.env.GITHUB_USERNAME` 无 `NEXT_PUBLIC_` 前缀），需额外传 `githubUrl` prop 绕过。
- 问题：与项目 Server Component 为主的风格不一致。

**理由：**

- Server Component 直接读取 `siteConfig.githubUrl`，无需 prop 传递，环境变量正确生效。
- click-interceptor 是成熟 React 模式--一个 `<div onClick>` 处理所有子链接关闭，无需每个 Link 单独传回调。
- 事件冒泡不阻止 Next.js Link 客户端导航：`onClick` 仅调用 `setIsDrawerOpen(false)`，不调用 `e.preventDefault()`，导航正常继续。
- 与 `MobileHeader` 现有 `sidebar` prop（RSC payload）模式一致--新增 `navLinks` prop 同为 RSC payload。

**数据流：**

```
app/[lang]/layout.tsx (Server)
  ├─ <Header locale={locale} />                           ← Header (Server) 渲染 <NavLinks variant="header" />
  └─ <MobileHeader
       sidebar={<SidebarContent locale={locale} />}        ← RSC payload (现有)
       navLinks={<NavLinks variant="drawer" />}            ← RSC payload (新增)
     />
       └─ MobileHeader (Client)
            └─ <MobileDrawer isOpen={...} onOpenChange={...}>
                 └─ Drawer.Body
                      └─ <div onClick={() => setIsDrawerOpen(false)}>  ← click-interceptor
                           ├─ {navLinks}     ← NavLinks (Server-rendered)
                           └─ {sidebar}      ← SidebarContent (Server-rendered)
                         </div>
```

### Decision 2: Header 也改用 NavLinks 组件

**选择：** Header 从内联 `<nav>` 改为渲染 `<NavLinks variant="header" />`。

**理由：**

- DRY 原则--导航项定义（Home/About/GitHub、图标、外链 target、翻译 key）唯一维护。
- Server Component 渲染 Client 子组件在 RSC 下完全正常（NavLinks 是 Server Component，Header 也是 Server Component，直接组合）。
- `variant` prop 控制样式差异：`header` 为水平排列（`flex-row gap-4 text-sm`），`drawer` 为垂直排列（`flex-col gap-1 text-base`，有 hover 背景）。

### Decision 3: click-interceptor 包裹整个 Drawer.Body（NavLinks + SidebarContent）

**选择：** click-interceptor `<div>` 包裹 NavLinks 和 SidebarContent 全部内容，任何导航链接点击都关闭 Drawer。

**备选方案：仅包裹 NavLinks**

- 问题：分类/标签链接点击后 Drawer 不关闭，用户需手动关闭，体验不一致。

**理由：**

- 移动端体验一致性--任何导航行为（首页、关于、GitHub、分类、标签）都应关闭 Drawer。
- ProfileCard 的"GitHub 关注"按钮是外链（`target="_blank"`），点击会打开新标签页并关闭 Drawer，行为合理。
- 实现最简单--一个 div 包全部，无需区分哪些链接需要关闭。

### Decision 4: NotFound 页面用 useTranslations（非 async Server Component）

**选择：** `app/[lang]/not-found.tsx` 为非 async Server Component，用 `useTranslations('NotFound')` 读取文案。

**备选方案：getTranslations（async Server Component）**

- 问题：next-intl 官方文档推荐 not-found 用 `useTranslations`，因 not-found 边界的请求上下文可能不完整（如 locale layout 自身 `notFound()` 时 `setRequestLocale` 未执行），`useTranslations` 从 React Context 读取更稳健。
- 问题：`getTranslations` 需 async 函数，而 not-found 页面通常不需 async（无数据获取）。

**理由：**

- 匹配 next-intl 官方 not-found 模式（文档示例用 `useTranslations`）。
- next-intl 在 Server Component 中支持 hooks（通过 `react-server` 条件导出），`useTranslations` 在非 async Server Component 中可用。
- `NotFound` 翻译 key 已就绪（`Title`/`Description`/`BackHome`），无需新增。
- "返回首页"按钮用 `Link` from `@/i18n/navigation`（locale-aware），指向 `/` 会自动带当前 locale 前缀。

### Decision 5: 不建 root app/not-found.tsx

**选择：** 仅创建 `app/[lang]/not-found.tsx`，不创建 root `app/not-found.tsx`。

**理由：**

- `proxy.ts` middleware 的 matcher 拦截所有非 locale 前缀路径并重定向至 `/[defaultLocale]`，极端边界（locale layout 自身 `notFound()`）几乎不会触发。
- root `app/not-found.tsx` 需额外处理无 locale 上下文的情况（`NextIntlClientProvider` 未挂载），复杂度增加但收益极低。
- localized `app/[lang]/not-found.tsx` 已覆盖所有实际 404 场景（无效路由、post/category/tag not found）。
- 若未来需要 root 404，可作为独立 change 补充。

## Risks / Trade-offs

- **[click-interceptor 误关闭]** ProfileCard 内非导航元素（如头像、Bio 文本）的点击也会触发 `onClick` 关闭 Drawer。-> **可接受**：Drawer 本身是临时导航容器，点击任意位置关闭是合理的移动端交互模式（类似 Modal 点击内容关闭的争议，但 Drawer 内容均为导航性质，关闭后重新打开成本低）。若需精确控制，可改为仅包裹 NavLinks + SidebarContent 的 `<nav>`/`<a>` 元素，但增加复杂度，当前方案足够。

- **[NavLinks variant 样式差异]** Header（水平）与 Drawer（垂直）的样式差异通过 `variant` prop 分支控制，略不优雅。-> **可接受**：分支仅影响 className，渲染逻辑一致。若未来导航项增多或样式分叉严重，可拆为 `HeaderNav` 与 `DrawerNav` 两个组件，当前 3 个导航项不值得拆分。

- **[NotFound useTranslations 风格不一致]** 项目其他页面用 `getTranslations`（async），NotFound 用 `useTranslations`（非 async）。-> **可接受**：这是 next-intl 官方推荐的 not-found 模式，且 not-found 页面无数据获取无需 async。项目中有一个特例是可接受的，可在代码注释中说明原因。

- **[root 404 边界]** 不建 root `app/not-found.tsx` 意味着极端边界（绕过 middleware 的非 locale 路径）回退到 Next.js 默认 404。-> **可接受**：middleware matcher 已覆盖所有常规路径，该边界几乎不会触发。若未来验证发现实际触发，可补充 root 404 作为独立改动。
