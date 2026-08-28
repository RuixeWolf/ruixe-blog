# Post Comments Specification

## Purpose

为 Ruixe Blog 的文章详情页提供基于 Giscus（GitHub Discussions）的评论能力。评论区作为 Client Component 渲染于文章正文之后，配置值来自 `content/site.yaml` 的 `giscus` 块并通过 props 注入（遵循 RSC->Client 边界）。评论主题、UI 语言与博客的 `next-themes` 主题、`next-intl` locale 实时同步，同一 slug 的所有语言版本共享一个评论区（一个 GitHub Discussion）。

## Requirements

### Requirement: Giscus 评论组件渲染

系统 SHALL 在文章详情页正文之后渲染基于 Giscus（GitHub Discussions）的评论区。评论组件 `components/posts/Comments.tsx` MUST 标记 `'use client'`，使用 `@giscus/react` 的 `<Giscus>` 组件。评论组件 MUST 通过 props 接收 Giscus 配置（`repo`、`repoId`、`category`、`categoryId`、`mapping`、`term`、`reactionsEnabled`、`inputPosition`、`strict`、`emitMetadata`）与当前 `locale`，其中 `term` MUST 为当前文章的 slug（由 `PostLayout` 从文章元数据传入，是评论区跨 locale 共享的锚点）。评论组件 MUST NOT 直接 import `lib/site-config` 等 server-only 模块（遵循 RSC->Client 边界，与 `SearchProvider` 一致）。`<Giscus>` 组件 MUST 设置 `loading="lazy"`，使评论 iframe 在接近视口时才加载，不阻塞文章首屏渲染。评论组件 MUST 渲染在 `PostLayout` 的 `<article>` 元素之后。

#### Scenario: 评论组件接收配置 props

- **WHEN** `PostLayout`（Server Component）渲染 `<Comments>`
- **THEN** 传入 `config={siteConfig.giscus}`、`locale={locale}` 与 `term={meta.slug}` props，`Comments` 组件不直接 import `lib/site-config`

#### Scenario: term prop 为文章 slug

- **WHEN** 用户访问任意 locale 的文章详情页（如 `/zh/posts/foo` 或 `/en/posts/foo`）
- **THEN** `<Giscus>` 组件接收到相同的 `term` 值（文章 slug `foo`），与访问的 locale 无关

#### Scenario: 评论渲染在文章正文之后

- **WHEN** 用户访问文章详情页 `/zh/posts/hello-world`
- **THEN** 页面从上至下依次为：文章元信息、（移动端 TOC）、文章正文、评论区

#### Scenario: 评论懒加载

- **WHEN** 文章详情页首屏渲染
- **THEN** Giscus iframe 通过 `loading="lazy"` 延迟加载，不在首屏请求 `giscus.app` 资源

### Requirement: 评论主题与博客主题同步

系统 SHALL 使 Giscus 评论区的主题与博客的 `next-themes` 主题保持同步。评论组件 MUST 通过 `useTheme()` 读取 `resolvedTheme`（而非 `theme` 偏好），将 `light` 映射为 Giscus 内置主题 `light`，将 `dark` 映射为 Giscus 内置主题 `dark_dimmed`。主题切换时 MUST 通过 `postMessage` 向 Giscus iframe 发送 `setConfig: { theme }` 消息（目标 `https://giscus.app`），实现无重载的平滑主题切换（避免 iframe 整体重载丢失滚动位置）。主题同步监听器 MUST 在 iframe 加载完成后生效，未加载时跳过 postMessage（iframe `contentWindow` 为 null）。

#### Scenario: 浅色主题下评论使用 light 主题

- **WHEN** 博客 `resolvedTheme` 为 `light` 且评论 iframe 已加载
- **THEN** Giscus iframe 通过 postMessage 接收 `theme: 'light'`，评论区以浅色样式渲染

#### Scenario: 深色主题下评论使用 dark_dimmed 主题

- **WHEN** 博客 `resolvedTheme` 为 `dark` 且评论 iframe 已加载
- **THEN** Giscus iframe 通过 postMessage 接收 `theme: 'dark_dimmed'`，评论区以深色样式渲染

#### Scenario: 切换主题时 iframe 不重载

- **WHEN** 用户在文章详情页切换博客主题（如 light -> dark）且评论已加载
- **THEN** Giscus iframe 不整体重载（通过 postMessage 更新主题），评论区滚动位置保留

#### Scenario: iframe 未加载时主题切换无副作用

- **WHEN** 评论 iframe 尚未加载完成（懒加载未触发）时用户切换主题
- **THEN** postMessage 调用被跳过（iframe `contentWindow` 为 null），不抛错；iframe 加载后以初始 `resolvedTheme` 对应的主题渲染

### Requirement: 评论语言与博客 locale 同步

系统 SHALL 使 Giscus 评论区的 UI 语言与博客当前 locale 保持同步。评论组件 MUST 将博客 locale `zh` 映射为 Giscus lang `zh-CN`，将 `en` 映射为 `en`。lang 值 MUST 作为 `<Giscus>` 的 `lang` prop 传入，切换 locale 时（layout 重新渲染）lang 随 props 更新。

#### Scenario: 中文 locale 下评论 UI 为简体中文

- **WHEN** 当前 locale 为 `zh` 且评论区渲染
- **THEN** `<Giscus>` 的 `lang` prop 为 `zh-CN`，评论区 UI 文案为简体中文

#### Scenario: 英文 locale 下评论 UI 为英文

- **WHEN** 当前 locale 为 `en` 且评论区渲染
- **THEN** `<Giscus>` 的 `lang` prop 为 `en`，评论区 UI 文案为英文

### Requirement: 评论按 slug 跨语言共享映射

系统 SHALL 使用 `specific` 作为 Giscus 的 mapping 策略、文章 slug 作为 `term`，使同一 slug 的所有语言版本（如 `/zh/posts/foo` 与 `/en/posts/foo`）共享同一个 GitHub Discussion（同一条评论线程）。系统 MUST 启用 Giscus 的 strict 匹配（`strict: '1'`）：Giscus 计算 `term` 的 SHA-1 哈希并在 Discussion 正文中搜索该哈希（giscus bot 新建 Discussion 时自动以 `<!-- sha1: <hash> -->` 注释形式写入正文），从而避免 GitHub 模糊搜索在相似 slug（如 `vercel-agent-browser-first-look` 与 `vscode-agents-window-first-look`）间误命中。Discussion 正文中的 SHA-1 哈希注释 MUST NOT 被当作冗余内容清理，否则该文章评论区无法命中既有 Discussion。slug MUST 保持不可变；若未来需要修改文章 slug，MUST 同步将对应 Discussion 标题改为新 slug 并更新正文中的哈希注释（本站现有流程只删除文章、不改名，此为防御性约束）。

#### Scenario: 中英文版本共享同一评论区

- **WHEN** 用户在 `/zh/posts/foo` 留言，随后另一用户访问 `/en/posts/foo`
- **THEN** 英文版文章详情页的评论区显示同一条留言（两个 locale 命中同一个 Discussion）

#### Scenario: 无存量 Discussion 的文章首次评论自动建帖

- **WHEN** 用户在任意 locale 的 `/posts/bar`（`bar` 尚无对应 Discussion）留言或点赞
- **THEN** giscus bot 在 `Comments` 分类下自动创建一条 Discussion，标题为 slug `bar`，正文自动包含 `bar` 的 SHA-1 哈希注释；之后所有 locale 的 `/posts/bar` 均命中该 Discussion

#### Scenario: 相似 slug 不互相误命中

- **WHEN** 文章 `vercel-agent-browser-first-look` 与 `vscode-agents-window-first-look` 均存在对应 Discussion
- **THEN** 两篇文章各自通过正文中不同的 SHA-1 哈希命中各自的 Discussion，互不串扰（strict 匹配不依赖标题模糊搜索）

#### Scenario: 已迁移的存量 Discussion 正常命中

- **WHEN** 用户访问 `/zh/posts/my-first-blog-website` 或 `/en/posts/my-first-blog-website`
- **THEN** 评论区命中迁移后的存量 Discussion（标题已改为 slug `my-first-blog-website`、正文已注入对应 SHA-1 哈希注释），显示既有评论

#### Scenario: 切换 locale 后评论线程不变

- **WHEN** 用户在文章详情页通过语言切换器从 `zh` 切换到 `en`（或反向）
- **THEN** 页面重渲染后评论区仍加载同一个 Discussion，仅评论 UI 文案语言随 locale 变化

### Requirement: 评论功能 i18n

系统 SHALL 在 `i18n/messages/zh.json` 与 `en.json` 新增 `Comment` 命名空间，包含评论区所需文案 key。所有 key MUST 遵循 PascalCase 命名约定（如 `Comment.Title`、`Comment.Loading`）。`Comment.Title` 为评论区的可见标题（如"评论" / "Comments"），`Comment.Loading` 为懒加载时的占位提示。文案 MUST 通过 `useTranslations('Comment')` 在客户端组件中消费。

#### Scenario: 中文 locale 评论文案

- **WHEN** 当前 locale 为 `zh` 且评论区渲染
- **THEN** 评论区标题显示 `Comment.Title` 的中文翻译（如"评论"）

#### Scenario: 英文 locale 评论文案

- **WHEN** 当前 locale 为 `en` 且评论区渲染
- **THEN** 评论区标题显示 `Comment.Title` 的英文翻译（如"Comments"）

### Requirement: 评论配置值固定为已生成的 Giscus 配置

系统 SHALL 在 `content/site.yaml` 的 `giscus` 块中维护固定的 Giscus 配置值（通过 giscus.app 生成）：`repo` 为 `RuixeWolf/ruixe-blog`，`repoId` 为 `R_kgDOTes-7w`，`category` 为 `Comments`（专用分类，隔离文章评论与仓库公告），`categoryId` 为 `DIC_kwDOTes-784DCN33`，`mapping` 为 `specific`（term 由代码传入文章 slug，不在此配置），`reactionsEnabled` 为 `1`（开启 reaction），`inputPosition` 为 `top`，`strict` 为 `1`（开启 SHA-1 哈希精确匹配，slug 即 term 的哈希被写入 Discussion 正文），`emitMetadata` 为 `0`。`mapping` 值 MUST 被站点配置校验收紧为仅允许 `specific`：任何其他值（如回退到 `pathname`）MUST 在配置加载时 fail-fast 报错，防止评论区静默回到按语言分裂。这些值随代码提交至 Git，无需环境变量。

#### Scenario: 配置值与 giscus.app 生成结果一致

- **WHEN** 系统加载 `content/site.yaml` 的 `giscus` 块
- **THEN** `repo` 为 `RuixeWolf/ruixe-blog`、`repoId` 为 `R_kgDOTes-7w`、`category` 为 `Comments`、`categoryId` 为 `DIC_kwDOTes-784DCN33`

#### Scenario: mapping 回退到 pathname 时构建报错

- **WHEN** `content/site.yaml` 的 `giscus.mapping` 被改为 `specific` 以外的任何值
- **THEN** 站点配置校验在模块加载时抛出错误（fail-fast），构建失败并提示允许值

#### Scenario: 使用专用 Comments 分类

- **WHEN** Giscus 为文章创建 Discussion
- **THEN** Discussion 创建在 `Comments` 分类下，不与仓库 `Announcements` 分类混用
