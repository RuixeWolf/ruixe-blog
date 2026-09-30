# Proposal

## Why

issue #30 的 P4 层收尾三项：文章页日期以 `<span>` 渲染（`components/posts/PostLayout.tsx:72-78`），丢失机器可读的时间语义——`<time dateTime>` 是零成本的语义改进（爬虫、阅读器、浏览器翻译均受益）；`AGENTS.md` 记载 llms.txt 路由为 `app/[lang]/llms.txt/route.ts`，实际在根级 `app/llms.txt/route.ts`（线上 `/en/llms.txt` 实测 404，符合规范），文档漂移会误导后续开发与代理；CWV（LCP/INP/CLS）从未采集基线，文章图片 CLS 这一已知取舍（`mdx-components.tsx` 有意未加尺寸占位）无法用数据决定是否处理。

## What Changes

- **语义化时间标记**：文章详情页的发布日期与更新日期从 `<span>` 改为 `<time dateTime="YYYY-MM-DD">`（`dateTime` 取 frontmatter 原值，显示文本不变）；分类/标签页无日期渲染，不涉及
- **文档修正**：`AGENTS.md` 中 llms.txt 路由路径由 `app/[lang]/llms.txt/route.ts` 修正为 `app/llms.txt/route.ts`（根级，与实测一致）
- **CWV 基线采集**（运维任务，非代码）：部署后用 PageSpeed Insights 对首页 + 2 篇文章页（zh/en 各一）采集一次 LCP/INP/CLS，数据记录回 issue #30，作为「图片 CLS 是否处理」的决策依据
- **明确不做**：`lang="zh"` → `lang="zh-Hans"`（SEO-17，issue 自评现状可接受，改动波及 `<html>` 与 locale 判定链路，收益不成比例）

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `seo`: **ADDED**「语义化时间标记」requirement——文章详情页日期 MUST 以 `<time>` 元素渲染且 `dateTime` 属性为 frontmatter 原始 `YYYY-MM-DD` 值

## Impact

- **代码**：`components/posts/PostLayout.tsx`（两处 `<span>` → `<time>`，纯标记替换，样式类不变）
- **文档**：`AGENTS.md`（一行路径修正）
- **运维**：PSI 采集记录（回填 issue #30，无仓库产物）
- **不改动**：日期的显示格式（`next-intl` `format.dateTime` 输出保持）、路由、metadata
