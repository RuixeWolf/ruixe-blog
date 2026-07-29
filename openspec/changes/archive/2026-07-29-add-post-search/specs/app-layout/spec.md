# Spec Delta: App Layout

## MODIFIED Requirements

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
