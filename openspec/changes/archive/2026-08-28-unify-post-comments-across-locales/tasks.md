## 1. GitHub Discussions 存量迁移（用户手动，先于一切代码改动）

- [x] 1.1 迁移 Discussion #19：在 GitHub UI 将标题 `zh/posts/my-first-blog-website` 改为 `my-first-blog-website`，并在正文末尾追加 `<!-- sha1: bed6968ea5cdf32f420fc2c15cfc620b6f9d7a86 -->`；验证：编辑保存后标题为新 slug、正文源码含该 HTML 注释、既有评论仍在
- [x] 1.2 删除孤儿 Discussion #7（`en/posts/hello-world`，0 评论测试遗留）：验证：`https://github.com/RuixeWolf/ruixe-blog/discussions/categories/comments` 列表中只剩 #19 一条（标题 `my-first-blog-website`）

## 2. 配置与类型收紧

- [x] 2.1 修改 `content/site.yaml` 的 `giscus` 块：`mapping: pathname` -> `mapping: specific`、`strict: '0'` -> `strict: '1'`，并更新两处注释（`pathname keeps locales independent` 一句改为 `specific` + slug term 跨 locale 共享、哈希精确匹配的语义）；验证：文件内容 diff 仅含上述变更
- [x] 2.2 修改 `lib/site-config.ts`：新增 `const GISCUS_MAPPING_VALUES = ['specific'] as const`，`GiscusConfig.mapping` 类型改为 `'specific'` 并更新 JSDoc，`validateGiscusConfig` 中 `mapping` 校验从 `assertNonEmptyString` 升级为 `assertOneOf`；验证：`pnpm build` 通过（或临时把 yaml mapping 改回 pathname 确认构建报 fail-fast 错误后还原）
- [x] 2.3 重启 dev server（`content/site.yaml` 不在模块图内、无 HMR）并确认首页正常渲染；验证：`pnpm dev` 启动无配置校验报错

## 3. 组件改造

- [x] 3.1 修改 `components/posts/Comments.tsx`：props 新增 `term: string` 并传给 `<Giscus term={term}>`，删除 `mapping` 相关的 `as 'pathname'` 强转（直接传 `config.mapping`），更新组件 JSDoc（term 为跨 locale 共享锚点、strict 哈希匹配语义）；验证：`pnpm lint` + `pnpm build` 通过，无 `as 'pathname'` 残留
- [x] 3.2 修改 `components/posts/PostLayout.tsx`：`<Comments>` 调用新增 `term={meta.slug}`；验证：`pnpm build` 通过
- [x] 3.3 修改 `scripts/delete-post.mjs` 的 `printGiscusHints`：受影响讨论从 per-locale pathname 列表改为一条标题为 slug 的共享 Discussion（lock 指引同步调整为单条）；验证：`pnpm delete-post <任一slug> --dry-run` 输出新文案且不执行删除

## 4. 端到端验证（按 design.md 验证协议）

- [x] 4.1 本地访问 `/zh/posts/my-first-blog-website` 与 `/en/posts/my-first-blog-website`：两页评论区显示同一条既有评论（跨 locale 共享，核心验收点）
- [x] 4.2 在无存量 Discussion 的文章（如 `/zh/posts/nginx-certbot-https`）用测试账号首评：GitHub `Comments` 分类自动新建标题为 `nginx-certbot-https` 的 Discussion 且正文自动含 `<!-- sha1: ... -->`；随后访问 `/en/posts/nginx-certbot-https` 显示同一条评论；验证后可删除测试评论
- [x] 4.3 切换 locale 与主题：评论区线程不变（不因 locale 切换变为另一 Discussion）、主题 postMessage 同步照常生效

## 5. 主 spec Purpose 同步（归档前）

- [x] 5.1 更新 `openspec/specs/post-comments/spec.md` 的 Purpose 尾句：`不同语言版本的文章拥有独立评论区` -> `同一 slug 的所有语言版本共享一个评论区（一个 GitHub Discussion）`；验证：主 spec 与 delta 的映射策略 Requirement 语义一致
