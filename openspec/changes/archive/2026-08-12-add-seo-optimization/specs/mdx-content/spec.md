## MODIFIED Requirements

### Requirement: 文章详情页渲染

系统 SHALL 在 `app/[lang]/posts/[slug]/page.tsx` 渲染文章详情。页面 MUST：校验 `lang` 与 `slug`；通过 `lib/posts.ts` 读取 frontmatter 元数据；动态 `import` 对应 `{slug}.{lang}.mdx` 文件并渲染；为 `<html>` 或文章容器设置基于 frontmatter 的 `metadata`（title、description、Open Graph）。文章不存在时 MUST 调用 `notFound()``。页面的 `generateMetadata`MUST 声明`alternates.canonical`（当前页面的绝对 URL）、`alternates.languages`（只声明实际存在的语言版本，通过检查其他 locale 的文章文件是否存在判断）、以及 `openGraph.locale`（当前 locale）。`alternates.languages` MUST NOT 指向 locale 首页（`/zh`、`/en`），MUST 指向同篇文章的其他语言版本 URL（`/{locale}/posts/{slug}`）。

#### Scenario: 渲染存在的文章

- **WHEN** 用户访问 `/zh/posts/hello-world` 且文件存在
- **THEN** 页面渲染文章标题、发布时间、分类、标签、正文内容

#### Scenario: 文章在当前 locale 不存在

- **WHEN** 用户访问 `/zh/posts/nonexistent` 且 `nonexistent.zh.mdx` 不存在
- **THEN** 系统返回 404

#### Scenario: 文章元数据注入

- **WHEN** 渲染文章详情页
- **THEN** 页面 `<title>` 与 `<meta name="description">` 来自 frontmatter 的 `title` 与 `description`

#### Scenario: 文章详情页 hreflang 指向同篇文章其他语言版本

- **WHEN** 渲染 `/zh/posts/hello-world` 且 `hello-world.en.mdx` 也存在
- **THEN** 页面 `<head>` 含 `<link rel="alternate" hreflang="en" href="<siteUrl>/en/posts/hello-world">`（而非 `<siteUrl>/en`）

#### Scenario: 单语言文章不声明不存在的语言 alternate

- **WHEN** 渲染 `/zh/posts/draft-post` 且 `draft-post.en.mdx` 不存在
- **THEN** 页面 `<head>` 不含 `hreflang="en"` 的 alternate link

#### Scenario: 文章详情页 canonical 声明

- **WHEN** 渲染 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 含 `<link rel="canonical" href="<siteUrl>/zh/posts/hello-world">`

#### Scenario: 文章详情页保留 openGraph.locale

- **WHEN** 渲染 `/zh/posts/hello-world`
- **THEN** 页面 `<head>` 含 `<meta property="og:locale" content="zh">`（不因 metadata 浅合并丢失）
