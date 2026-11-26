# Spec Delta

## ADDED Requirements

### Requirement: 首页个人名片

系统 SHALL 在首页以开放式版面展示个人介绍，主标题为站点配置中的作者显示名，并以当前语言展示作者身份与简介。首页 SHALL 使用狼设定插画作装饰背景，小头像与作者显示名同行。个人介绍、导航与联系入口之后 SHALL 展示可用的本语言精选文章。桌面首页不设常驻 Sidebar，移动端通过 Drawer 访问分类与标签。

#### Scenario: 桌面端访问首页

- **WHEN** 用户在宽度 `>= 1024px` 的视口访问 `/zh` 或 `/en`
- **THEN** 横幅左侧展示头像、名字、简介和入口，右侧可见角色。横幅下方是紧凑的精选文章列表

#### Scenario: 在首页切换主题

- **WHEN** 用户在任一语言首页切换浅色和深色主题
- **THEN** 横幅遮罩随主题更新，介绍、入口和精选列表保持可读

#### Scenario: 窄屏阅读和键盘访问

- **WHEN** 用户在宽度为 320 CSS 像素的视口访问任一语言首页，并用键盘浏览链接
- **THEN** 短横幅下依次展示并排的头像与姓名、简介、导航、邮箱和精选文章。链接可阅读及操作，页面无需横向滚动，获得键盘焦点的链接有可见焦点指示

### Requirement: 名片导航和合作联系

系统 SHALL 以同语言的文章列表为名片主操作，并提供同语言的关于页、作者的 GitHub 个人主页及合作邮箱入口。可见邮箱地址和 `mailto:` 链接 SHALL 使用同一个站点配置值。

#### Scenario: 名片引导至同语言页面

- **WHEN** 用户在 `/zh` 点击「浏览文章」或「关于我」
- **THEN** 分别导航至 `/zh/posts` 或 `/zh/about`
- **AND** `/en` 上对应操作分别导航至 `/en/posts` 或 `/en/about`

#### Scenario: 访问 GitHub 个人主页或发起合作联系

- **WHEN** 用户查看任一语言的名片
- **THEN** GitHub 链接指向站点配置中的作者个人主页，邮箱完整显示且链接指向同一地址的 `mailto:` URL

### Requirement: 首页 GitHub 头像

系统 SHALL 使用与站点 GitHub 账号对应的个人头像。头像缺失、接口请求失败或图片加载失败时，名片 SHALL 显示作者显示名的首字母，并继续提供简介和可操作的导航及邮箱链接。

#### Scenario: GitHub 头像可用

- **WHEN** 配置的 GitHub 用户资料返回头像且图片加载成功
- **THEN** 中英文首页名片显示该头像

#### Scenario: GitHub 头像不可用

- **WHEN** 用户资料请求失败、头像地址缺失或图片无法加载
- **THEN** 首页在头像位置显示作者显示名的首字母，名片的其余内容和入口均可使用

## MODIFIED Requirements

### Requirement: 响应式布局断点

系统 SHALL 使用 Tailwind CSS 的 `lg` 断点（`>= 1024px`）作为桌面端与移动端布局切换点。桌面端布局 MUST 在 `lg` 及以上显示，移动端布局 MUST 在 `lg` 以下显示。

#### Scenario: 桌面端视口下显示常驻 Sidebar

- **WHEN** 视口宽度 `>= 1024px` 且访问文章列表、文章详情、分类、标签或关于页
- **THEN** 页面显示桌面端 Header、左侧常驻 Sidebar 与主内容区

#### Scenario: 移动端视口下隐藏 Sidebar 并显示 Drawer 触发器

- **WHEN** 视口宽度 `< 1024px`
- **THEN** 页面显示移动端 Header（含汉堡按钮），Sidebar 隐藏；点击汉堡按钮打开 Drawer

### Requirement: 桌面端 Header

系统 SHALL 在桌面端（`lg+`）渲染常驻 Header，左侧为网站标题 `Ruixe Blog` 与导航（首页、文章、关于、GitHub 外链），右侧为功能栏（搜索按钮、语言切换、主题切换）。Header MUST 使用 `sticky` 定位，在滚动时保持可见。搜索按钮 SHALL 渲染为 `SearchTrigger` 组件（替换原占位搜索按钮），点击时打开搜索弹窗（由 `post-search` 能力定义）。桌面端 `SearchTrigger` SHALL 在按钮旁渲染 `⌘K`/`Ctrl+K` `Kbd` 提示（仅客户端挂载后渲染，避免 hydration 不匹配）。

#### Scenario: 桌面端 Header 布局

- **WHEN** 桌面端渲染 Header
- **THEN** 左侧依次显示 `Ruixe Blog` 标题与「首页」「文章」「关于」「GitHub」导航项；右侧依次显示搜索按钮（`SearchTrigger`）、语言切换器、主题切换按钮

#### Scenario: 点击 GitHub 导航项跳转外链

- **WHEN** 用户点击 Header 中的 "GitHub" 导航项
- **THEN** 浏览器在新标签页打开 `https://github.com/RuixeWolf`（或配置的 GitHub 主页 URL）

#### Scenario: 点击搜索按钮打开搜索弹窗

- **WHEN** 用户在桌面端点击 Header 中的搜索按钮（`SearchTrigger`）
- **THEN** 搜索弹窗打开（由 `post-search` 能力定义），搜索输入框获得焦点

#### Scenario: 桌面端搜索按钮显示 Kbd 提示

- **WHEN** 桌面端渲染 Header 且 `SearchTrigger` 已在客户端挂载
- **THEN** 搜索按钮旁显示 `⌘K`（macOS）或 `Ctrl+K`（其他平台）Kbd 提示

### Requirement: 桌面端常驻 Sidebar

系统 SHALL 在桌面端（`lg+`）的文章列表、文章详情、分类、标签和关于页主内容区左侧渲染常驻 Sidebar，从上至下依次为：GitHub 个人信息名片、文章分类列表、文章标签云。Sidebar 内容 MUST 与移动端 Drawer 共享同一数据源与渲染组件。文章分类列表与标签云 MUST 过滤当前 locale 下文章数为 0 的条目（零篇分类/标签不出现在列表中——对应页面保留可访问，仅移除侧边栏入口）；分类计数 MUST 按 per-locale 口径判断（某分类在 zh 有文章而 en 没有时，en 的列表不含该分类）。保留显示的分类项 SHALL 在分类名称右侧显示该分类下的文章计数（当前 locale 下属于该分类的文章数量），计数 MUST 为纯文本数字，使用 `text-muted` + `tabular-nums` 样式右对齐显示，不使用 `Badge` 组件包裹（过滤后保留项计数恒 ≥ 1，不再出现 `0`）。

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

### Requirement: 移动端 Drawer

系统 SHALL 在移动端（`<lg`）通过 HeroUI `Drawer` 组件实现侧栏抽屉，内容从上至下依次为：主导航（首页、文章、关于、GitHub 外链）、GitHub 个人信息名片、文章分类列表、文章标签云。其中个人信息名片、分类列表、标签云 MUST 与桌面端 Sidebar 共享同一数据源与渲染组件（`SidebarContent`）；主导航 MUST 与桌面端 Header 共享同一 `NavLinks` 组件。Drawer MUST 支持点击遮罩或关闭按钮关闭。Drawer 内任意导航链接（主导航项、分类项、标签项）点击后 MUST 自动关闭 Drawer。

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

#### Scenario: 从首页抽屉进入文章列表

- **WHEN** 用户在英文首页打开 Drawer 并点击「Articles」
- **THEN** Drawer 关闭，页面导航至 `/en/posts`

### Requirement: 导航复用组件

系统 SHALL 提供共享导航组件 `NavLinks`（Server Component），渲染首页、文章、关于、GitHub 外链四个导航项。桌面端 Header 与移动端 Drawer MUST 复用此组件，通过 `variant` prop（`'header'` | `'drawer'`）控制样式差异（Header 为水平排列，Drawer 为垂直排列）。内部链接 MUST 使用 `next-intl/navigation` 的 locale-aware `Link`，GitHub 外链 MUST 使用 `target="_blank"` + `rel="noopener noreferrer"`。GitHub 外链 URL MUST 从 `siteConfig.githubUrl` 读取（`githubUsername` 通过 `content/site.yaml` 的 `githubUsername` 字段配置）。

#### Scenario: Header 渲染 NavLinks

- **WHEN** 桌面端渲染 Header
- **THEN** Header 内渲染 `<NavLinks variant="header" />`，导航项水平排列，依次显示「首页」「文章」「关于」「GitHub」

#### Scenario: Drawer 渲染 NavLinks

- **WHEN** 移动端 Drawer 打开
- **THEN** Drawer 内容顶部渲染 `<NavLinks variant="drawer" />`，导航项垂直排列，依次显示「首页」「文章」「关于」「GitHub」

#### Scenario: 点击内部导航项跳转 locale-aware 路由

- **WHEN** 当前 locale 为 `en` 且用户点击 NavLinks 中的"关于"
- **THEN** 系统导航至 `/en/about`

#### Scenario: 点击 GitHub 外链打开新标签页

- **WHEN** 用户点击 NavLinks 中的"GitHub"
- **THEN** 浏览器在新标签页打开 `siteConfig.githubUrl` 对应的 URL

### Requirement: 根布局与 locale 布局分离

系统 SHALL 由 `app/[lang]/layout.tsx` 同时承担应用根布局与 locale 布局，提供页面共用的 Header、移动抽屉、语言与主题环境、搜索、字体、站点级元数据、Analytics 与 SpeedInsights。首页与其他页面 SHALL 各自选择相应的主内容布局。

#### Scenario: 根布局渲染 html 骨架

- **WHEN** 渲染任一受支持语言的页面
- **THEN** 页面具有与当前语言一致的 `<html lang>`，并保有主题、字体与站点级集成

#### Scenario: 根布局提供站点级 metadata

- **WHEN** 加载任一受支持语言的页面
- **THEN** 页面继承站点标题模板、默认描述、解析绝对 URL 的基础地址和站点分享元数据

#### Scenario: locale 布局包裹页面 chrome

- **WHEN** 用户在首页、文章列表页和关于页之间导航
- **THEN** 各页均提供当前语言的 Header、移动抽屉、搜索与语言及主题切换入口

#### Scenario: locale 布局提供 hreflang alternates

- **WHEN** 加载中英文首页或文章列表页
- **THEN** `hreflang` 指向同一路径的语言对应页，`og:locale` 对应当前语言

### Requirement: 移动端内容水平留白

系统 SHALL 在页面的内容容器上设置响应式水平 padding：移动端（`<lg`）为 `px-4`（16px），桌面端（`lg+`）为 `lg:px-6`（24px）。移动端内容（文章卡片、文本等）MUST NOT 紧贴屏幕左右边缘。

#### Scenario: 移动端内容两侧有 16px 留白

- **WHEN** 视口宽度 `< 1024px` 且页面渲染文章列表或文章详情
- **THEN** 主内容区左右两侧各有 16px 留白，内容不紧贴屏幕边缘

#### Scenario: 桌面端内容两侧留白保持 24px

- **WHEN** 视口宽度 `>= 1024px`
- **THEN** 内容容器左右两侧保持 24px（`lg:px-6`）留白，与现有桌面端布局一致

### Requirement: 桌面端侧栏与主内容顶部对齐

系统 SHALL 确保桌面端（`lg+`）Sidebar 内容顶部与 `<main>` 内容顶部在视觉上对齐。`Sidebar.tsx` 的 sticky 包装层 MUST 添加 `lg:pt-4`（16px），使 `SidebarContent`（`p-4` = 16px）顶部总计 32px，等于 `<main>` 的 `lg:py-8`（32px）。移动端 Drawer 内的 `SidebarContent` MUST NOT 受此改动影响（`Sidebar` 在移动端 `hidden`，`lg:pt-4` 不生效）。

#### Scenario: 桌面端侧栏顶部与主内容顶部对齐

- **WHEN** 桌面端渲染文章列表页（`/[lang]/posts`）且 Sidebar 与 main 同时可见
- **THEN** Sidebar 内 `ProfileCard` 的顶部边缘与 `<main>` 内第一个 `PostCard` 的顶部边缘在同一水平线上（均距 Header 底部 32px）

#### Scenario: 移动端 Drawer 内侧栏顶部不受对齐改动影响

- **WHEN** 移动端打开 Drawer 并渲染 `SidebarContent`
- **THEN** `SidebarContent` 顶部 padding 仍为 `p-4`（16px），不额外增加 `lg:pt-4` 的 16px
