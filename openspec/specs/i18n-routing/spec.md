# i18n Routing Specification

## Purpose

定义 Ruixe Blog 的国际化路由与 UI 翻译基础设施，包括 `/[lang]` URL 前缀结构、根路径语言检测与重定向、locale 校验、`next-intl` 消息加载、语言切换、静态渲染支持，以及 locale 感知的内部导航 API。

## Requirements

### Requirement: Locale-prefixed URL routing

系统 SHALL 使用 `/[lang]/...` URL 前缀结构承载所有业务页面，其中 `lang` 为受支持的语言代码。系统 MUST 支持的语言代码为 `zh` 与 `en`，默认 locale 为 `zh`。

#### Scenario: 访问带 locale 前缀的首页

- **WHEN** 用户访问 `/zh`
- **THEN** 系统渲染中文版首页（文章列表）

- **WHEN** 用户访问 `/en/posts`
- **THEN** 系统渲染英文版文章列表页

#### Scenario: 受支持 locale 的静态预渲染

- **WHEN** 执行 `next build`
- **THEN** 系统为每个受支持 locale（`zh`、`en`）预渲染所有通过 `generateStaticParams` 声明的路由

### Requirement: 根路径语言检测与重定向

系统 SHALL 在 `proxy.ts` 中通过 `next-intl/middleware` 检测浏览器 `Accept-Language` 头，并将根路径 `/` 重定向至匹配的 locale 前缀路径。当无法匹配受支持 locale 时，MUST 回退至默认 locale `zh`。

#### Scenario: 浏览器首选中文访问根路径

- **WHEN** 浏览器 `Accept-Language` 首选 `zh` 且访问 `/`
- **THEN** 系统重定向至 `/zh`

#### Scenario: 浏览器首选英文访问根路径

- **WHEN** 浏览器 `Accept-Language` 首选 `en` 且访问 `/`
- **THEN** 系统重定向至 `/en`

#### Scenario: 浏览器首选不支持的语言访问根路径

- **WHEN** 浏览器 `Accept-Language` 首选 `ja`（不在支持列表）且访问 `/`
- **THEN** 系统重定向至默认 locale `/zh`

#### Scenario: 已带 locale 前缀的请求不被二次重定向

- **WHEN** 浏览器访问 `/en/posts/hello-world`
- **THEN** 系统直接渲染对应页面，不触发 locale 重定向

### Requirement: Locale 校验与 404 处理

系统 SHALL 在 `[lang]` 布局中校验 `lang` 参数是否为受支持 locale。当 `lang` 不受支持时，MUST 调用 `notFound()` 返回 404 页面。系统 SHALL 提供 `app/[lang]/not-found.tsx` 本地化 404 页面，当任意页面（文章详情、分类、标签等）调用 `notFound()` 时，MUST 渲染该本地化 404 页面而非 Next.js 默认 404。404 页面 MUST 使用 `useTranslations('NotFound')` 读取 `i18n/messages/{lang}.json` 中已定义的 `Title`、`Description`、`BackHome` 翻译文案，并渲染"返回首页"按钮，按钮链接 MUST 使用 locale-aware `Link` 指向当前 locale 首页。

#### Scenario: 访问不支持的 locale

- **WHEN** 用户访问 `/jp/posts/hello-world`（`jp` 不受支持）
- **THEN** 系统返回 404 页面，渲染 `app/[lang]/not-found.tsx`，显示当前 locale 对应的 `NotFound` 翻译文案

#### Scenario: 访问不存在的文章 slug

- **WHEN** 用户访问 `/zh/posts/nonexistent-slug`（slug 不存在）
- **THEN** 系统返回 404 页面，渲染 `app/[lang]/not-found.tsx`，显示中文 `NotFound` 文案（"页面未找到"、"你访问的页面不存在或已被移除"、"返回首页"按钮）

#### Scenario: 访问不存在的分类 ID

- **WHEN** 用户访问 `/en/categories/nonexistent`（分类 ID 不存在）
- **THEN** 系统返回 404 页面，渲染 `app/[lang]/not-found.tsx`，显示英文 `NotFound` 文案

#### Scenario: 点击返回首页按钮

- **WHEN** 用户在 404 页面点击"返回首页"按钮
- **THEN** 系统导航至当前 locale 的首页（如 `/zh` 或 `/en`）

#### Scenario: 404 页面渲染在 locale layout 内

- **WHEN** `notFound()` 在文章详情页被调用
- **THEN** `app/[lang]/not-found.tsx` 在已渲染的 `[lang]` layout 内渲染（复用 Header、Sidebar 等布局 chrome），而非独立的裸页面

### Requirement: UI 文案多语言

系统 SHALL 使用 `next-intl` 加载 `i18n/messages/{lang}.json` 提供 UI 文案翻译。所有 Server Component 通过 `getTranslations` 读取，Client Component 通过 `NextIntlClientProvider` 注入 messages。系统 MUST 为 `zh` 与 `en` 提供完整且键一致的 messages 文件。

#### Scenario: 中文环境下渲染导航

- **WHEN** 当前 locale 为 `zh` 且渲染 Header 导航
- **THEN** "首页"、"关于" 等导航文案来自 `messages/zh.json`

#### Scenario: 英文环境下渲染导航

- **WHEN** 当前 locale 为 `en` 且渲染 Header 导航
- **THEN** "Home"、"About" 等导航文案来自 `messages/en.json`

#### Scenario: 缺失翻译键

- **WHEN** 某翻译键在当前 locale 的 messages 文件中缺失
- **THEN** 系统在开发环境抛出警告，生产环境回退显示键名

### Requirement: 语言切换

系统 SHALL 在 Header 功能栏提供语言切换入口，允许用户在 `zh` 与 `en` 之间切换。切换时 MUST 导航至当前路径在目标 locale 下的对应版本，保留路径其余段与查询参数。

#### Scenario: 从文章详情页切换语言

- **WHEN** 用户在 `/zh/posts/hello-world` 点击语言切换器并选择 English
- **THEN** 系统导航至 `/en/posts/hello-world`

#### Scenario: 从分类页切换语言

- **WHEN** 用户在 `/en/categories/frontend` 点击语言切换器并选择中文
- **THEN** 系统导航至 `/zh/categories/frontend`

### Requirement: 静态渲染支持

系统 SHALL 在所有 `[lang]` 下的 layout 与 page 中调用 `setRequestLocale(lang)` 以启用按 locale 的静态渲染。`setRequestLocale` MUST 在任何 `next-intl` 翻译函数（`getTranslations`、`useTranslations`、`getMessages`）之前调用。

#### Scenario: 构建时为每个 locale 生成静态页面

- **WHEN** `next build` 执行
- **THEN** 每个声明了 `generateStaticParams` 的页面为 `zh` 与 `en` 各生成一份静态 HTML

### Requirement: 内部导航使用 locale 感知的 Link

系统 SHALL 通过 `next-intl/navigation` 的 `createNavigation` 创建 `Link`、`redirect`、`useRouter` 等导航 API，并使用它们进行所有内部链接渲染。这些 API MUST 自动在路径前缀中注入当前 locale。

#### Scenario: 使用 next-intl Link 跳转文章详情

- **WHEN** 在 locale 为 `zh` 的页面渲染 `<Link href="/posts/hello-world">`
- **THEN** 生成的 `<a>` 标签 `href` 为 `/zh/posts/hello-world`
