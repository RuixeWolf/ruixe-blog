## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: 导航复用组件

系统 SHALL 提供共享导航组件 `NavLinks`（Server Component），渲染首页、关于、GitHub 外链三个导航项。桌面端 Header 与移动端 Drawer MUST 复用此组件，通过 `variant` prop（`'header'` | `'drawer'`）控制样式差异（Header 为水平排列，Drawer 为垂直排列）。内部链接 MUST 使用 `next-intl/navigation` 的 locale-aware `Link`，GitHub 外链 MUST 使用 `target="_blank"` + `rel="noopener noreferrer"`。GitHub 外链 URL MUST 从 `siteConfig.githubUrl` 读取（支持环境变量 `GITHUB_USERNAME` 配置）。

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
