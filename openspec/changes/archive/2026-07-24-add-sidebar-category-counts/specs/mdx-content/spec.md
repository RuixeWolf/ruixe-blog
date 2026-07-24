## MODIFIED Requirements

### Requirement: 文章列表读取

系统 SHALL 通过 `lib/posts.ts`（标记 `'server-only'`）使用 `gray-matter` 解析 `content/posts/` 下所有 MDX 文件的 frontmatter，返回文章元数据列表。列表 MUST 按 `publishedTime` 降序排列（最新在前）。读取函数 MUST 支持按 locale 过滤、按 category 过滤、按 tag 过滤。`getAllPosts(lang)` SHALL 在 production 模式（`process.env.NODE_ENV === 'production'`）下使用 per-locale 的模块级 `Map` 缓存已解析的文章列表，避免重复 fs 扫描；在 development 模式下 MUST 不缓存，每次调用读文件系统以保证新增/修改文章立即可见。系统 SHALL 提供 `getCategoryPostCounts(lang)` 聚合函数，返回 `Record<string, number>`（categoryId 到文章数量的映射），该函数 MUST 通过遍历 `getAllPosts(lang)` 结果按 `post.category` 字段聚合计算。

#### Scenario: 获取所有中文文章

- **WHEN** 调用 `getAllPosts('zh')`
- **THEN** 返回所有 `*.zh.mdx` 文件的元数据，按 `publishedTime` 降序排列

#### Scenario: 按分类过滤文章

- **WHEN** 调用 `getPostsByCategory('frontend', 'zh')`
- **THEN** 返回 frontmatter `category` 为 `frontend` 的所有中文文章

#### Scenario: 按 tag 过滤文章

- **WHEN** 调用 `getPostsByTag('next-js', 'en')`
- **THEN** 返回 frontmatter `tags` 数组含 `next-js` 的所有英文文章

#### Scenario: 统计分类文章计数

- **WHEN** 调用 `getCategoryPostCounts('zh')` 且当前有 `frontend` 分类 1 篇文章、`backend` 分类 0 篇文章
- **THEN** 返回对象中 `frontend` 键值为 `1`，`backend` 键不存在（调用方用 `?? 0` 处理为 0）

#### Scenario: production 模式下 getAllPosts 缓存复用

- **WHEN** 在 `process.env.NODE_ENV === 'production'` 下多次调用 `getAllPosts('zh')`
- **THEN** 首次调用执行 fs 扫描与解析，后续调用返回缓存的同一数组引用，不重复扫描文件系统

#### Scenario: development 模式下 getAllPosts 不缓存

- **WHEN** 在 `process.env.NODE_ENV === 'development'` 下调用 `getAllPosts('zh')`，随后新增一篇 `new-post.zh.mdx` 文件，再次调用 `getAllPosts('zh')`
- **THEN** 第二次调用读文件系统，返回包含 `new-post` 的文章列表
