## ADDED Requirements

### Requirement: Header 毛玻璃背景

系统 SHALL 为桌面端 Header（`Header.tsx`）与移动端 Header（`MobileHeader.tsx`）的 sticky 容器添加毛玻璃背景效果。背景色 MUST 使用主题 token `bg-background` 配合 80% 透明度（`bg-background/80`），模糊半径 MUST 为 `backdrop-blur-md`（12px）。浅色模式下呈现白色毛玻璃，深色模式下呈现黑色毛玻璃，颜色由 `--background` token 自动适配。Header MUST 保留 `border-b border-default` 作为底部分割线。

#### Scenario: 浅色模式滚动时 Header 不透出内容

- **WHEN** 页面处于浅色模式且用户纵向滚动使内容经过 Header 区域
- **THEN** Header 显示为半透明白色毛玻璃背景（`bg-background/80`），下方内容经 12px 模糊后隐约可见但不清晰，Header 文字与按钮保持可读

#### Scenario: 深色模式滚动时 Header 不透出内容

- **WHEN** 页面处于深色模式且用户纵向滚动使内容经过 Header 区域
- **THEN** Header 显示为半透明黑色毛玻璃背景（`bg-background/80`，`--background` 为深色），下方内容经 12px 模糊后隐约可见但不清晰，Header 文字与按钮保持可读

#### Scenario: Header 保留底部边框

- **WHEN** 渲染桌面端或移动端 Header
- **THEN** Header 底部保留 `border-b border-default` 分割线，与主内容区分隔

### Requirement: 移动端内容水平留白

系统 SHALL 在 `app/[lang]/layout.tsx` 的内容容器（包裹 Sidebar 与 `<main>` 的 `<div>`）上设置响应式水平 padding：移动端（`<lg`）为 `px-4`（16px），桌面端（`lg+`）为 `lg:px-6`（24px）。移动端内容（文章卡片、文本等）MUST NOT 紧贴屏幕左右边缘。

#### Scenario: 移动端内容两侧有 16px 留白

- **WHEN** 视口宽度 `< 1024px` 且页面渲染文章列表或文章详情
- **THEN** 主内容区左右两侧各有 16px 留白，内容不紧贴屏幕边缘

#### Scenario: 桌面端内容两侧留白保持 24px

- **WHEN** 视口宽度 `>= 1024px`
- **THEN** 内容容器左右两侧保持 24px（`lg:px-6`）留白，与现有桌面端布局一致

### Requirement: 侧栏头像圆角

系统 SHALL 将 `ProfileCard` 中 `Avatar` 的圆角由默认的 `rounded-full`（圆形）改为 `rounded-lg`（8px 圆角矩形）。`Avatar`、`Avatar.Image`、`Avatar.Fallback` 三处 MUST 同步应用 `rounded-lg`，确保图片加载前后圆角一致。该要求同时作用于桌面端 Sidebar 与移动端 Drawer 中的个人信息名片（两者共用 `ProfileCard` 组件）。

#### Scenario: 桌面端 Sidebar 头像显示 8px 圆角

- **WHEN** 桌面端渲染 Sidebar 中的 `ProfileCard` 且 GitHub 头像加载成功
- **THEN** 头像显示为 8px 圆角矩形（`rounded-lg`），而非完整圆形

#### Scenario: 移动端 Drawer 头像显示 8px 圆角

- **WHEN** 移动端 Drawer 打开并渲染 `ProfileCard` 且 GitHub 头像加载成功
- **THEN** 头像显示为 8px 圆角矩形（`rounded-lg`），与桌面端一致

#### Scenario: 头像加载失败时 Fallback 保持相同圆角

- **WHEN** GitHub 头像 URL 不可达或加载失败
- **THEN** `Avatar.Fallback` 显示用户名首字母，圆角为 `rounded-lg`（8px），与头像加载成功时一致

### Requirement: 语言切换器组件

系统 SHALL 提供客户端组件 `LanguageSwitcher`，支持通过 `variant: 'inline' | 'dropdown'` prop 切换两种渲染模式。组件 MUST 使用 `useLocale()` 获取当前 locale，使用 `usePathname()`（locale-stripped）与 `useRouter().push(pathname, { locale })` 在切换 locale 时保留当前路径。切换 locale 时 MUST 使用 `useTransition` 包裹导航以避免阻塞 UI。

`variant="dropdown"` 模式（桌面端 Header 使用）MUST 渲染为 HeroUI `Dropdown`：触发器为仅含地球图标（`lucide-react` `Globe`）的图标按钮（`isIconOnly` `variant="ghost"`），`aria-label` 使用 `Header.Language` message key。点击触发器 MUST 弹出下拉菜单，菜单项使用 `selectionMode="single"` + `selectedKeys` 标记当前 locale。每个菜单项 MUST 显示语言原生名称与 locale 代码（`中文 (ZH)`、`English (EN)`），当前 locale 对应的菜单项 MUST 显示勾选标记（`Dropdown.ItemIndicator`）。语言原生名称 MUST 硬编码在组件内（不经过 i18n 翻译）。点击非当前 locale 的菜单项 MUST 调用 `switchTo(targetLocale)` 并关闭菜单；点击当前 locale 对应的菜单项 MUST 不触发导航（`switchTo` 内短路返回）。

`variant="inline"` 模式（移动端设置 Popover 内使用）MUST 渲染为地球图标加全部 locale 按钮的内联列表（保持现有行为），每个按钮显示 locale 代码大写（`ZH`、`EN`），当前 locale 按钮使用 `variant="secondary"`，其余使用 `variant="ghost"`。

#### Scenario: 桌面端 Header 渲染 Dropdown 语言切换器

- **WHEN** 桌面端渲染 Header 中的语言切换器
- **THEN** Header 右侧显示一个仅含地球图标的按钮，不显示任何 locale 文本或额外按钮

#### Scenario: 点击地球图标展开语言菜单

- **WHEN** 用户在桌面端点击语言切换器的地球图标按钮
- **THEN** 弹出下拉菜单，显示两个菜单项：`中文 (ZH)` 与 `English (EN)`；当前 locale 对应的菜单项前显示勾选标记

#### Scenario: 从中文切换至英文

- **WHEN** 当前 locale 为 `zh`，用户点击 `English (EN)` 菜单项
- **THEN** 菜单关闭，系统导航至同一路径的 `en` locale 版本（URL `[lang]` 段由 `zh` 变为 `en`）

#### Scenario: 点击当前 locale 菜单项不触发导航

- **WHEN** 当前 locale 为 `zh`，用户点击 `中文 (ZH)` 菜单项
- **THEN** 菜单关闭，不触发路由导航，页面 URL 不变

#### Scenario: 移动端设置弹窗内渲染内联语言切换器

- **WHEN** 移动端用户点击设置按钮弹出 Popover
- **THEN** Popover 内显示地球图标与 `ZH`、`EN` 两个按钮，当前 locale 按钮高亮（`variant="secondary"`）

#### Scenario: 移动端内联切换 locale

- **WHEN** 移动端设置 Popover 内用户点击非当前 locale 的按钮
- **THEN** 系统导航至同一路径的目标 locale 版本

#### Scenario: 语言原生名称不随当前 locale 翻译

- **WHEN** 当前 locale 为 `en` 且用户打开桌面端语言切换器下拉菜单
- **THEN** 菜单项显示 `中文 (ZH)` 与 `English (EN)`（中文项始终显示"中文"，英文项始终显示"English"），而非将语言名称翻译为当前 locale 语言

### Requirement: 桌面端侧栏与主内容顶部对齐

系统 SHALL 确保桌面端（`lg+`）Sidebar 内容顶部与 `<main>` 内容顶部在视觉上对齐。`Sidebar.tsx` 的 sticky 包装层 MUST 添加 `lg:pt-4`（16px），使 `SidebarContent`（`p-4` = 16px）顶部总计 32px，等于 `<main>` 的 `lg:py-8`（32px）。移动端 Drawer 内的 `SidebarContent` MUST NOT 受此改动影响（`Sidebar` 在移动端 `hidden`，`lg:pt-4` 不生效）。

#### Scenario: 桌面端侧栏顶部与主内容顶部对齐

- **WHEN** 桌面端渲染首页（文章列表）且 Sidebar 与 main 同时可见
- **THEN** Sidebar 内 `ProfileCard` 的顶部边缘与 `<main>` 内第一个 `PostCard` 的顶部边缘在同一水平线上（均距 Header 底部 32px）

#### Scenario: 移动端 Drawer 内侧栏顶部不受对齐改动影响

- **WHEN** 移动端打开 Drawer 并渲染 `SidebarContent`
- **THEN** `SidebarContent` 顶部 padding 仍为 `p-4`（16px），不额外增加 `lg:pt-4` 的 16px
