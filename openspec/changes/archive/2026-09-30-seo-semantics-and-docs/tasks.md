# Tasks

## 1. 语义化时间标记

- [x] 1.1 `components/posts/PostLayout.tsx`：发布日期 `<span>` → `<time dateTime={meta.publishedTime}>`、更新日期 `<span>` → `<time dateTime={meta.modifiedTime}>`（class 与分隔符兄弟节点不变，JSDoc/注释按需更新）；验证：dev server 渲染 `/zh/posts/<slug>` 与 `/en/posts/<slug>`，DOM 含 `<time dateTime="YYYY-MM-DD">` 且显示文本与改动前一致（zh `2026年7月21日` 风格 / en `July 21, 2026` 风格）；无 `modifiedTime` 的文章不渲染更新日期项

## 2. 文档修正

- [x] 2.1 `AGENTS.md`：llms.txt 路由路径 `app/[lang]/llms.txt/route.ts` 修正为 `app/llms.txt/route.ts`（仅此一处路径事实修正，不重写周边段落）；验证：全文检索无 `app/[lang]/llms.txt` 残留，且描述与 `app/llms.txt/route.ts` 实际文件一致

## 3. 验收

- [x] 3.1 `pnpm format-lint` 与 `pnpm build` 通过（全部路由保持静态）
