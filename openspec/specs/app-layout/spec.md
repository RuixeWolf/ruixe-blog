# App Layout Specification

## Purpose

定义 Ruixe Blog 的响应式页面布局结构，包括桌面端常驻 Header 与 Sidebar、移动端 Header 与 Drawer、GitHub 个人信息名片、深浅色主题切换，以及根布局与 locale 布局的职责分离。

## Requirements

### Requirement: 响应式布局断点

系统 SHALL 使用 Tailwind CSS 的 `lg` 断点（`>= 1024px`）作为桌面端与移动端布局切换点。桌面端布局 MUST 在 `lg` 及以上显示，移动端布局 MUST 在 `lg` 以下显示。

#### Scenario: 桌面端视口下显示常驻 Sidebar

- **WHEN** 视口宽度 `>= 1024px`
- **THEN** 页面显示桌面端 Header + 左侧常驻 Sidebar + 主内容区

#### Scenario: 移动端视口下隐藏 Sidebar 并显示 Drawer 触发器

- **WHEN** 视口宽度 `< 1024px`
- **THEN** 页面显示移动端 Header（含汉堡按钮），Sidebar 隐藏；点击汉堡按钮打开 Drawer

### Requirement: 桌面端 Header

系统 SHALL 在桌面端（`lg+`）渲染常驻 Header，左侧为网站标题 `Ruixe Blog` 与导航（首页、关于、GitHub 外链），右侧为功能栏（搜索按钮、语言切换、主题切换）。Header MUST 使用 `sticky` 定位，在滚动时保持可见。搜索按钮 SHALL 渲染为 `SearchTrigger` 组件（替换原占位搜索按钮），点击时打开搜索弹窗（由 `post-search` 能力定义）。桌面端 `SearchTrigger` SHALL 在按钮旁渲染 `⌘K`/`Ctrl+K` `Kbd` 提示（仅客户端挂载后渲染，避免 hydration 不匹配）。

#### Scenario: 桌面端 Header 布局

- **WHEN** 桌面端渲染 Header
- **THEN** 左侧依次显示 `Ruixe Blog` 标题与"首页"、"关于"、"GitHub"导航项；右侧依次显示搜索按钮（`SearchTrigger`）、语言切换器、主题切换按钮

#### Scenario: 点击 GitHub 导航项跳转外链

- **WHEN** 用户点击 Header 中的 "GitHub" 导航项
- **THEN** 浏览器在新标签页打开 `https://github.com/RuixeWolf`（或配置的 GitHub 主页 URL）

#### Scenario: 点击搜索按钮打开搜索弹窗

- **WHEN** 用户在桌面端点击 Header 中的搜索按钮（`SearchTrigger`）
- **THEN** 搜索弹窗打开（由 `post-search` 能力定义），搜索输入框获得焦点

#### Scenario: 桌面端搜索按钮显示 Kbd 提示

- **WHEN** 桌面端渲染 Header 且 `SearchTrigger` 已在客户端挂载
- **THEN** 搜索按钮旁显示 `⌘K`（macOS）或 `Ctrl+K`（其他平台）Kbd 提示

### Requirement: 移动端 Header

系统 SHALL 在移动端（`<lg`）渲染 Header，左侧为汉堡按钮（打开 Drawer），中间为网站标题 `Ruixe Blog`，右侧为功能栏（搜索按钮、设置按钮）。搜索按钮 SHALL 渲染为 `SearchTrigger` 组件（替换原占位搜索按钮），点击时打开搜索弹窗（由 `post-search` 能力定义），弹窗以全屏覆盖模式打开。移动端 `SearchTrigger` MUST NOT 渲染 Kbd 提示。设置按钮点击 SHALL 弹出包含语言切换与主题切换的弹窗。

#### Scenario: 移动端 Header 布局

- **WHEN** 移动端渲染 Header
- **THEN** 左侧显示汉堡按钮，中间显示 `Ruixe Blog` 标题，右侧显示搜索按钮（`SearchTrigger`）与设置图标按钮

#### Scenario: 点击汉堡按钮打开 Drawer

- **WHEN** 用户在移动端点击汉堡按钮
- **THEN** Drawer 从左侧滑入，展示个人信息名片、导航、分类列表、标签云

#### Scenario: 点击设置按钮弹出功能弹窗

- **WHEN** 用户在移动端点击设置按钮
- **THEN** 弹窗显示语言切换器与主题切换按钮

#### Scenario: 点击搜索按钮打开全屏搜索弹窗

- **WHEN** 用户在移动端点击 Header 中的搜索按钮（`SearchTrigger`）
- **THEN** 搜索弹窗以全屏覆盖模式打开（由 `post-search` 能力定义），搜索输入框获得焦点

### Requirement: 桌面端常驻 Sidebar

系统 SHALL 在桌面端（`lg+`）主内容区左侧渲染常驻 Sidebar，从上至下依次为：GitHub 个人信息名片、文章分类列表、文章标签云。Sidebar 内容 MUST 与移动端 Drawer 共享同一数据源与渲染组件。文章分类列表每一项 SHALL 在分类名称右侧显示该分类下的文章计数（当前 locale 下属于该分类的文章数量），计数 MUST 为纯文本数字，使用 `text-muted` + `tabular-nums` 样式右对齐显示，不使用 `Badge` 组件包裹。计数为 0 的分类 MUST 显示 `0`（不隐藏、不灰化）。

#### Scenario: Sidebar 渲染分类与标签

- **WHEN** 桌面端渲染 Sidebar 且 `content/taxonomy/categories.yaml` 含 `frontend`、`backend` 分类
- **THEN** Sidebar 分类列表显示 `frontend`、`backend` 对应当前 locale 的名称

#### Scenario: Sidebar 分类项显示文章计数

- **WHEN** 桌面端渲染 Sidebar 且当前 locale 下 `frontend` 分类有 1 篇文章、`backend` 分类有 0 篇文章
- **THEN** `frontend` 分类项右侧显示纯文本 `1`，`backend` 分类项右侧显示纯文本 `0`，计数使用 `text-muted tabular-nums` 样式右对齐

#### Scenario: 点击分类跳转分类页

- **WHEN** 用户在 Sidebar 点击分类 `frontend`
- **THEN** 系统导航至 `/[lang]/categories/frontend`

### Requirement: 移动端 Drawer

系统 SHALL 在移动端（`<lg`）通过 HeroUI `Drawer` 组件实现侧栏抽屉，内容从上至下依次为：主导航（首页、关于、GitHub 外链）、GitHub 个人信息名片、文章分类列表、文章标签云。其中个人信息名片、分类列表、标签云 MUST 与桌面端 Sidebar 共享同一数据源与渲染组件（`SidebarContent`）；主导航 MUST 与桌面端 Header 共享同一 `NavLinks` 组件。Drawer MUST 支持点击遮罩或关闭按钮关闭。Drawer 内任意导航链接（主导航项、分类项、标签项）点击后 MUST 自动关闭 Drawer。

#### Scenario: 打开 Drawer

- **WHEN** 用户点击移动端汉堡按钮
- **THEN** Drawer 从左侧滑入，遮罩覆盖主内容，内容从上至下依次显示主导航、个人信息名片、分类列表、标签云

#### Scenario: 关闭 Drawer

- **WHEN** Drawer 打开后用户点击遮罩或关闭按钮
- **THEN** Drawer 滑出并关闭

#### Scenario: 点击主导航项自动关闭 Drawer

- **WHEN** Drawer 打开后用户点击主导航中的"关于"链接
- **THEN** Drawer 关闭，系统导航至当前 locale 的关于页

#### Scenario: 点击分类链接自动关闭 Drawer

- **WHEN** Drawer 打开后用户点击分类列表中的 `frontend` 分类
- **THEN** Drawer 关闭，系统导航至 `/[lang]/categories/frontend`

#### Scenario: 点击标签链接自动关闭 Drawer

- **WHEN** Drawer 打开后用户点击标签云中的 `next-js` 标签
- **THEN** Drawer 关闭，系统导航至 `/[lang]/tags/next-js`

#### Scenario: 点击 GitHub 外链自动关闭 Drawer

- **WHEN** Drawer 打开后用户点击主导航中的"GitHub"外链
- **THEN** Drawer 关闭，浏览器在新标签页打开 GitHub 主页

### Requirement: 导航复用组件

系统 SHALL 提供共享导航组件 `NavLinks`（Server Component），渲染首页、关于、GitHub 外链三个导航项。桌面端 Header 与移动端 Drawer MUST 复用此组件，通过 `variant` prop（`'header'` | `'drawer'`）控制样式差异（Header 为水平排列，Drawer 为垂直排列）。内部链接 MUST 使用 `next-intl/navigation` 的 locale-aware `Link`，GitHub 外链 MUST 使用 `target="_blank"` + `rel="noopener noreferrer"`。GitHub 外链 URL MUST 从 `siteConfig.githubUrl` 读取（`githubUsername` 通过 `content/site.yaml` 的 `githubUsername` 字段配置）。

#### Scenario: Header 渲染 NavLinks

- **WHEN** 桌面端渲染 Header
- **THEN** Header 内渲染 `<NavLinks variant="header" />`，导航项水平排列，依次显示"首页"、"关于"、"GitHub"

#### Scenario: Drawer 渲染 NavLinks

- **WHEN** 移动端 Drawer 打开
- **THEN** Drawer 内容顶部渲染 `<NavLinks variant="drawer" />`，导航项垂直排列，依次显示"首页"、"关于"、"GitHub"

#### Scenario: 点击内部导航项跳转 locale-aware 路由

- **WHEN** 当前 locale 为 `en` 且用户点击 NavLinks 中的"关于"
- **THEN** 系统导航至 `/en/about`

#### Scenario: 点击 GitHub 外链打开新标签页

- **WHEN** 用户点击 NavLinks 中的"GitHub"
- **THEN** 浏览器在新标签页打开 `siteConfig.githubUrl` 对应的 URL

### Requirement: GitHub 个人信息名片

系统 SHALL 通过 GitHub API（`https://api.github.com/users/{username}`）获取 GitHub 用户信息（用户名、头像），在 Sidebar 与移动端 Drawer 中渲染个人信息名片。系统 MUST 使用 Next.js `fetch` 的 ISR 缓存能力，缓存周期为 1 小时（`next: { revalidate: 3600 }`）。GitHub 用户名 MUST 通过 `content/site.yaml` 的 `githubUsername` 字段配置。

#### Scenario: 首次渲染名片

- **WHEN** 用户首次访问任意页面且 GitHub API 可达
- **THEN** 名片显示配置用户名对应的 GitHub 头像与用户名，并提供跳转至 GitHub 主页的链接

#### Scenario: 缓存命中

- **WHEN** 在 1 小时缓存窗口内再次渲染名片
- **THEN** 系统使用缓存的 GitHub 数据，不发起新的 API 请求

#### Scenario: GitHub API 不可达

- **WHEN** GitHub API 请求失败
- **THEN** 名片优雅降级（显示配置的用户名文本与默认头像），不阻塞页面渲染

### Requirement: 深浅色主题切换

系统 SHALL 使用 `next-themes` 实现深浅色主题切换。`<html>` 元素 MUST 通过 `attribute="class"` 切换 `light`/`dark` 类。系统 MUST 支持 `defaultTheme="light"` 与 `enableSystem`（跟随系统偏好）。主题选择 MUST 持久化至 `localStorage`，且在页面加载时不产生 hydration 闪烁（`suppressHydrationWarning`）。

#### Scenario: 切换至深色主题

- **WHEN** 用户点击主题切换按钮且当前为浅色
- **THEN** `<html>` 的 class 切换为 `dark`，页面立即应用深色主题，选择持久化

#### Scenario: 跟随系统偏好

- **WHEN** 用户未手动切换过主题且系统偏好为深色
- **THEN** 页面以深色主题渲染

#### Scenario: 无 hydration 闪烁

- **WHEN** 页面在深色主题下刷新
- **THEN** 页面加载瞬间即为深色，不出现浅色闪烁

### Requirement: 根布局与 locale 布局分离

系统 SHALL 将根布局（`app/layout.tsx`）仅保留 `<html>`/`<body>`、字体加载、ThemeProvider、Analytics、SpeedInsights 与站点级静态 `metadata`。所有 locale 相关逻辑（Header、Sidebar、NextIntlClientProvider、`setRequestLocale`）MUST 位于 `app/[lang]/layout.tsx`。根布局的 `<html lang>` 属性 SHALL 设为默认 locale（`zh`），locale 级语言定位由 `app/[lang]/layout.tsx` 的 `generateMetadata` 返回的 `hreflang` alternates 承担。

#### Scenario: 根布局渲染 html 骨架

- **WHEN** 渲染根布局
- **THEN** 输出 `<html lang="zh" suppressHydrationWarning>` 包裹 `<body>`，body 内含 ThemeProvider 与 `{children}`，不包含 Header/Sidebar 等 locale chrome

#### Scenario: 根布局提供站点级 metadata

- **WHEN** 渲染根布局
- **THEN** 导出静态 `metadata` 对象，含 `title.default`、`title.template`、`description`、`metadataBase`、`openGraph`（title/description/url/siteName/type）

#### Scenario: locale 布局包裹页面 chrome

- **WHEN** 渲染 `app/[lang]/layout.tsx`
- **THEN** 输出包含 Header、Sidebar、`<main>{children}</main>` 的结构，并被 `NextIntlClientProvider` 包裹，不渲染 `<html>`/`<body>`

#### Scenario: locale 布局提供 hreflang alternates

- **WHEN** 渲染 `app/[lang]/layout.tsx` 的 `generateMetadata`
- **THEN** 返回 `alternates.languages`（`zh` 与 `en` 互指）与 `openGraph.locale`，作为搜索引擎语言定位的主信号

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
