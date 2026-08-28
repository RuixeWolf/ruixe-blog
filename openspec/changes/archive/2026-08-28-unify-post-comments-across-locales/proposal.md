## Why

个人博客访问量与评论互动少，而当前 Giscus 评论区按 `pathname` 映射，同一 slug 文章的各语言版本（`/zh/posts/foo` 与 `/en/posts/foo`）各自对应独立的 GitHub Discussion，评论无法跨语言，不同语言的访问者难以相互交流。将评论区按文章 slug 而非 pathname 划分，让少量评论集中到同一线程，最大化互动价值。

## What Changes

- Giscus mapping 策略从 `pathname` 改为 `specific`，`term` 固定为文章 slug（同一 slug 的所有 locale 共享一个 GitHub Discussion）。**BREAKING**：评论区归属关系改变，存量 Discussion 需一次性迁移。
- 开启 `strict: '1'`（SHA-1 哈希精确匹配），避免相似 slug（如两个 `*-first-look` 文章）在 GitHub 模糊搜索下误命中。
- `GiscusConfig.mapping` 类型与校验收紧为仅 `'specific'`（fail-fast，防止 yaml 静默回退到按语言分裂）。
- `Comments` 组件新增 `term` prop（由 `PostLayout` 传入 `meta.slug`），删除 `mapping as 'pathname'` 强转。
- 存量 GitHub Discussions 一次性手动迁移：Discussion #19（`zh/posts/my-first-blog-website`，含 1 条真实评论）改名为 slug 并在正文注入 SHA-1 哈希；孤儿 Discussion #7（`en/posts/hello-world`，slug 已不存在，0 评论）由用户手动删除。迁移必须先于代码部署。
- 评论 UI 语言（`lang`）仍跟随访问者 locale，主题同步机制不变。
- `scripts/delete-post.mjs` 的 Giscus 提示文案更新为单一共享 Discussion 语义。

## Capabilities

### New Capabilities

<!-- 无新增 capability -->

### Modified Capabilities

- `post-comments`: 评论映射策略要求整体变更 - 从 `pathname` 按 locale 独立分帖改为 `specific` + `term=slug` + `strict=1` 哈希匹配的跨 locale 共享帖；评论组件渲染要求新增 `term` prop；评论配置值要求更新（`mapping: specific`、`strict: '1'`）并补充哈希注释不可清理与 slug 不可变性约束。

## Impact

- **代码**：`content/site.yaml`（giscus 块 mapping/strict + 注释）、`lib/site-config.ts`（类型收紧 + 校验）、`components/posts/Comments.tsx`（term prop + 清理强转）、`components/posts/PostLayout.tsx`（传 term）、`scripts/delete-post.mjs`（提示文案）。
- **数据（GitHub Discussions）**：迁移保留唯一含评论的 Discussion #19（改名 + 注入 `<!-- sha1: bed6968ea5cdf32f420fc2c15cfc620b6f9d7a86 -->`）；删除孤儿 #7；其余 3 篇文章无存量帖，首次评论时由 giscus bot 自动按新机制建帖（标题 = slug，正文自动含哈希）。
- **部署顺序**：GitHub 侧迁移先行，代码部署在后（否则 strict=1 搜不到哈希、首评另建新帖，#19 的评论被遗弃）。
- **不受影响**：主题同步（postMessage）、评论 i18n 文案、RSC->Client props 边界、`@giscus/react` 依赖版本（v3 原生支持 `specific`/`term`/`strict`）。
- **非目标**：不处理 giscus backlink 的语言偏向（首评者所在 locale 的 URL 会被写入 Discussion 正文，纯 GitHub 侧溯源信息，不影响评论功能）。
