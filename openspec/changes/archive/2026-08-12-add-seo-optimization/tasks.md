## 1. 字体资源准备（本地一次性操作，非代码任务）

- [x] 1.1 下载 Noto Sans SC Regular 与 Bold 字体（从 Google Fonts 或 GitHub googlefonts/noto-cjk 获取 `.otf` 或 `.ttf` 原文件）
- [x] 1.2 用 `pyftsubset`（`pip install fonttools`）将 Noto Sans SC Regular 裁剪为常用汉字子集：准备 `common-chars.txt`（GB2312 常用 3500 字 + ASCII + 中英文标点），执行 `pyftsubset NotoSansSC-Regular.ttf --text-file=common-chars.txt --output-file=assets/NotoSansSC-Regular.subset.ttf`
- [x] 1.3 同样裁剪 Bold 字重：`pyftsubset NotoSansSC-Bold.ttf --text-file=common-chars.txt --output-file=assets/NotoSansSC-Bold.subset.ttf`
- [x] 1.4 下载 Geist SemiBold 字体 `.ttf` 文件（从 Geist 官方 GitHub 仓库或 Google Fonts 获取），保存为 `assets/Geist-SemiBold.ttf`
- [x] 1.5 将 Noto Sans SC 的 OFL 许可证文本保存为 `assets/OFL.txt`（Noto 字体随附的 `LICENSE` 文件）
- [x] 1.6 在 `README.md` 末尾添加"字体资源"小节，标注 Noto Sans SC 与 Geist 的来源与 OFL 许可证信息

## 2. 网站图标与默认 OG 图资源放置

- [x] 2.1 将 `.temp/app-icon.png` 复制为 `app/icon.png`（通用图标，建议 ≥ 512×512）
- [x] 2.2 将 `.temp/app-icon.png` 复制为 `app/apple-icon.png`（Apple touch icon，确认是实心背景方形图）
- [x] 2.3 将 `.temp/opengraph-image.png` 复制为 `app/opengraph-image.png`（默认 OG 图，确认尺寸 1200×630）
- [x] 2.4 创建 `app/opengraph-image.alt.txt`，内容为默认 OG 图的 alt 文本（如 "Ruixe Blog"）
- [x] 2.5 启动 `pnpm dev`，访问首页查看 `<head>` 确认 `<link rel="icon">`、`<link rel="apple-touch-icon">`、`<meta property="og:image">` 已自动注入

## 3. lib/seo.ts 模块创建

- [x] 3.1 创建 `lib/seo.ts`，添加 `import 'server-only'` 与必要 import（`siteConfig`、`routing`、`Locale`、`PostMeta` 类型）
- [x] 3.2 实现绝对 URL 生成函数：`buildPageUrl(path: string, locale: Locale): string`（拼接 `siteConfig.siteUrl` + `/{locale}` + path）
- [x] 3.3 实现 `buildPostUrl(slug: string, locale: Locale): string`（调用 `buildPageUrl` 拼 `/posts/{slug}`）
- [x] 3.4 实现 `buildCategoryUrl(categoryId: string, locale: Locale): string`（拼 `/categories/{categoryId}`）
- [x] 3.5 实现 `buildTagUrl(tagId: string, locale: Locale): string`（拼 `/tags/{tagId}`）
- [x] 3.6 实现 `buildPostAlternates(slug: string): Record<string, string>`（遍历 `routing.locales`，用 `getPostBySlug` 检查存在性，只返回存在的语言版本的 URL 映射）
- [x] 3.7 实现 `buildWebsiteJsonLd(): object`（返回 `WebSite` schema，含 `name`、`url`、`potentialAction` 可选）
- [x] 3.8 实现 `buildPersonJsonLd(): object`（返回 `Person` schema，含 `name`=`siteConfig.githubUsername`、`url`=GitHub profile URL、`sameAs` 数组）
- [x] 3.9 实现 `buildBlogPostingJsonLd(post: PostMeta, locale: Locale, url: string): object`（返回 `BlogPosting` schema，含 `headline`、`description`、`datePublished`、`dateModified`、`author`、`mainEntityOfPage`）
- [x] 3.10 实现 `buildBreadcrumbJsonLd(items: { name: string; url: string }[]): object`（返回 `BreadcrumbList` schema，含 `itemListElement` 数组）
- [x] 3.11 为 `lib/seo.ts` 的所有导出函数添加 JSDoc 注释（遵循项目 JSDoc 生成规范）
- [x] 3.12 运行 `pnpm lint` 确认无 lint 错误

## 4. sitemap.ts 实现

- [x] 4.1 创建 `app/sitemap.ts`，import `MetadataRoute` 类型、`routing`、`getAllPosts`、`getCategories`、`getTags`、`lib/seo.ts` 的 URL 函数
- [x] 4.2 实现 `default function sitemap(): MetadataRoute.Sitemap`，遍历 `routing.locales`
- [x] 4.3 为每个 locale 添加静态页面 URL：首页（`buildPageUrl('', locale)`，priority 1.0，changefreq weekly）、文章列表页（`buildPageUrl('posts', locale)`，priority 0.9）、关于页（`buildPageUrl('about', locale)`，priority 0.5）
- [x] 4.4 为每个 locale 添加所有分类页 URL（遍历 `getCategories(locale)`，priority 0.6）
- [x] 4.5 为每个 locale 添加所有标签页 URL（遍历 `getTags(locale)`，priority 0.6）
- [x] 4.6 为每个 locale 添加所有文章页 URL（遍历 `getAllPosts(locale)`，`lastModified` 用 `post.modifiedTime ?? post.publishedTime`，priority 0.8，changefreq monthly）
- [x] 4.7 为文章页 URL 添加 `alternates.languages`：调用 `buildPostAlternates(post.slug)` 获取只含存在语言版本的映射
- [x] 4.8 运行 `pnpm build`，确认 `/sitemap.xml` 生成且含所有 URL 类型与 hreflang
- [x] 4.9 访问 `http://localhost:3000/sitemap.xml` 验证 XML 格式正确、含 `<xhtml:link rel="alternate" hreflang>` 标签

## 5. robots.ts 实现

- [x] 5.1 创建 `app/robots.ts`，import `MetadataRoute` 类型与 `siteConfig`
- [x] 5.2 实现 `default function robots(): MetadataRoute.Robots`，返回 `{ rules: { userAgent: '*', allow: '/' }, sitemap: '${siteConfig.siteUrl}/sitemap.xml' }`
- [x] 5.3 运行 `pnpm build`，确认 `/robots.txt` 生成
- [x] 5.4 访问 `http://localhost:3000/robots.txt` 验证内容含 `User-Agent: *`、`Allow: /`、`Sitemap:` 指令

## 6. 根 layout 元数据与 JSON-LD

- [x] 6.1 在 `app/layout.tsx` 的 `metadata` 对象添加 `twitter` 字段：`{ card: 'summary_large_image', title: siteConfig.siteTitle, description: siteConfig.siteDescription, creator: '@RuixeWolf' }`
- [x] 6.2 在 `app/layout.tsx` 创建 `WebSiteJsonLd` 组件，调用 `buildWebsiteJsonLd()` 并渲染 `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`
- [x] 6.3 在 `app/layout.tsx` 创建 `PersonJsonLd` 组件（全局作者），调用 `buildPersonJsonLd()` 渲染 script 标签
- [x] 6.4 在 `RootLayout` 的 `<body>` 内（`ThemeProvider` 内、`children` 前）渲染 `<WebSiteJsonLd />` 与 `<PersonJsonLd />`
- [x] 6.5 运行 `pnpm dev`，访问首页查看源码确认 `<meta name="twitter:card" content="summary_large_image">` 与两个 JSON-LD script 标签已注入

## 7. 首页与文章列表页 generateMetadata

- [x] 7.1 在 `app/[lang]/page.tsx` 添加 `generateMetadata` 函数：校验 locale，用 `getTranslations('PostList')` 获取标题，返回 `{ title: t('Title'), description: siteConfig.siteDescription }`
- [x] 7.2 在 `app/[lang]/posts/page.tsx` 添加相同的 `generateMetadata`（与首页逻辑一致，可抽取共享函数或直接重复）
- [x] 7.3 运行 `pnpm dev`，访问 `/zh` 与 `/zh/posts` 确认 `<title>` 与 `<meta name="description">` 已正确设置

## 8. 文章详情页 generateMetadata 修复

- [x] 8.1 修改 `app/[lang]/posts/[slug]/page.tsx` 的 `generateMetadata`：在现有返回基础上添加 `alternates.canonical`（调用 `buildPostUrl(slug, locale)`）
- [x] 8.2 添加 `alternates.languages`：调用 `buildPostAlternates(slug)` 获取只含存在语言版本的映射（覆盖 locale layout 的错误 alternates）
- [x] 8.3 在 `openGraph` 对象中显式添加 `locale` 字段（当前 locale，修复 metadata 浅合并导致的 `og:locale` 丢失）
- [x] 8.4 在 `openGraph` 中添加 `url` 字段（文章绝对 URL）与 `siteName` 字段（`siteConfig.siteTitle`）
- [x] 8.5 运行 `pnpm dev`，访问 `/zh/posts/hello-world` 查看源码确认：`<link rel="canonical">` 指向文章 URL、`<link rel="alternate" hreflang="en">` 指向 `/en/posts/hello-world`（而非 `/en`）、`<meta property="og:locale" content="zh">` 存在

## 9. 文章详情页 BlogPosting JSON-LD

- [x] 9.1 在 `app/[lang]/posts/[slug]/page.tsx` 的页面组件中，调用 `buildBlogPostingJsonLd(post, locale, buildPostUrl(slug, locale))` 构建 JSON-LD 数据
- [x] 9.2 在页面 JSX 中渲染 `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />`
- [x] 9.3 可选：构建 `BreadcrumbList` JSON-LD（首页 > 文章）并同样渲染
- [x] 9.4 运行 `pnpm dev`，访问文章页确认 `BlogPosting` JSON-LD script 标签已注入，用 Google Rich Results Test 验证结构化数据有效

## 10. 分类与标签页 canonical 与 BreadcrumbList

- [x] 10.1 修改 `app/[lang]/categories/[categoryId]/page.tsx` 的 `generateMetadata`：添加 `alternates.canonical`（`buildCategoryUrl(categoryId, locale)`）
- [x] 10.2 在分类页组件中构建 `BreadcrumbList` JSON-LD（首页 > 分类名），渲染 script 标签
- [x] 10.3 修改 `app/[lang]/tags/[tagId]/page.tsx` 的 `generateMetadata`：添加 `alternates.canonical`（`buildTagUrl(tagId, locale)`）
- [x] 10.4 在标签页组件中构建 `BreadcrumbList` JSON-LD（首页 > 标签名），渲染 script 标签
- [x] 10.5 运行 `pnpm dev`，访问分类页与标签页确认 canonical 与 BreadcrumbList JSON-LD 已注入

## 11. 关于页 canonical 与 Person JSON-LD

- [x] 11.1 修改 `app/[lang]/about/page.tsx` 的 `generateMetadata`：添加 `alternates.canonical`（`buildPageUrl('about', locale)`）
- [x] 11.2 在关于页组件中构建详细版 `Person` JSON-LD（含 GitHub 用户名、profile URL、bio 等），渲染 script 标签
- [x] 11.3 运行 `pnpm dev`，访问 `/zh/about` 确认 canonical 与 Person JSON-LD 已注入

## 12. 文章动态 OG 图实现

- [x] 12.1 创建 `app/[lang]/posts/[slug]/opengraph-image.tsx`，import `ImageResponse` from `next/og`、`readFile` from `node:fs/promises`、`join` from `node:path`
- [x] 12.2 导出 `alt`、`size`（`{ width: 1200, height: 630 }`）、`contentType`（`'image/png'`）常量
- [x] 12.3 在 module scope 用 top-level await 加载字体：`const notoRegular = await readFile(join(process.cwd(), 'assets/NotoSansSC-Regular.subset.ttf'))`，同样加载 `NotoSansSC-Bold.subset.ttf` 与 `Geist-SemiBold.ttf`
- [x] 12.4 实现默认导出 `Image` 函数，签名 `{ params: Promise<{ lang: string; slug: string }> }`
- [x] 12.5 在函数内 `await params` 获取 `lang` 与 `slug`，校验 locale，调用 `getPostBySlug(slug, locale)` 获取文章元数据；文章不存在时返回简单兜底图或抛错
- [x] 12.6 用 `getCategory(post.category, locale)` 获取分类名，格式化 `publishedTime` 为 locale 友好日期
- [x] 12.7 用 `ImageResponse` 渲染 OG 图 JSX：背景色固定（如深色 `#0a0a0a`）、顶部站点名 "Ruixe Blog"（Geist SemiBold）、中央文章标题（NotoSansSC-Bold，大字，白色）、底部元信息（分类 · 日期，Geist SemiBold，较小）
- [x] 12.8 在 `ImageResponse` options 传 `fonts` 数组：Geist SemiBold（weight 600）、NotoSansSC Regular（weight 400）、NotoSansSC Bold（weight 700）
- [x] 12.9 运行 `pnpm build`，确认构建时为每篇文章×locale 生成 OG 图（查看 `.next` 输出或构建日志）
- [x] 12.10 运行 `pnpm dev`，访问 `/zh/posts/hello-world/opengraph-image`（或查看文章页 `<head>` 的 `og:image` URL）确认图片正确生成、中文标题正常渲染（无方块）

## 13. 构建验证与最终检查

- [x] 13.1 运行 `pnpm format-lint`（Prettier + ESLint），确认所有新文件符合代码风格
- [x] 13.2 运行 `pnpm build`，确认构建成功且全路由保持 `● (SSG)`（无 `ƒ` 动态路由）
- [x] 13.3 检查构建输出确认 `sitemap.xml`、`robots.txt`、各文章 OG 图均已生成
- [x] 13.4 运行 `pnpm dev`，逐一访问以下页面查看页面源码验证 SEO 标签：首页 `/zh`、文章列表 `/zh/posts`、文章详情 `/zh/posts/hello-world`、分类页 `/zh/categories/frontend`、标签页 `/zh/tags/next-js`、关于页 `/zh/about`
- [x] 13.5 每个页面验证：`<title>`、`<meta name="description">`、`<link rel="canonical">`、`<meta property="og:image">`、`<meta name="twitter:card">`、JSON-LD script 标签
- [x] 13.6 文章详情页额外验证：`<link rel="alternate" hreflang="en">` 指向 `/en/posts/hello-world`（而非 `/en`）、`<meta property="og:locale">` 存在
- [x] 13.7 访问 `/sitemap.xml` 验证：所有 URL 类型齐全、文章页含 hreflang、单语言文章不生成不存在的 locale URL
- [x] 13.8 访问 `/robots.txt` 验证内容正确
- [x] 13.9 用 Google Rich Results Test（https://search.google.com/test/rich-results）验证文章页 JSON-LD（BlogPosting + BreadcrumbList）无错误
- [x] 13.10 用 Facebook Sharing Debugger 或 Twitter Card Validator 验证 OG 图与 Twitter Card 展示正常（可选，需部署后线上 URL）
- [x] 13.11 运行 SonarQube 分析所有新增与修改的文件（`sonarqube_analyze_file_list` 或等价方式），确认无新增代码质量问题
