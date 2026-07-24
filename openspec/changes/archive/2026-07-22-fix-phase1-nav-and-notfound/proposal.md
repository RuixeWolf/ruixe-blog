## Why

Phase 1 核心基础已实现并归档，但探索发现两处功能 gap：（1）移动端 Drawer 缺少主导航（Home/About/GitHub），导致 `<lg` 视口下 About 页与 GitHub 外链不可达（首页仍可通过标题 logo 到达）；（2）无效 locale 或不存在的 slug/category/tag 触发 `notFound()` 后回退到 Next.js 默认 404 页，未本地化、未品牌化。两者均为 Phase 1 spec 已有要求但实现遗漏，需补全以保证移动端导航完整性与全站 404 体验一致性。

## What Changes

- **移动端 Drawer 补充主导航**：在 `MobileDrawer` 内容顶部插入导航区块（首页、关于、GitHub 外链），与桌面端 Header 导航复用同一 `NavLinks` 组件，使移动端用户可从 Drawer 导航至所有页面。
- **Header 导航提取为共享组件**：将 `Header.tsx` 内联的导航逻辑抽取为 `components/layout/NavLinks.tsx`（Server Component），Header 与 Drawer 共用，避免导航项定义重复。
- **Drawer 导航项点击自动关闭**：Drawer 内任何导航链接（NavLinks + SidebarContent 的分类/标签）点击后自动关闭 Drawer，通过父级 click-interceptor `<div>` 拦截事件冒泡实现，无需每个 Link 单独传 `onClick`。
- **新增本地化 404 页面**：创建 `app/[lang]/not-found.tsx`，使用 `useTranslations('NotFound')` 读取已就绪的翻译文案（`Title`/`Description`/`BackHome`），渲染品牌化的 404 页面，含"返回首页"按钮（locale-aware `Link` 指向当前 locale 首页）。
- **不新增 root `app/not-found.tsx`**：当前 `proxy.ts` middleware 会拦截并重定向所有非 locale 前缀路径，locale layout 自身 `notFound()` 的极端边界情况由 Next.js 默认 404 兜底，可接受。

## Capabilities

### New Capabilities

无（本次为现有 capability 的 spec 补全与实现修正）。

### Modified Capabilities

- `app-layout`: 移动端 Drawer requirement 补充"内容含主导航"与"导航项点击自动关闭 Drawer"的行为约束；新增"导航复用组件"requirement 规定 Header 与 Drawer 共享 `NavLinks` 组件。
- `i18n-routing`: "Locale 校验与 404 处理" requirement 补充"404 页面本地化渲染"约束--`notFound()` 触发后 MUST 渲染 `app/[lang]/not-found.tsx` 本地化页面而非 Next.js 默认 404。

## Impact

**新增文件：**

- `components/layout/NavLinks.tsx` - 共享导航组件（Server Component），支持 `variant: 'header' | 'drawer'` 样式切换，渲染 Home/About/GitHub 三个导航项。
- `app/[lang]/not-found.tsx` - 本地化 404 页面（非 async Server Component），用 `useTranslations('NotFound')` 读取文案。

**修改文件：**

- `components/layout/Header.tsx` - 将内联 `<nav>` 替换为 `<NavLinks variant="header" />`，删除冗余的导航项渲染代码。
- `components/layout/MobileHeader.tsx` - 新增 `navLinks` RSC prop；在 `MobileDrawer` 的 `Drawer.Body` 内用 click-interceptor `<div onClick={close}>` 包裹 `navLinks` + `sidebar`，实现导航点击自动关闭。
- `app/[lang]/layout.tsx` - 渲染 `<NavLinks variant="drawer" />` 并作为 `navLinks` prop 传入 `MobileHeader`（与现有 `sidebar={<SidebarContent />}` 模式一致）。

**无需修改：**

- `i18n/messages/{zh,en}.json` - `Nav`（Home/About/Github）与 `NotFound`（Title/Description/BackHome）翻译 key 已存在，无需新增。
- `content/`、`lib/` - 内容与服务端工具无变更。
- `components/layout/SidebarContent.tsx` - 保持"名片+分类+标签"纯粹职责，导航由 Drawer 外层组合，不侵入共享组件。
- `components/layout/MobileDrawer.tsx` - Drawer 组件本身不变（仍是 `children` 透传），关闭逻辑由 `MobileHeader` 的 click-interceptor 处理。

**约束（来自 AGENTS.md，不变）：**

- `typescript: ~6.0.3`、`eslint: ~9.39.5` 不 bump。
- HeroUI v3 compound 组件 API（已通过 `heroui-react` MCP 验证 `Link` 接受标准 `<a>` props）。
- `siteConfig.githubUrl` 仅在 Server Component 中使用（`process.env.GITHUB_USERNAME` 未加 `NEXT_PUBLIC_` 前缀，Client Component 中不可用）--NavLinks 作为 Server Component 直接读取，无需 prop 传递。

**风险点：**

- `app/[lang]/not-found.tsx` 是项目中首个用 `useTranslations`（非 async Server Component）而非 `getTranslations`（async）的页面。这是 next-intl 官方推荐的 not-found 模式（hooks 在非 async Server Component 中可用，且 not-found 边界上下文可能不完整时更稳健）。
- click-interceptor `<div onClick>` 需确保不阻止 Next.js Link 的客户端导航--`onClick` 仅调用 `setIsDrawerOpen(false)`，不调用 `e.preventDefault()`，事件冒泡触发关闭后导航正常继续。
