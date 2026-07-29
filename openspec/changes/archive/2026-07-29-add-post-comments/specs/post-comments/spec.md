# Post Comments Specification (Delta)

## ADDED Requirements

### Requirement: Giscus 评论组件渲染

系统 SHALL 在文章详情页正文之后渲染基于 Giscus（GitHub Discussions）的评论区。评论组件 `components/posts/Comments.tsx` MUST 标记 `'use client'`，使用 `@giscus/react` 的 `<Giscus>` 组件。评论组件 MUST 通过 props 接收 Giscus 配置（`repo`、`repoId`、`category`、`categoryId`、`mapping`、`reactionsEnabled`、`inputPosition`、`strict`、`emitMetadata`）与当前 `locale`，MUST NOT 直接 import `lib/site-config` 等 server-only 模块（遵循 RSC->Client 边界，与 `SearchProvider` 一致）。`<Giscus>` 组件 MUST 设置 `loading="lazy"`，使评论 iframe 在接近视口时才加载，不阻塞文章首屏渲染。评论组件 MUST 渲染在 `PostLayout` 的 `<article>` 元素之后。

#### Scenario: 评论组件接收配置 props

- **WHEN** `PostLayout`（Server Component）渲染 `<Comments>`
- **THEN** 传入 `config={siteConfig.giscus}` 与 `locale={locale}` props，`Comments` 组件不直接 import `lib/site-config`

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

### Requirement: 评论映射策略

系统 SHALL 使用 `pathname` 作为 Giscus 的 mapping 策略，使不同语言版本的文章（如 `/zh/posts/hello-world` 与 `/en/posts/hello-world`）各自拥有独立的评论区（对应独立的 GitHub Discussion）。`mapping` 值 MUST 来自 `siteConfig.giscus.mapping`（由 `content/site.yaml` 配置）。

#### Scenario: 中文版与英文版文章评论独立

- **WHEN** 用户在 `/zh/posts/hello-world` 留言，随后访问 `/en/posts/hello-world`
- **THEN** 英文版文章详情页的评论区不显示中文版的留言（两个路径对应不同 Discussion）

### Requirement: 评论功能 i18n

系统 SHALL 在 `i18n/messages/zh.json` 与 `en.json` 新增 `Comment` 命名空间，包含评论区所需文案 key。所有 key MUST 遵循 PascalCase 命名约定（如 `Comment.Title`、`Comment.Loading`）。`Comment.Title` 为评论区的可见标题（如"评论" / "Comments"），`Comment.Loading` 为懒加载时的占位提示。文案 MUST 通过 `useTranslations('Comment')` 在客户端组件中消费。

#### Scenario: 中文 locale 评论文案

- **WHEN** 当前 locale 为 `zh` 且评论区渲染
- **THEN** 评论区标题显示 `Comment.Title` 的中文翻译（如"评论"）

#### Scenario: 英文 locale 评论文案

- **WHEN** 当前 locale 为 `en` 且评论区渲染
- **THEN** 评论区标题显示 `Comment.Title` 的英文翻译（如"Comments"）

### Requirement: 评论配置值固定为已生成的 Giscus 配置

系统 SHALL 在 `content/site.yaml` 的 `giscus` 块中维护固定的 Giscus 配置值（通过 giscus.app 生成）：`repo` 为 `RuixeWolf/ruixe-blog`，`repoId` 为 `R_kgDOTes-7w`，`category` 为 `Comments`（专用分类，隔离文章评论与仓库公告），`categoryId` 为 `DIC_kwDOTes-784DCN33`，`mapping` 为 `pathname`，`reactionsEnabled` 为 `1`（开启 reaction），`inputPosition` 为 `top`，`strict` 为 `0`（关闭严格匹配），`emitMetadata` 为 `0`。这些值随代码提交至 Git，无需环境变量。

#### Scenario: 配置值与 giscus.app 生成结果一致

- **WHEN** 系统加载 `content/site.yaml` 的 `giscus` 块
- **THEN** `repo` 为 `RuixeWolf/ruixe-blog`、`repoId` 为 `R_kgDOTes-7w`、`category` 为 `Comments`、`categoryId` 为 `DIC_kwDOTes-784DCN33`

#### Scenario: 使用专用 Comments 分类

- **WHEN** Giscus 为文章创建 Discussion
- **THEN** Discussion 创建在 `Comments` 分类下，不与仓库 `Announcements` 分类混用
