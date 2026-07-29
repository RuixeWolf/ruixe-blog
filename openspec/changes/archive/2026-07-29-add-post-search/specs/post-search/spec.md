# Spec Delta: Post Search

## ADDED Requirements

### Requirement: 搜索索引构建

系统 SHALL 在服务端通过 `lib/search.ts`（`import 'server-only'`）为指定 locale 构建搜索索引。索引数据源为 `getAllPosts(lang)` 返回的当前 locale 全部文章。每篇文章经预处理后生成一个 `SearchIndexItem`，包含以下字段：`slug`、`title`、`description`、`contentText`（正文经 `stripMarkdown` 预理后的纯文本）、`categoryName`（分类 ID 经 `getCategory` 预本地化为当前 locale 名称）、`tagNames`（标签 ID 数组经 `getTag` 预本地化为当前 locale 名称数组）、`publishedTime`。索引 MUST NOT 包含原始 markdown 正文、`modifiedTime`、`lang` 等非搜索字段。`stripMarkdown` SHALL 通过零依赖正则链剥离代码块、行内代码、图片、链接（保留链接文本）、HTML 标签、标题/列表/引用标记符、强调标记、转义反斜杠，并折叠多余空白。索引构建 MUST 复用 `getAllPosts` 的生产级模块缓存（`process.env.NODE_ENV === 'production'` 时缓存）。

#### Scenario: 构建当前 locale 的搜索索引

- **WHEN** 系统为 locale `zh` 调用 `buildSearchIndex('zh')`
- **THEN** 返回 `SearchIndexItem[]`，每一项对应一篇 `hello-world.zh.mdx` 文章，含 `slug`、`title`、`description`、`contentText`（纯文本）、`categoryName`（中文分类名）、`tagNames`（中文标签名数组）、`publishedTime`

#### Scenario: 分类与标签在服务端预本地化

- **WHEN** 当前 locale 为 `en` 且文章 `category` 为 `frontend`、`tags` 为 `['next-js']`
- **THEN** 索引项的 `categoryName` 为 `frontend` 分类的英文名（来自 `categories.yaml`），`tagNames` 为 `['Next.js']`（来自 `tags.yaml` 的英文名）

#### Scenario: stripMarkdown 剥离 markdown 语法

- **WHEN** 文章正文含代码块 ` ```js\ncode\n``` `、链接 `[text](url)`、图片 `![alt](url)`、标题 `# Heading`、强调 `**bold**`
- **THEN** `contentText` 不含 ` ``` `、`[](url)`、`![]()`、`#`、`**` 等 markdown 语法字符，仅保留纯文本内容，链接的锚文本 `text` 被保留

#### Scenario: 客户端组件不导入 server-only 模块

- **WHEN** 客户端搜索组件（`SearchProvider`、`SearchDialog`、`SearchResultItem`、`SearchTrigger`）渲染
- **THEN** 这些组件 MUST NOT import `lib/search`、`lib/posts`、`lib/taxonomy`，所有搜索数据通过 RSC props（`SearchIndexItem[]`）传入

### Requirement: 搜索弹窗触发

系统 SHALL 提供两种触发搜索弹窗的方式：（1）全局键盘快捷键 `⌘K`（macOS）或 `Ctrl+K`（Windows/Linux），在任意页面按下时打开搜索弹窗；（2）Header 中的搜索按钮（桌面端与移动端），点击时打开搜索弹窗。`⌘K`/`Ctrl+K` 监听器 MUST 注册在 `SearchProvider` 内部，调用 `setIsOpen(true)`（幂等操作）。监听器 MUST 调用 `e.preventDefault()` 阻止浏览器默认行为。搜索弹窗在同一时间 MUST 只有一个实例。

#### Scenario: 按下 ⌘K 打开搜索弹窗

- **WHEN** 用户在 macOS 上按下 `⌘K`（或在 Windows/Linux 上按下 `Ctrl+K`）且搜索弹窗未打开
- **THEN** 搜索弹窗打开，搜索输入框获得焦点

#### Scenario: 弹窗已打开时重复按 ⌘K 无副作用

- **WHEN** 搜索弹窗已打开，用户再次按下 `⌘K`
- **THEN** 弹窗保持打开状态，无重复触发或状态异常（`setIsOpen(true)` 幂等）

#### Scenario: 点击桌面端 Header 搜索按钮打开弹窗

- **WHEN** 桌面端用户点击 Header 右侧的搜索按钮
- **THEN** 搜索弹窗打开，输入框获得焦点

#### Scenario: 点击移动端 Header 搜索按钮打开弹窗

- **WHEN** 移动端用户点击 Header 右侧的搜索按钮
- **THEN** 搜索弹窗以全屏覆盖模式打开，输入框获得焦点

### Requirement: 客户端模糊搜索

系统 SHALL 使用 Fuse.js 对当前 locale 的 `SearchIndexItem[]` 执行客户端模糊搜索。Fuse 实例 MUST 通过 `useMemo` 缓存，依赖项为 `searchIndex`，避免每次渲染重建。Fuse 配置 SHALL 使用加权 `keys`：`title`（权重 0.4）、`description`（0.25）、`tagNames`（0.2）、`categoryName`（0.1）、`contentText`（0.05）；`threshold` 设为 `0.4`；`ignoreLocation` 设为 `true`；`minMatchCharLength` 设为 `2`；`includeScore` 设为 `true`。查询输入 MUST 经防抖处理（200ms），避免每次按键立即搜索。搜索结果 MUST 限制为最多 10 条。

#### Scenario: 标题匹配优先于正文匹配

- **WHEN** 搜索索引中一篇文章标题含查询词，另一篇文章仅正文含查询词
- **THEN** 标题匹配的文章在结果中排序靠前（`title` 权重 0.4 高于 `contentText` 的 0.05）

#### Scenario: 全文位置无关匹配

- **WHEN** 查询词出现在文章正文末尾（远离正文起点）
- **THEN** 该文章仍可被匹配到（`ignoreLocation: true` 移除位置惩罚），不因位置偏远而漏召回

#### Scenario: 短查询过滤单字符噪声

- **WHEN** 用户输入单字符查询（如 `a`）
- **THEN** 该查询不产生匹配结果（`minMatchCharLength: 2` 过滤单字符连续匹配）

#### Scenario: 查询防抖

- **WHEN** 用户快速连续输入多个字符（如 200ms 内输入 `react`）
- **THEN** 搜索仅在最后一次输入后 200ms 执行，中间输入不触发独立搜索

#### Scenario: 结果数量上限

- **WHEN** 查询匹配超过 10 篇文章
- **THEN** 结果列表仅显示前 10 条，超出部分不展示（无分页）

### Requirement: 搜索范围限定当前 locale

系统 SHALL 仅搜索当前 locale 的文章索引。`SearchProvider` 接收的 `searchIndex` MUST 已按当前 locale 过滤（由 `buildSearchIndex(lang)` 在服务端构建）。切换 locale 时，layout 重新渲染并传入新 locale 的索引，Fuse 实例因 `searchIndex` 依赖变化而重建。搜索结果 MUST NOT 包含其他 locale 的文章。

#### Scenario: 中文 locale 仅搜索中文文章

- **WHEN** 当前 locale 为 `zh`，用户搜索某关键词
- **THEN** 搜索结果仅含 `*.zh.mdx` 文章，不含 `*.en.mdx` 文章

#### Scenario: 切换 locale 重建搜索索引

- **WHEN** 用户从 `zh` 切换至 `en` locale
- **THEN** `SearchProvider` 接收 `en` locale 的搜索索引，Fuse 实例重建，后续搜索基于英文文章索引

### Requirement: 搜索弹窗 UI

系统 SHALL 使用 HeroUI v3 `Modal` 组件渲染搜索弹窗，内含 `SearchField` 输入框与结果列表。Modal MUST 受控（`isOpen`/`onOpenChange`），支持点击遮罩关闭。Modal.Container 桌面端 MUST 靠上显示（`placement="top"`）且宽度受限（最大宽度 `2xl`），移动端 MUST 全屏覆盖。Modal.Body MUST 支持内部滚动（结果列表超长时）。Modal 默认的 focus trap 与 scroll lock MUST 保留。SearchField MUST 提供 `autoFocus`（或手动聚焦）使输入框在弹窗打开时获得焦点，并提供清除按钮清空查询。

#### Scenario: 桌面端弹窗布局

- **WHEN** 桌面端打开搜索弹窗
- **THEN** 弹窗靠上显示，宽度不超过 `2xl`（约 672px），背景遮罩覆盖主内容，弹窗内从上至下为 SearchField 输入框与结果列表

#### Scenario: 移动端弹窗全屏覆盖

- **WHEN** 移动端打开搜索弹窗
- **THEN** 弹窗全屏覆盖，顶部为 SearchField 输入框，下方为结果列表

#### Scenario: 弹窗打开时输入框自动聚焦

- **WHEN** 搜索弹窗打开（经 ⌘K 或按钮触发）
- **THEN** SearchField.Input 获得焦点，用户可直接输入查询

#### Scenario: 清除按钮清空查询

- **WHEN** 查询框有内容且用户点击 SearchField 的清除按钮
- **THEN** 查询清空，结果列表清空，输入框保持焦点

#### Scenario: 点击遮罩关闭弹窗

- **WHEN** 弹窗打开且用户点击背景遮罩
- **THEN** 弹窗关闭

### Requirement: 搜索结果展示

系统 SHALL 将搜索结果渲染为列表，每项为一个 `SearchResultItem`。每项 MUST 显示：标题（主）、描述（次，截断）、底部 meta 行（分类名 + 标签名 + 发布日期）。视觉风格 MUST 与 `PostCard` 一致但更紧凑。数据全部来自 `SearchIndexItem`（预本地化），客户端 MUST NOT 调用 taxonomy 模块。结果列表 MUST 实现 ARIA listbox 语义（`<ul role="listbox">` + `<li role="option">`）。空查询时 MUST NOT 显示结果列表；有查询但无匹配时 MUST 显示空状态文案。

#### Scenario: 渲染搜索结果项

- **WHEN** 搜索返回 3 条匹配结果
- **THEN** 结果列表渲染 3 个 `SearchResultItem`，每项显示标题、描述（截断）、分类名、标签名、发布日期

#### Scenario: 空查询不显示结果

- **WHEN** 搜索弹窗打开但查询为空
- **THEN** 不显示结果列表，仅显示 SearchField 输入框

#### Scenario: 无匹配结果显示空状态

- **WHEN** 查询有内容但无匹配文章
- **THEN** 结果区域显示空状态文案（如"未找到相关文章"），不显示结果列表

#### Scenario: 结果列表 ARIA 语义

- **WHEN** 渲染搜索结果列表
- **THEN** 列表容器为 `<ul role="listbox">`，每项为 `<li role="option"`，当前键盘激活项有 `aria-selected="true"`

### Requirement: 搜索结果键盘导航

系统 SHALL 支持键盘导航搜索结果：`↓`/`↑` 移动激活项（循环：末尾按 `↓` 回到首项，首项按 `↑` 到末项）、`Enter` 跳转至激活项对应的文章详情页、`ESC` 有查询内容时先清空查询、无查询内容时关闭弹窗。SearchField.Input MUST 实现 ARIA combobox 语义（`role="combobox"`、`aria-expanded`、`aria-controls` 指向 listbox、`aria-activedescendant` 指向当前激活项）。Modal 默认的 ESC 关闭行为 MUST 被禁用（`isKeyboardDismissDisabled`），由搜索弹窗自定义 ESC 行为接管。

#### Scenario: 向下导航结果

- **WHEN** 搜索弹窗有结果且用户按 `↓` 键
- **THEN** 激活项从当前项移至下一项；若当前为末项，激活项移至首项（循环）

#### Scenario: 向上导航结果

- **WHEN** 搜索弹窗有结果且用户按 `↑` 键
- **THEN** 激活项从当前项移至上一项；若当前为首项，激活项移至末项（循环）

#### Scenario: Enter 跳转至激活结果

- **WHEN** 激活项为某搜索结果且用户按 `Enter`
- **THEN** 系统导航至该文章的详情页（`/[lang]/posts/<slug>`），搜索弹窗关闭

#### Scenario: ESC 先清空查询

- **WHEN** 查询框有内容且用户按 `ESC`
- **THEN** 查询清空，结果列表清空，弹窗保持打开，输入框保持焦点

#### Scenario: ESC 无内容时关闭弹窗

- **WHEN** 查询框为空且用户按 `ESC`
- **THEN** 搜索弹窗关闭

#### Scenario: combobox ARIA 语义

- **WHEN** 搜索弹窗打开且有结果
- **THEN** SearchField.Input 具有 `role="combobox"`、`aria-expanded="true"`、`aria-controls` 指向结果 listbox 的 id、`aria-activedescendant` 指向当前激活项的 id

### Requirement: 点击结果跳转

系统 SHALL 支持鼠标点击搜索结果项跳转至对应文章详情页。点击 MUST 使用 `next-intl/navigation` 的 locale-aware `Link` 或 `useRouter().push` 导航至 `posts/<slug>`。跳转前 MUST 关闭搜索弹窗（`setIsOpen(false)`）。

#### Scenario: 点击结果项跳转

- **WHEN** 用户点击某搜索结果项
- **THEN** 搜索弹窗关闭，系统导航至该文章的详情页（当前 locale 路径）

#### Scenario: 跳转使用 locale-aware 路由

- **WHEN** 当前 locale 为 `en` 且用户点击 slug 为 `hello-world` 的结果项
- **THEN** 系统导航至 `/en/posts/hello-world`

### Requirement: 搜索弹窗触发按钮

系统 SHALL 在桌面端 Header 与移动端 Header 渲染 `SearchTrigger` 组件替换原占位搜索按钮。`SearchTrigger` MUST 通过 `useSearch()` Context 消费 `setIsOpen`，点击调用 `setIsOpen(true)`。桌面端 `SearchTrigger` MUST 在按钮旁渲染 `⌘K`/`Ctrl+K` `Kbd` 提示，但仅 `useMounted()` 为 true 时渲染（避免 hydration 不匹配）。移动端 `SearchTrigger` MUST NOT 渲染 Kbd 提示。`Kbd` MUST 复用项目 `useSyncExternalStore` 的 mount 检测模式（React Compiler 友好）。平台检测：macOS 显示 `⌘K`，其他平台显示 `Ctrl+K`。

#### Scenario: 桌面端渲染搜索按钮与 Kbd 提示

- **WHEN** 桌面端渲染 Header 且组件已挂载（`useMounted` 为 true）
- **THEN** Header 右侧显示搜索图标按钮，按钮旁显示 `⌘K`（macOS）或 `Ctrl+K`（其他平台）Kbd 提示

#### Scenario: 服务端渲染不包含 Kbd

- **WHEN** 服务端渲染 Header（`useMounted` 为 false）
- **THEN** Header HTML 不含 Kbd 元素，避免 hydration 不匹配

#### Scenario: 移动端不渲染 Kbd

- **WHEN** 移动端渲染 Header
- **THEN** 搜索按钮旁不显示 Kbd 提示

#### Scenario: 点击 SearchTrigger 打开弹窗

- **WHEN** 用户点击 `SearchTrigger` 按钮
- **THEN** `useSearch().setIsOpen(true)` 被调用，搜索弹窗打开

### Requirement: 搜索功能 i18n

系统 SHALL 在 `i18n/messages/zh.json` 与 `en.json` 新增 `Search` 命名空间，包含搜索弹窗所需的所有文案 key（弹窗标题、占位符、空状态、键盘提示、结果计数等）。所有 key MUST 遵循 PascalCase 命名约定（如 `Search.DialogTitle`、`Search.Placeholder`、`Search.EmptyState`）。`Header.SearchComingSoon` message key MUST 被删除（占位功能已由实际搜索替代）。`Header.Search` 与 `Header.SearchPlaceholder` key MUST 保留（仍用于按钮 aria-label 与占位文本）。

#### Scenario: 中文 locale 搜索文案

- **WHEN** 当前 locale 为 `zh` 且搜索弹窗打开
- **THEN** 弹窗标题、占位符、空状态等文案来自 `Search` 命名空间的中文翻译

#### Scenario: 英文 locale 搜索文案

- **WHEN** 当前 locale 为 `en` 且搜索弹窗打开
- **THEN** 弹窗标题、占位符、空状态等文案来自 `Search` 命名空间的英文翻译

#### Scenario: 删除 SearchComingSoon key

- **WHEN** 渲染搜索功能
- **THEN** 代码不引用 `Header.SearchComingSoon` message key（该 key 已从 messages 文件删除）
