# Spec Delta

## MODIFIED Requirements

### Requirement: 桌面端常驻 Sidebar

系统 SHALL 在桌面端（`lg+`）主内容区左侧渲染常驻 Sidebar，从上至下依次为：GitHub 个人信息名片、文章分类列表、文章标签云。Sidebar 内容 MUST 与移动端 Drawer 共享同一数据源与渲染组件。文章分类列表与标签云 MUST 过滤当前 locale 下文章数为 0 的条目（零篇分类/标签不出现在列表中——对应页面保留可访问，仅移除侧边栏入口）；分类计数 MUST 按 per-locale 口径判断（某分类在 zh 有文章而 en 没有时，en 的列表不含该分类）。保留显示的分类项 SHALL 在分类名称右侧显示该分类下的文章计数（当前 locale 下属于该分类的文章数量），计数 MUST 为纯文本数字，使用 `text-muted` + `tabular-nums` 样式右对齐显示，不使用 `Badge` 组件包裹（过滤后保留项计数恒 ≥ 1，不再出现 `0`）。

#### Scenario: Sidebar 渲染分类与标签

- **WHEN** 桌面端渲染 Sidebar 且 `content/taxonomy/categories.yaml` 含 `frontend`（当前 locale 下有文章）、`backend`（当前 locale 下 0 篇）分类
- **THEN** Sidebar 分类列表显示 `frontend` 对应当前 locale 的名称，不显示 `backend`

#### Scenario: Sidebar 分类项显示文章计数

- **WHEN** 桌面端渲染 Sidebar 且当前 locale 下 `frontend` 分类有 2 篇文章
- **THEN** `frontend` 分类项右侧显示纯文本 `2`，计数使用 `text-muted tabular-nums` 样式右对齐；零篇分类不渲染、无 `0` 计数项

#### Scenario: 标签云过滤零篇标签

- **WHEN** 桌面端渲染 Sidebar 且当前 locale 下标签 `next-js` 有文章、标签 `typescript` 为 0 篇
- **THEN** 标签云含 `next-js`、不含 `typescript`

#### Scenario: 点击分类跳转分类页

- **WHEN** 用户在 Sidebar 点击分类 `frontend`
- **THEN** 系统导航至 `/[lang]/categories/frontend`
