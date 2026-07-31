## ADDED Requirements

### Requirement: 文章删除与重定向

系统 SHALL 保证文章被删除后，其旧 URL（`/[lang]/posts/<slug>`）通过永久重定向指向有效目标，而非返回 404，以避免死链并保留 SEO 链接权重。重定向规则 MUST 由 `content/redirects.yaml`（重定向清单）驱动，`next.config.ts` 的 `redirects()` 在构建时与开发时读取该清单并展开为 308 永久重定向规则。删除操作 MUST 通过 `post-deletion` 能力定义的 CLI 脚本完成，该脚本同时负责删除 MDX 文件与向重定向清单追加记录。系统 MUST NOT 依赖运行时数据库或外部服务来维护已删文章的重定向映射。

#### Scenario: 已删文章旧 URL 重定向至列表页

- **WHEN** 文章 `hello-world` 被删除且 `content/redirects.yaml` 含其记录（默认目标）
- **THEN** 访问 `/zh/posts/hello-world` 返回 308 重定向至 `/zh/posts`，访问 `/en/posts/hello-world` 返回 308 重定向至 `/en/posts`

#### Scenario: 已删文章不产生 404

- **WHEN** 文章 `hello-world` 被删除并登记重定向后，用户访问其旧 URL
- **THEN** 系统返回 308 永久重定向，不调用 `notFound()`，不渲染 `app/[lang]/not-found.tsx`

#### Scenario: 未删除文章不受影响

- **WHEN** `content/redirects.yaml` 不含某 slug 的记录，且该 slug 的 MDX 文件存在
- **THEN** 访问该 slug 的详情页正常渲染文章内容，不触发重定向

### Requirement: 重定向清单作为单一事实来源

系统 SHALL 将 `content/redirects.yaml` 作为已删文章重定向映射的单一事实来源。该文件 MUST 以 YAML 数组形式存储，每项含 `slug`、`deletedAt`、`locales` 字段与可选的 `destination` 字段。`next.config.ts` `redirects()` MUST 是该文件的唯一消费者，MUST NOT 在其他位置（如代码内联数组、环境变量）维护已删文章的重定向规则。该文件由删除脚本管理，手动编辑需谨慎。

#### Scenario: 构建时读取重定向清单

- **WHEN** 执行 `next build` 且 `content/redirects.yaml` 存在并含有效记录
- **THEN** 构建产物包含清单展开后的全部 308 重定向规则

#### Scenario: 清单文件不存在时不阻断构建

- **WHEN** `content/redirects.yaml` 不存在时执行 `next build`
- **THEN** `redirects()` 返回空数组，构建正常完成，不产生任何重定向规则

### Requirement: 删除后 generateStaticParams 行为

文章详情页的 `generateStaticParams` MUST 通过扫描 `content/posts/` 目录下实际存在的 MDX 文件生成静态参数，已删文章的 slug MUST NOT 出现在预渲染结果中。当 `content/redirects.yaml` 含某 slug 的记录但 `content/posts/` 下已无对应文件时，该 slug MUST NOT 被预渲染，其旧 URL 完全由 `redirects()` 兜底。

#### Scenario: 已删 slug 不被预渲染

- **WHEN** `hello-world` 被删除（MDX 文件已移除）且重定向清单含其记录
- **THEN** `generateStaticParams` 不返回 `hello-world` 的 `{ lang, slug }` 组合，构建产物无其静态 HTML

#### Scenario: redirects 优先于 notFound

- **WHEN** 用户访问已删文章的旧 URL
- **THEN** `redirects()` 返回的 308 规则先生效，文章详情页组件不运行、`notFound()` 不触发
