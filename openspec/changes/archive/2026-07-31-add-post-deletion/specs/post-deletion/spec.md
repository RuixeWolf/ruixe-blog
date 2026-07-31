## Purpose

定义 Ruixe Blog 的文章删除子系统，通过 CLI 脚本驱动文章 MDX 文件的删除、永久重定向的登记与 Giscus 评论 Discussion 的手动锁定提示，保证删除文章后旧 URL 不产生死链，且整个流程零额外运行时依赖、零外部 API 调用。

## ADDED Requirements

### Requirement: 删除脚本 CLI 接口

系统 SHALL 提供 `pnpm delete-post <slug>` CLI 命令，接收一个位置参数 `slug`（被删文章的 URL 标识符）与以下可选参数：`--force`（跳过确认提示）、`--dry-run`（预览执行计划而不写入任何变更）、`--target <destination>`（自定义重定向目标，覆盖默认值）。脚本 MUST 在无 `slug` 位置参数时以非零退出码退出并打印用法说明。

#### Scenario: 正常调用带 slug

- **WHEN** 用户执行 `pnpm delete-post hello-world`
- **THEN** 脚本以 `hello-world` 作为待删 slug 继续后续流程

#### Scenario: 缺少 slug 参数

- **WHEN** 用户执行 `pnpm delete-post`（无位置参数）
- **THEN** 脚本打印用法说明并以非零退出码退出，不读取或修改任何文件

#### Scenario: 传递 dry-run 参数

- **WHEN** 用户执行 `pnpm delete-post hello-world --dry-run`
- **THEN** 脚本打印完整执行计划（将删除的文件、将追加的重定向记录、将显示的 Giscus 提示），但不删除文件、不写入重定向清单，以退出码 0 退出

#### Scenario: 传递 force 参数跳过确认

- **WHEN** 用户执行 `pnpm delete-post hello-world --force`
- **THEN** 脚本跳过交互式确认提示，直接执行删除与重定向登记

#### Scenario: 传递 target 参数自定义重定向目标

- **WHEN** 用户执行 `pnpm delete-post hello-world --target /{lang}/posts/new-post`
- **THEN** 脚本将重定向清单中该条目的 `destination` 字段设为 `/{lang}/posts/new-post`，而非默认的 `/{lang}/posts`

### Requirement: 文章存在性校验

脚本 MUST 在执行任何写入操作前，扫描 `content/posts/` 目录下所有匹配 `{slug}.*.mdx` 的文件，从文件名提取实际存在的 locale 列表。当不存在任何匹配文件时，脚本 MUST 以非零退出码退出并提示文章不存在，不修改任何文件。

#### Scenario: 文章存在多个语言版本

- **WHEN** 用户执行 `pnpm delete-post hello-world`，且 `content/posts/` 下存在 `hello-world.zh.mdx` 与 `hello-world.en.mdx`
- **THEN** 脚本识别存在的 locale 列表为 `['zh', 'en']`，继续后续流程

#### Scenario: 文章不存在

- **WHEN** 用户执行 `pnpm delete-post nonexistent`，且 `content/posts/` 下不存在任何 `nonexistent.*.mdx` 文件
- **THEN** 脚本打印错误信息提示文章不存在，以非零退出码退出，不修改任何文件

### Requirement: 交互式确认

脚本 MUST 在删除文件前向用户展示将删除的文件列表与将受影响的 locale，并以 `y/N` 形式请求确认。当未传递 `--force` 且用户输入非 `y` 或 `Y` 时，脚本 MUST 以退出码 0 退出且不修改任何文件。当传递 `--force` 时，脚本 MUST 跳过此确认步骤。

#### Scenario: 用户确认删除

- **WHEN** 脚本提示确认且用户输入 `y`
- **THEN** 脚本继续执行文件删除与重定向登记

#### Scenario: 用户取消删除

- **WHEN** 脚本提示确认且用户输入 `N` 或直接回车
- **THEN** 脚本打印"操作已取消"，以退出码 0 退出，不修改任何文件

### Requirement: 文章文件删除

脚本 MUST 删除 `content/posts/` 目录下该 slug 的所有 locale 变体文件（即所有 `{slug}.{locale}.mdx`）。删除操作 MUST 覆盖扫描阶段识别的全部 locale，不支持仅删除单一 locale。脚本 MUST NOT 删除其他 slug 的文件或 `content/` 下的其他文件。

#### Scenario: 删除多语言文章

- **WHEN** 脚本执行删除 `hello-world`，存在的 locale 为 `['zh', 'en']`
- **THEN** `content/posts/hello-world.zh.mdx` 与 `content/posts/hello-world.en.mdx` 被删除，其他文件保持不变

### Requirement: 重定向清单格式

系统 SHALL 在 `content/redirects.yaml` 维护已删文章的重定向清单。清单 MUST 为 YAML 数组，每项为一个对象，包含字段：`slug`（字符串，被删文章的 slug）、`deletedAt`（`YYYY-MM-DD` 日期字符串，脚本写入执行日期）、`locales`（字符串数组，该文章曾存在文件的 locale 列表）、`destination`（可选字符串，自定义重定向目标，省略时使用默认值 `/{lang}/posts`）。清单文件 MUST 以注释开头说明"此文件由 `scripts/delete-post.mjs` 管理，请勿手动编辑条目"。

#### Scenario: 默认目标的重定向记录

- **WHEN** 脚本删除 `hello-world`（locales `['zh', 'en']`）且未传递 `--target`
- **THEN** `content/redirects.yaml` 追加一条记录：`slug: hello-world`、`deletedAt: '<执行日期>'`、`locales: [zh, en]`，不含 `destination` 字段

#### Scenario: 自定义目标的重定向记录

- **WHEN** 脚本删除 `hello-world` 且传递 `--target /{lang}/posts/new-post`
- **THEN** `content/redirects.yaml` 追加的记录含 `destination: '/{lang}/posts/new-post'` 字段

#### Scenario: 外部 URL 目标

- **WHEN** 脚本删除 `hello-world` 且传递 `--target https://example.com/moved`
- **THEN** `content/redirects.yaml` 追加的记录含 `destination: 'https://example.com/moved'` 字段

### Requirement: 重定向清单写入行为

脚本 MUST 采用"读取现有数组 -> 追加新条目 -> 整体重写文件"的方式写入 `content/redirects.yaml`，以保留 header 注释与已有条目。当文件不存在时，脚本 MUST 创建文件并写入 header 注释与首条记录。脚本 MUST 在追加前检查清单中是否已存在相同 `slug` 的条目，若存在 MUST 以非零退出码退出并提示重复，不修改文件。

#### Scenario: 首次创建重定向清单

- **WHEN** `content/redirects.yaml` 不存在，脚本删除 `hello-world`
- **THEN** 脚本创建 `content/redirects.yaml`，写入 header 注释与 `hello-world` 的重定向记录

#### Scenario: 追加到已有清单

- **WHEN** `content/redirects.yaml` 已存在一条记录，脚本删除另一篇文章 `old-post`
- **THEN** 脚本读取现有数组，追加 `old-post` 记录，整体重写文件，原有记录保持不变

#### Scenario: 重复删除同一 slug

- **WHEN** `content/redirects.yaml` 已含 `slug: hello-world` 的记录，用户再次执行 `pnpm delete-post hello-world`
- **THEN** 脚本打印错误提示该文章的重定向记录已存在，以非零退出码退出，不修改文件

### Requirement: 重定向规则展开

系统 SHALL 在 `next.config.ts` 的 `redirects()` 中读取 `content/redirects.yaml`，将每条记录展开为若干 308 永久重定向规则。展开逻辑为：对每条记录的 `locales` 数组中的每个 locale，生成一条规则，`source` 为 `/{locale}/posts/{slug}`，`destination` 为该记录的 `destination` 字段（若 `destination` 含 `{lang}` 占位符则替换为当前 locale，若省略 `destination` 则使用 `/{locale}/posts`），`permanent` 为 `true`。当 `content/redirects.yaml` 不存在时，`redirects()` MUST 返回空数组。

#### Scenario: 展开默认目标记录

- **WHEN** `content/redirects.yaml` 含记录 `{ slug: hello-world, locales: [zh, en] }`（无 `destination`）
- **THEN** `redirects()` 返回两条规则：`/zh/posts/hello-world -> /zh/posts` 与 `/en/posts/hello-world -> /en/posts`，均为 `permanent: true`

#### Scenario: 展开含占位符的自定义目标

- **WHEN** `content/redirects.yaml` 含记录 `{ slug: old-post, locales: [zh, en], destination: '/{lang}/posts/new-post' }`
- **THEN** `redirects()` 返回 `/zh/posts/old-post -> /zh/posts/new-post` 与 `/en/posts/old-post -> /en/posts/new-post`

#### Scenario: 展开外部 URL 目标

- **WHEN** `content/redirects.yaml` 含记录 `{ slug: moved, locales: [zh, en], destination: 'https://example.com/moved' }`
- **THEN** `redirects()` 返回 `/zh/posts/moved -> https://example.com/moved` 与 `/en/posts/moved -> https://example.com/moved`

#### Scenario: 清单不存在时无重定向

- **WHEN** `content/redirects.yaml` 不存在
- **THEN** `redirects()` 返回空数组，不抛错

### Requirement: Giscus Discussion 手动锁定提示

脚本 MUST 在完成文件删除与重定向登记后，向 stdout 打印 Giscus Discussion 手动锁定的提示信息。提示信息 MUST 包含：GitHub Discussions 分类页 URL（`https://github.com/{owner}/{repo}/discussions/categories/Comments`，其中 `owner`/`repo` 从 `content/site.yaml` 的 `giscus.repo` 读取）、按 slug 搜索 Discussions 的 URL、以及每个受影响 locale 对应的 pathname 与文章标题。脚本 MUST NOT 调用 GitHub API 或要求 `GITHUB_TOKEN` 环境变量。

#### Scenario: 打印 Giscus 锁定提示

- **WHEN** 脚本成功删除 `hello-world`（locales `['zh', 'en']`，中文标题"你好，世界"，英文标题"Hello World"）
- **THEN** 脚本打印 Discussions 分类链接、slug 搜索链接、以及 `/zh/posts/hello-world`（标题"你好，世界"）与 `/en/posts/hello-world`（标题"Hello World"）的清单，提示用户在 GitHub UI 手动锁定对应 Discussion

#### Scenario: 无 token 依赖

- **WHEN** 环境中未设置 `GITHUB_TOKEN`
- **THEN** 脚本仍正常完成删除与重定向登记，并打印手动锁定提示，不因缺少 token 而失败

### Requirement: 删除后 SEO 重定向行为

系统 SHALL 保证已删文章的旧 URL 通过 `next.config.ts` `redirects()` 返回 308 永久重定向，而非 404 页面。`redirects()` 的执行优先级 MUST 高于文章详情页的 `notFound()` 逻辑，使得已删 slug 的旧 URL 直接命中重定向，不触发页面组件渲染。

#### Scenario: 访问已删文章旧 URL

- **WHEN** 用户访问 `/zh/posts/hello-world` 且 `hello-world` 已被删除并登记在 `content/redirects.yaml`
- **THEN** 系统返回 308 永久重定向至 `/zh/posts`，不渲染 404 页面，不执行文章详情页组件

#### Scenario: 已删文章不再被预渲染

- **WHEN** 执行 `next build` 且 `hello-world` 已被删除
- **THEN** 构建产物中不存在 `/zh/posts/hello-world` 与 `/en/posts/hello-world` 的静态 HTML，`generateStaticParams` 不返回该 slug
