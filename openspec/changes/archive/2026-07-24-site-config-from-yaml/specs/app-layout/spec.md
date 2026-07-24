## MODIFIED Requirements

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
