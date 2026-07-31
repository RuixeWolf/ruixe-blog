## 1. 脚本基础与依赖

- [x] 1.1 创建 `scripts/` 目录与 `scripts/delete-post.mjs` 文件，顶部 ESM imports：`node:fs`、`node:path`、`node:process`、`node:readline/promises`、`yaml`（已装依赖）
- [x] 1.2 在 `package.json` 的 `scripts` 中新增 `"delete-post": "node scripts/delete-post.mjs"`，确认 `pnpm delete-post`（无参数）能执行脚本并打印用法说明
- [x] 1.3 核验 `yaml` 包在 `package.json` 的 `dependencies` 中（非 devDependencies），版本 ^2.9.0，未因任何操作触发 `typescript`/`eslint` 版本漂移

## 2. CLI 参数解析与校验

- [x] 2.1 在 `scripts/delete-post.mjs` 中实现 argv 解析：提取位置参数 `slug`，识别 `--force`、`--dry-run`、`--target <destination>` 标志；`slug` 缺失时打印用法并以非零退出码退出
- [x] 2.2 实现 `--target` 值校验：接受内部路径（如 `/{lang}/posts/other`，含可选 `{lang}` 占位符）或外部 URL（`http://`/`https://` 前缀）；非法格式（如相对路径 `foo/bar`）打印错误并以非零退出码退出
- [x] 2.3 核验 `--force` 与 `--dry-run` 组合行为：`--dry-run --force` 时跳过确认直接打印执行计划

## 3. 文章存在性扫描

- [x] 3.1 实现扫描函数：读取 `content/posts/` 目录下所有文件，筛选匹配 `{slug}.*.mdx` 的文件，从文件名提取 locale（如 `hello-world.zh.mdx` -> `zh`），返回 locale 数组
- [x] 3.2 无匹配文件时打印错误"Post '<slug>' not found"并以非零退出码退出，不修改任何文件
- [x] 3.3 核验扫描逻辑不依赖硬编码 locale 列表（新增 locale 时脚本零改动，从文件名动态提取）

## 4. 重定向清单读取与重复校验

- [x] 4.1 实现读取 `content/redirects.yaml` 的函数：文件不存在时返回空数组；存在时用 `yaml.parse` 解析为数组
- [x] 4.2 检查清单中是否已存在相同 `slug` 的条目，若存在打印错误"Redirect record for '<slug>' already exists"并以非零退出码退出，不修改文件
- [x] 4.3 核验读取函数对不存在文件、空数组、含条目三种情况的处理

## 5. Dry-run 执行计划

- [x] 5.1 当 `--dry-run` 时，打印完整执行计划：将删除的文件列表（含完整路径）、将追加的 YAML 记录（完整渲染）、将打印的 Giscus 提示信息（分类链接、搜索链接、pathname 与标题清单）
- [x] 5.2 Dry-run 不删除文件、不写入 `content/redirects.yaml`，以退出码 0 退出
- [x] 5.3 核验 dry-run 输出与实际执行时追加的 YAML 记录内容完全一致

## 6. 交互式确认

- [x] 6.1 未传 `--force` 且非 `--dry-run` 时，用 `node:readline/promises` 提示 `Delete '<slug>' (locales: zh, en)? [y/N] `，读取用户输入
- [x] 6.2 输入 `y` 或 `Y` 时继续；其他输入（含 `N`、回车、`n`）打印"操作已取消"并以退出码 0 退出，不修改任何文件
- [x] 6.3 传 `--force` 时跳过提示直接继续

## 7. 文章文件删除

- [x] 7.1 对扫描阶段识别的每个 locale，用 `fs.rm` 删除 `content/posts/{slug}.{locale}.mdx` 文件
- [x] 7.2 任一文件删除失败时打印错误并以非零退出码退出；已删文件不恢复（尽力型事务，Decision 8）
- [x] 7.3 核验只删除目标 slug 的文件，其他 slug 文件与 `content/` 下其他文件保持不变

## 8. 重定向清单写入

- [x] 8.1 构造新记录对象：`{ slug, deletedAt: <当天 YYYY-MM-DD>, locales: <扫描结果> }`，当传递 `--target` 时附加 `destination: <target 值>`
- [x] 8.2 读取现有 `content/redirects.yaml` 数组（不存在时视为空数组），追加新记录，用 `yaml.stringify` 整体重写文件
- [x] 8.3 文件不存在时创建并写入 header 注释（说明"此文件由 `scripts/delete-post.mjs` 管理，请勿手动编辑条目"）与首条记录；文件存在时保留已有条目
- [x] 8.4 写入失败时打印错误及应追加的 YAML 片段（供手动恢复），以非零退出码退出

## 9. Giscus 手动锁定提示

- [x] 9.1 读取 `content/site.yaml` 的 `giscus.repo` 字段（`owner/repo` 格式），构造 Discussions 分类 URL `https://github.com/{owner}/{repo}/discussions/categories/Comments`
- [x] 9.2 构造 slug 搜索 URL `https://github.com/{owner}/{repo}/discussions?discussions_q={slug}`
- [x] 9.3 对每个受影响 locale，从已删 MDX 文件的 frontmatter 提取 `title`（删除前缓存，或删除前读取），打印 pathname（`/{locale}/posts/{slug}`）与对应标题
- [x] 9.4 核验提示信息不依赖 `GITHUB_TOKEN`，未设置 token 时仍正常打印

## 10. next.config.ts redirects() 集成

- [x] 10.1 在 `next.config.ts` 的 `nextConfig` 对象中新增 `async redirects()` 函数
- [x] 10.2 实现 YAML 读取与展开逻辑：读取 `content/redirects.yaml`（不存在或解析失败时返回空数组，解析失败打印 console.warn）；对每条记录的每个 locale 生成 `{ source: '/{locale}/posts/{slug}', destination, permanent: true }`，`destination` 含 `{lang}` 时替换为当前 locale，省略时用 `/{locale}/posts`
- [x] 10.3 核验 `redirects()` 对外部 URL 目标（`http(s)://`）直接作为 `destination` 返回，无需 `basePath: false`（项目未配置 `basePath`）
- [x] 10.4 核验 `redirects()` 读取 `content/redirects.yaml` 不触发动态渲染（`pnpm build` 后全路由保持 `● (SSG)`）

## 11. 验证与核验

- [x] 11.1 运行 `pnpm dev` 启动 dev server，用 `next-devtools` MCP（`nextjs_index`）检查无编译/运行时错误
- [x] 11.2 创建临时测试文章 `content/posts/test-delete.{zh,en}.mdx`（frontmatter 符合 schema），运行 `pnpm delete-post test-delete --dry-run` 核验执行计划输出
- [x] 11.3 运行 `pnpm delete-post test-delete` 确认后删除，核验 `content/posts/test-delete.*.mdx` 已删除、`content/redirects.yaml` 已创建并含正确记录、Giscus 提示已打印
- [x] 11.4 浏览器核验：访问 `/zh/posts/test-delete` 返回 308 重定向至 `/zh/posts`，访问 `/en/posts/test-delete` 返回 308 重定向至 `/en/posts`，不渲染 404 页面
- [x] 11.5 核验重复删除保护：再次运行 `pnpm delete-post test-delete` 应提示"not found"并以非零退出码退出
- [x] 11.6 核验 `--target` 参数：创建另一临时文章，运行 `pnpm delete-post <slug> --target /{lang}/posts/other-slug`，核验 `content/redirects.yaml` 记录含 `destination` 字段且重定向目标正确
- [x] 11.7 运行 `pnpm build`，确认全路由保持 SSG（`●`，无 `ƒ`），构建输出无警告，`redirects()` 正确展开
- [x] 11.8 运行 `pnpm format-lint`（Prettier + ESLint），确认通过；特别检查 import 排序、Tailwind class 排序、无 semicolons
- [x] 11.9 核验 `proxy.ts` matcher 仍为纯字符串数组（未受本次改动影响，但项目已知坑点）
- [x] 11.10 清理测试数据：删除 `content/redirects.yaml` 中的测试条目（或整个文件若为测试创建），用 `git checkout` 恢复任何被删的占位文章，确保仓库回到干净状态
