# Spec Delta

## MODIFIED Requirements

### Requirement: Locale-prefixed URL routing

系统 SHALL 使用 `/[lang]/...` URL 前缀结构承载所有业务页面，其中 `lang` 为受支持的语言代码。系统 MUST 支持的语言代码为 `zh` 与 `en`，默认 locale 为 `en`。

#### Scenario: 访问带 locale 前缀的首页

- **WHEN** 用户访问 `/zh` 或 `/en`
- **THEN** 系统渲染对应语言的个人名片和精选文章，精选入口指向该语言的文章详情

#### Scenario: 访问带 locale 前缀的文章列表页

- **WHEN** 用户访问 `/en/posts`
- **THEN** 系统渲染英文版文章列表页

#### Scenario: 受支持 locale 的静态预渲染

- **WHEN** 执行 `next build`
- **THEN** 系统为每个受支持 locale（`zh`、`en`）预渲染所有通过 `generateStaticParams` 声明的路由

### Requirement: UI 文案多语言

系统 SHALL 使用 `next-intl` 加载 `i18n/messages/{lang}.json` 提供 UI 文案翻译。所有 Server Component 通过 `getTranslations` 读取，Client Component 通过 `NextIntlClientProvider` 注入 messages。系统 MUST 为 `zh` 与 `en` 提供完整且键一致的 messages 文件。

#### Scenario: 中文环境下渲染导航

- **WHEN** 当前 locale 为 `zh` 且渲染 Header 导航
- **THEN** 「首页」「文章」「关于」等导航文案来自 `messages/zh.json`

#### Scenario: 英文环境下渲染导航

- **WHEN** 当前 locale 为 `en` 且渲染 Header 导航
- **THEN** 「Home」「Articles」「About」等导航文案来自 `messages/en.json`

#### Scenario: 缺失翻译键

- **WHEN** 某翻译键在当前 locale 的 messages 文件中缺失
- **THEN** 系统在开发环境抛出警告，生产环境回退显示键名

### Requirement: 静态渲染支持

系统 SHALL 在构建时为 `zh` 与 `en` 预渲染首页及其他由 `generateStaticParams` 声明的路由。服务端翻译 SHALL 根据当前 URL 的根语言参数选择文案。

#### Scenario: 构建时为每个 locale 生成静态页面

- **WHEN** `next build` 执行
- **THEN** `/zh` 与 `/en` 的首页生成相应语言的静态 HTML，其他由 `generateStaticParams` 声明的页面继续按语言静态生成
