# Tasks

## 1. `lib/seo.ts` helper 基础

- [x] 1.1 新增 `toOgLocale(locale)`（`zh` → `zh_CN`、`en` → `en_US`）与 `toIsoDateTime(dateStr)`（含 `T` 透传、否则拼 `T00:00:00+08:00`，`AUTHOR_TZ_OFFSET` 常量 + 语义注释），带项目风格 JSDoc；验证：临时 node 脚本或单次 build 无类型错误，映射与拼接输出符合 spec scenario
- [x] 1.2 新增 `buildAlternates(path, locale)`：返回 `{ canonical, languages, types }` 三字段齐备对象；languages 遍历 `routing.locales` 指向同 path 绝对 URL，`path === ''` 时附 `'x-default': siteUrl`；验证：`pnpm build` 通过且首页渲染后含 x-default link（dev server 抽查）
- [x] 1.3 新增 `buildPostAlternatesFull(slug, locale)`：`{ canonical, languages: buildPostAlternates(slug), types }`；验证：单 locale 文章页（如临时只留一个 locale 变体）不含缺失语言的 hreflang
- [x] 1.4 新增 `buildOpenGraph({ title, description, url, locale })`：全量返回 siteName/type/locale（映射值）/localeAlternate（另一 locale 映射）/默认图 `images: [{ url: '/opengraph-image.png', alt: siteTitle }]`；验证：分类页接线后 `<head>` 同时含 `og:image`、`og:locale`、`og:locale:alternate`
- [x] 1.5 扩展 `buildBlogPostingJsonLd`：`image: [`${url}/opengraph-image`]`、`datePublished`/`dateModified` 过 `toIsoDateTime`；验证：文章页 JSON-LD 含 image 数组与 `+08:00` 时区日期

## 2. 布局瘦身（`app/[lang]/layout.tsx`）

- [x] 2.1 `alternates` 移除 `languages`（连同 `routing.locales[0]/[1]` 硬编码一起删除），保留 `types: buildRssAlternateTypes(locale)` 作兜底；验证：布局文件无 languages 残留，`pnpm build` 通过
- [x] 2.2 `twitter` 瘦身为 `{ card: 'summary_large_image', creator: '@RuixeWolf' }`，删除 `title`/`description`；验证：任意页 `<head>` 含 `twitter:card` 与 `twitter:creator`、不含 `twitter:title`/`twitter:description`
- [x] 2.3 `openGraph.url` 改为 `buildPageUrl('', locale)`（首页继承者 og:url 与 canonical 一致）；`openGraph.locale` 改为 `toOgLocale(locale)`；验证：`/zh` 首页 `og:url` 为 `<siteUrl>/zh`、`og:locale` 为 `zh_CN`

## 3. 页面接线（每页显式调用 helper）

- [x] 3.1 首页 `app/[lang]/page.tsx` 新增 `generateMetadata`，仅返回 `{ alternates: buildAlternates('', locale) }`（不返回 title，保住 `title.default` 继承与干净 tab 标题）；验证：`/zh` 含 canonical `/zh`、三 hreflang（zh/en/x-default→根路径），`<title>` 仍为 `Ruixe Blog`
- [x] 3.2 `app/[lang]/posts/page.tsx`：`generateMetadata` 补 `alternates: buildAlternates('posts', locale)` 与 `openGraph: buildOpenGraph({ title: t('Title'), description: siteConfig.siteDescription, url: buildPageUrl('posts', locale), locale })`；验证：`/zh/posts` 的 hreflang 指向 `/zh/posts`/`/en/posts`（不再指向首页）、`og:url` 为 `/zh/posts`
- [x] 3.3 `app/[lang]/about/page.tsx`：alternates 换用 `buildAlternates('about', locale)`，补 `openGraph: buildOpenGraph({ title: t('Title'), ... })`；验证：`/zh/about` 含 canonical + zh/en hreflang + `og:title` 为本地化关于标题
- [x] 3.4 `app/[lang]/categories/[categoryId]/page.tsx`：同 3.3 模式（og title 为分类名、url 为 `buildCategoryUrl`）；验证：`/zh/categories/<id>` 的 `og:title` 为分类名、`og:url` 为分类页 canonical、hreflang 完整
- [x] 3.5 `app/[lang]/tags/[tagId]/page.tsx`：同 3.3 模式（og title 为标签名、url 为 `buildTagUrl`）；验证：`/zh/tags/<id>` 同上
- [x] 3.6 `app/[lang]/posts/[slug]/page.tsx`：alternates 换用 `buildPostAlternatesFull(slug, locale)`；`openGraph.locale` 改映射值并补 `localeAlternate`（不引入 buildOpenGraph，避免覆盖同段文件约定图）；验证：文章页 `og:locale` 为 `zh_CN`、`og:image` 仍为专属 OG 图

## 4. sitemap 一致性

- [x] 4.1 `app/sitemap.ts`：首页条目加 `alternates.languages`（含 `'x-default': siteUrl`），posts/about/分类/标签条目加 languages（同 path 双 locale）；验证：构建产物 `sitemap.xml` 中首页条目含 `xhtml:link hreflang="x-default"`、分类条目含 zh/en 双链接

## 5. 验收

- [x] 5.1 `pnpm format-lint` 通过（注意 Prettier 排序规则与无分号约定）
- [x] 5.2 `pnpm build` 通过且全部路由保持静态（`●` 非 `ƒ`）
- [x] 5.3 编写并运行 head 抽查（PowerShell `Invoke-WebRequest` 或 `scripts/verify-seo.mjs` 一次性脚本，针对 `pnpm start` 本地实例）：对 `/zh`、`/en`、`/zh/posts`、`/zh/about`、`/zh/categories/<id>`、`/zh/tags/<id>`、`/zh/posts/<slug>` 断言 canonical、hreflang 组（含首页 x-default）、`og:locale=zh_CN/en_US`、`og:image` 存在、无布局级 `twitter:title`；文章页额外断言 JSON-LD 含 image 与时区日期
