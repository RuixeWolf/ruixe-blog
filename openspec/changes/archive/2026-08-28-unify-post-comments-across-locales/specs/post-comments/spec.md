## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: 评论映射策略

**Reason**: mapping 策略从 `pathname` 改为 `specific` + slug term，评论区归属从「各 locale 路径独立分帖」整体反转为「同 slug 跨 locale 共享单帖」，原 requirement 的行为描述与全部场景（按 pathname 独立命中、中英文评论互不可见）不再成立，无法通过 MODIFIED 增量表达。

**Migration**: 由 ADDED 的「评论按 slug 跨语言共享映射」requirement 取代。存量 GitHub Discussions 的一次性迁移（#19 改名 + 注入 SHA-1 哈希、#7 删除）与部署顺序约束见本 change 的 design.md「Migration Plan」。
