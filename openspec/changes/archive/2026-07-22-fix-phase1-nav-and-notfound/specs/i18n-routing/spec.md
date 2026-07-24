## MODIFIED Requirements

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
