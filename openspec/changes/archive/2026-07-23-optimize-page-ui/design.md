## Context

Phase 1 已交付完整的响应式布局（桌面端 Header + Sidebar、移动端 Header + Drawer、主题切换、i18n 路由、MDX 内容管线）。功能正确但存在 5 处视觉与交互瑕疵（详见 proposal.md）。本设计文档记录打磨阶段的技术决策，所有改动均为 CSS 类与组件 props 调整，不涉及数据流、路由或内容架构变更。

当前相关实现：

- `Header.tsx` / `MobileHeader.tsx`：sticky `top-0 z-40`，仅有 `border-b border-default`，无背景色。
- `app/[lang]/layout.tsx`：内容容器 `px-0 lg:px-6`，移动端 `<main>` 无水平 padding。
- `ProfileCard.tsx`：`<Avatar className="size-20">` 默认 `rounded-full`。
- `LanguageSwitcher.tsx`：内联 `<Globe>` + 全部 locale 按钮，桌面端与移动端共用同一渲染。
- `Sidebar.tsx`：sticky 包装层无 padding；`SidebarContent` 用 `p-4`（16px）；`<main>` 用 `py-6 lg:py-8`（桌面 32px），存在 16px 顶部落差。

## Goals / Non-Goals

**Goals:**

- Header 滚动时有毛玻璃遮罩，不透出下方内容。
- 移动端内容两侧有 16px 留白。
- 侧栏头像圆角更小（8px），视觉风格偏专业。
- 桌面端语言切换器收缩为地球图标 + Dropdown，节省 Header 空间。
- 桌面端侧栏顶部与主内容顶部对齐（均为 32px）。

**Non-Goals:**

- 不改变 Header 高度、Sidebar 宽度、断点（`lg`）。
- 不改变移动端 Drawer 内的语言切换交互（保持内联按钮，避免嵌套 Popover）。
- 不引入新依赖。
- 不调整主题 token 值（`--background` 等）。
- 不实现搜索功能（仍为占位）。

## Decisions

### Decision 1: 毛玻璃背景使用主题 token + `backdrop-blur-md`

**选择**：`bg-background/80 backdrop-blur-md`。

**理由**：`--background` token 在浅色模式为 `oklch(97% 0.0015 243.6)`（近白），深色模式为 `oklch(12% 0.0015 243.6)`（近黑），天然满足"白色毛玻璃 / 黑色毛玻璃"需求，且随主题自定义自动适配。`/80` 透明度配合 `backdrop-blur-md`（12px）在可读性与透视感之间取得平衡。代码库已有 `bg-secondary/80`、`bg-primary/90` 等先例，token + 透明度修饰符模式成熟。

**备选**：

- 纯 `bg-white/80 dark:bg-black/80`：字面符合需求，但略亮于页面背景，且脱离主题体系。
- 自定义 oklch 值：控制力最强但维护成本高，收益不明显。

### Decision 2: 桌面端与移动端 Header 同时加毛玻璃

**选择**：`Header.tsx` 与 `MobileHeader.tsx` 均加 `bg-background/80 backdrop-blur-md`。

**理由**：两者都有相同的透明背景问题（sticky + 无背景），视觉一致性要求统一处理。移动端 `h-14` 与桌面端 `h-16` 高度不同但毛玻璃参数相同。

### Decision 3: 移动端 padding 加在外层容器

**选择**：`app/[lang]/layout.tsx` 的 `<div>` 由 `px-0 lg:px-6` 改为 `px-4 lg:px-6`。

**理由**：外层容器是 Sidebar 与 `<main>` 的共同父级。移动端 Sidebar `hidden`，所以 `px-4` 实际只作用于 `<main>`，效果等同但单一来源。`px-4`（16px）是移动端标准 gutter 宽度。桌面端保持 `lg:px-6`（24px）不变。

**备选**：在 `<main>` 上加 `px-4 lg:px-0`——多一个需要维护的 padding 来源，且未来若 Sidebar 在移动端可见会出错。

### Decision 4: 头像圆角 `rounded-lg`，三处同步

**选择**：`Avatar`、`Avatar.Image`、`Avatar.Fallback` 均加 `rounded-lg`（8px）。

**理由**：HeroUI v3 `Avatar` 无 `shape` prop，通过 `className` 覆盖。文档"square avatar"示例在三处同步加 `rounded-lg` 以确保图片加载前后的圆角一致。`rounded-lg`（8px）相比 `rounded-full` 明显更"方"，符合"圆角改小一些"的诉求。

**备选**：`rounded-xl`（12px）——改动幅度较小，视觉差异不明显。

### Decision 5: 语言切换器加 `variant` prop，桌面端用 Dropdown

**选择**：`LanguageSwitcher` 新增 `variant: 'inline' | 'dropdown'`。

- `variant="dropdown"`（桌面端 Header）：`<Dropdown.Trigger>` 包裹地球图标按钮，`<Dropdown.Menu selectionMode="single" selectedKeys={new Set([currentLocale])}>`，每个 `<Dropdown.Item>` 含 `<Dropdown.ItemIndicator />`（自动勾选）与 `<Label>` 显示 `中文 (ZH)` / `English (EN)`。`onAction` 调用现有 `switchTo()`。
- `variant="inline"`（移动端设置 Popover）：保持现有 `<Globe>` + locale 按钮列表不变。

**理由**：

- `variant` prop 模式已有先例（`NavLinks variant="header" | "drawer"`），代码风格一致。
- React Aria `Dropdown` 默认点击触发，符合"点击后展开"诉求且天然支持键盘导航（无障碍）。
- `selectionMode="single"` + `selectedKeys` + `Dropdown.ItemIndicator` 是文档推荐的单选 + 勾选标记模式，无需自定义勾选逻辑。
- 移动端设置 Popover 内若再嵌 Dropdown 会形成嵌套浮层，UX 不佳；保持内联按钮更合适。
- 语言原生名称（`中文`、`English`）硬编码，因为语言名称不翻译——中国用户看到 `English`，英语用户看到 `中文` 是正确的。

**备选**：

- 拆分为两个组件 `LanguageSwitcherDropdown` + `LanguageSwitcherInline`：重复 locale 切换逻辑。
- 悬停触发：React Aria Dropdown 默认不支持 hover，需自定义 `onHoverChange`，且对键盘/触摸用户不友好。

### Decision 6: 桌面端侧栏与主内容顶部对齐采用"Sidebar 包装层加 pt"

**选择**：`Sidebar.tsx` 的 sticky `<div>` 加 `lg:pt-4`，使 `SidebarContent`（`p-4` = 16px）顶部总计 32px = `<main>` 的 `lg:py-8`（32px）。

**理由**：`SidebarContent` 被桌面侧栏与移动 Drawer 共用。直接改 `SidebarContent` 的 padding 会影响 Drawer 内顶部间距。在 `Sidebar.tsx` 的包装层（仅桌面端可见）加 `lg:pt-4`，既实现对齐又不影响移动端。

```
桌面端对齐后：
  Sidebar sticky div:  lg:pt-4 (16px) + SidebarContent p-4 (16px) = 32px
  main:                lg:py-8 (32px)
  ✅ 对齐

移动端 Drawer：
  Drawer.Body 默认 padding + SidebarContent p-4 (16px)
  ✅ 不受 lg:pt-4 影响（Sidebar 在移动端 hidden）
```

**备选**：

- 改 `SidebarContent` 为 `px-4 pt-8 pb-4`：影响 Drawer 内顶部多 16px。
- 统一降为 `pt-6`（24px）：需要同时改 `SidebarContent` 和 `<main>`，且 24px 不是 Tailwind 默认 spacing 值（需 `pt-6` = 24px，可行但改动面更大）。

## Risks / Trade-offs

- **`backdrop-blur` 性能**：旧设备或大量滚动时可能有轻微性能开销。-> 缓解：仅用于 Header（面积小、固定高度），不影响主内容区。
- **Dropdown Popover z-index 与 Header z-40 的关系**：HeroUI Dropdown Popover 默认 z-index 远高于 40，无需手动调整。-> 验证：实现后浏览器实测确认下拉菜单浮在 Header 之上。
- **`onAction` 的 `key` 类型断言**：React Aria `onAction` 接收 `Key`（`string | number`），需 `as Locale` 断言。-> 缓解：`switchTo` 签名已限制为 `(typeof routing.locales)[number]`，运行时 `routing.locales.includes(key)` 可做兜底校验。
- **语言名称硬编码 vs i18n**：硬编码 `中文`/`English` 意味着新增 locale 时需改组件常量。-> 缓解：当前仅 2 个 locale，且语言原生名称本就不应翻译；若未来 locale 增多可抽为配置。
- **`bg-background/80` 在 Safari 旧版**：`backdrop-filter` 需 `-webkit-` 前缀。-> 缓解：Tailwind v4 的 `backdrop-blur-md` 自动加前缀，无需手动处理。
