# Spec Delta

## ADDED Requirements

### Requirement: 语义化时间标记

系统 SHALL 在文章详情页（`components/posts/PostLayout.tsx`）以 HTML `<time>` 元素渲染发布日期与更新日期，元素的 `dateTime` 属性 MUST 为 frontmatter 原始日期值（`YYYY-MM-DD`，机器可读的规范形式），元素文本内容 MUST 保持既有的本地化显示格式（`next-intl` `format.dateTime` 输出，如 `2026年7月21日` / `July 21, 2026`）。仅 `modifiedTime` 存在时更新日期才渲染（既有行为不变）。日期 MUST NOT 以无语义的 `<span>` 承载。

#### Scenario: 发布日期渲染为 time 元素

- **WHEN** 渲染文章 `/zh/posts/hello-world`（frontmatter `publishedTime: '2026-07-21'`）
- **THEN** 文章 meta 行含 `<time dateTime="2026-07-21">2026年7月21日</time>`（显示文本为本地化格式，`dateTime` 为原始 ISO 值）

#### Scenario: 更新日期仅在提供时渲染

- **WHEN** 渲染一篇含 `modifiedTime: '2026-08-01'` 的文章
- **THEN** meta 行含 `<time dateTime="2026-08-01">…</time>` 的更新日期；`modifiedTime` 缺失的文章不渲染更新日期项

#### Scenario: 英文变体使用英文显示格式

- **WHEN** 渲染文章 `/en/posts/hello-world`
- **THEN** `<time>` 的 `dateTime` 与 zh 版本相同（`2026-07-21`），文本为英文显示格式（`July 21, 2026`）
