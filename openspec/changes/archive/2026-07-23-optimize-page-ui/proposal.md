## Why

Phase 1 的布局功能已落地，但存在多处视觉与可用性瑕疵：Header 透明背景导致滚动时内容透出、移动端内容紧贴屏幕边缘、侧栏头像圆角过大、桌面端语言切换器始终展示全部语言按钮占用过多空间、首页主内容与侧栏顶部高度不一致。这些问题影响阅读体验与视觉一致性，需在进入 Phase 2 前完成打磨。

## What Changes

- **Header 毛玻璃背景**：桌面端 `Header` 与移动端 `MobileHeader` 的 sticky 定位容器增加 `bg-background/80 backdrop-blur-md`，滚动时不再透出下方内容；保留 `border-b border-default` 作为分割线。
- **移动端水平 padding**：`app/[lang]/layout.tsx` 的内容容器由 `px-0 lg:px-6` 改为 `px-4 lg:px-6`，移动端内容获得 16px 两侧留白。
- **侧栏头像圆角**：`ProfileCard` 的 `Avatar`、`Avatar.Image`、`Avatar.Fallback` 由默认 `rounded-full` 改为 `rounded-lg`（8px）。
- **桌面端语言切换器改为 Dropdown**：`LanguageSwitcher` 新增 `variant: 'inline' | 'dropdown'` prop。桌面端 Header 使用 `variant="dropdown"`——仅展示地球图标按钮，点击后弹出下拉菜单（`中文 (ZH)`、`English (EN)`，当前 locale 显示勾选标记）；移动端设置 Popover 内继续使用 `variant="inline"`（保持现有按钮列表，避免嵌套 Popover）。
- **侧栏与主内容顶部对齐**：桌面端 `Sidebar` 的 sticky 包装层增加 `lg:pt-4`，使 `SidebarContent`（`p-4` = 16px）顶部总计 32px，与 `<main>` 的 `lg:py-8`（32px）对齐；移动端 Drawer 不受影响。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `app-layout`: Header 背景由透明改为毛玻璃；移动端内容容器增加水平 padding；侧栏头像圆角由 `rounded-full` 改为 `rounded-lg`；桌面端语言切换器由内联按钮列表改为地球图标 + Dropdown；桌面端侧栏与主内容顶部 padding 统一为 32px。

## Impact

- **代码文件**：
  - `components/layout/Header.tsx` — 增加毛玻璃背景类
  - `components/layout/MobileHeader.tsx` — 增加毛玻璃背景类
  - `components/layout/Sidebar.tsx` — sticky 包装层增加 `lg:pt-4`
  - `components/layout/ProfileCard.tsx` — Avatar 三处增加 `rounded-lg`
  - `components/layout/LanguageSwitcher.tsx` — 新增 `variant` prop，实现 `dropdown` 模式（HeroUI `Dropdown` + `Dropdown.Trigger` + `Dropdown.Menu` + `Dropdown.ItemIndicator`）
  - `app/[lang]/layout.tsx` — 内容容器 `px-0 lg:px-6` 改为 `px-4 lg:px-6`
- **依赖**：无新增依赖；复用已安装的 `@heroui/react`（`Dropdown`）、`lucide-react`（`Globe`）。
- **i18n**：复用现有 `Header.Language` message key 作为 Dropdown 触发按钮的 `aria-label`；语言原生名称（`中文`、`English`）硬编码在组件内（语言名称不翻译）。
- **无破坏性变更**：所有改动为视觉与交互细节调整，不涉及 URL 结构、数据模型或 API 契约。
