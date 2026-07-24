## MODIFIED Requirements

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
