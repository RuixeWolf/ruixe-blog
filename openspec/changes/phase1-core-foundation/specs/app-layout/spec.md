## ADDED Requirements

### Requirement: 响应式布局断点

系统 SHALL 使用 Tailwind CSS 的 `lg` 断点（`>= 1024px`）作为桌面端与移动端布局切换点。桌面端布局 MUST 在 `lg` 及以上显示，移动端布局 MUST 在 `lg` 以下显示。

#### Scenario: 桌面端视口下显示常驻 Sidebar

- **WHEN** 视口宽度 `>= 1024px`
- **THEN** 页面显示桌面端 Header + 左侧常驻 Sidebar + 主内容区

#### Scenario: 移动端视口下隐藏 Sidebar 并显示 Drawer 触发器

- **WHEN** 视口宽度 `< 1024px`
- **THEN** 页面显示移动端 Header（含汉堡按钮），Sidebar 隐藏；点击汉堡按钮打开 Drawer

### Requirement: 桌面端 Header

系统 SHALL 在桌面端（`lg+`）渲染常驻 Header，左侧为网站标题 `Ruixe Blog` 与导航（首页、关于、GitHub 外链），右侧为功能栏（搜索按钮占位、语言切换、主题切换）。Header MUST 使用 `sticky` 定位，在滚动时保持可见。

#### Scenario: 桌面端 Header 布局

- **WHEN** 桌面端渲染 Header
- **THEN** 左侧依次显示 `Ruixe Blog` 标题与"首页"、"关于"、"GitHub"导航项；右侧依次显示搜索图标按钮、语言切换器、主题切换按钮

#### Scenario: 点击 GitHub 导航项跳转外链

- **WHEN** 用户点击 Header 中的 "GitHub" 导航项
- **THEN** 浏览器在新标签页打开 `https://github.com/RuixeWolf`（或配置的 GitHub 主页 URL）

#### Scenario: 搜索按钮占位

- **WHEN** 用户在阶段 1 点击搜索按钮
- **THEN** 搜索功能暂未实现（阶段 2），按钮可渲染但无交互或显示"即将上线"提示

### Requirement: 移动端 Header

系统 SHALL 在移动端（`<lg`）渲染 Header，左侧为汉堡按钮（打开 Drawer），中间为网站标题 `Ruixe Blog`，右侧为功能栏（搜索按钮占位、设置按钮）。设置按钮点击 SHALL 弹出包含语言切换与主题切换的弹窗。

#### Scenario: 移动端 Header 布局

- **WHEN** 移动端渲染 Header
- **THEN** 左侧显示汉堡按钮，中间显示 `Ruixe Blog` 标题，右侧显示搜索图标按钮与设置图标按钮

#### Scenario: 点击汉堡按钮打开 Drawer

- **WHEN** 用户在移动端点击汉堡按钮
- **THEN** Drawer 从左侧滑入，展示个人信息名片、导航、分类列表、标签云

#### Scenario: 点击设置按钮弹出功能弹窗

- **WHEN** 用户在移动端点击设置按钮
- **THEN** 弹窗显示语言切换器与主题切换按钮

### Requirement: 桌面端常驻 Sidebar

系统 SHALL 在桌面端（`lg+`）主内容区左侧渲染常驻 Sidebar，从上至下依次为：GitHub 个人信息名片、文章分类列表、文章标签云。Sidebar 内容 MUST 与移动端 Drawer 共享同一数据源与渲染组件。

#### Scenario: Sidebar 渲染分类与标签

- **WHEN** 桌面端渲染 Sidebar 且 `content/taxonomy/categories.yaml` 含 `frontend`、`backend` 分类
- **THEN** Sidebar 分类列表显示 `frontend`、`backend` 对应当前 locale 的名称

#### Scenario: 点击分类跳转分类页

- **WHEN** 用户在 Sidebar 点击分类 `frontend`
- **THEN** 系统导航至 `/[lang]/categories/frontend`

### Requirement: 移动端 Drawer

系统 SHALL 在移动端（`<lg`）通过 HeroUI `Drawer` 组件实现侧栏抽屉，内容与桌面端 Sidebar 一致（个人信息名片、导航、分类、标签）。Drawer MUST 支持点击遮罩或关闭按钮关闭。

#### Scenario: 打开 Drawer

- **WHEN** 用户点击移动端汉堡按钮
- **THEN** Drawer 从左侧滑入，遮罩覆盖主内容

#### Scenario: 关闭 Drawer

- **WHEN** Drawer 打开后用户点击遮罩或关闭按钮
- **THEN** Drawer 滑出并关闭

### Requirement: GitHub 个人信息名片

系统 SHALL 通过 GitHub API（`https://api.github.com/users/{username}`）获取 GitHub 用户信息（用户名、头像），在 Sidebar 与移动端 Drawer 中渲染个人信息名片。系统 MUST 使用 Next.js `fetch` 的 ISR 缓存能力，缓存周期为 1 小时（`next: { revalidate: 3600 }`）。GitHub 用户名 MUST 可通过环境变量或配置文件配置。

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

系统 SHALL 将根布局（`app/layout.tsx`）仅保留 `<html>`/`<body>`、字体加载、ThemeProvider、Analytics 与 SpeedInsights。所有 locale 相关逻辑（Header、Sidebar、NextIntlClientProvider、`setRequestLocale`）MUST 位于 `app/[lang]/layout.tsx`。

#### Scenario: 根布局渲染 html 骨架

- **WHEN** 渲染根布局
- **THEN** 输出 `<html suppressHydrationWarning>` 包裹 `<body>`，body 内含 ThemeProvider 与 `{children}`

#### Scenario: locale 布局包裹页面 chrome

- **WHEN** 渲染 `app/[lang]/layout.tsx`
- **THEN** 输出包含 Header、Sidebar、`<main>{children}</main>` 的结构，并被 `NextIntlClientProvider` 包裹
