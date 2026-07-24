## 1. 配置文件创建

- [x] 1.1 创建 `content/site.yaml`，包含 `githubUsername: RuixeWolf`、`siteTitle: Ruixe Blog`、`siteDescription`（从现有 `lib/site-config.ts` 硬编码值迁移）三个非空字符串字段，附文件头注释说明用途与提交至 Git 的约定
- [x] 1.2 验证 `content/site.yaml` 未被 `.gitignore` 忽略（`git check-ignore content/site.yaml` 应返回非零退出码）

## 2. 重构 `lib/site-config.ts`

- [x] 2.1 添加 `import 'server-only'`、`import fs from 'node:fs'`、`import path from 'node:path'`、`import YAML from 'yaml'`
- [x] 2.2 定义 `SiteConfigRaw` 接口（`githubUsername`、`siteTitle`、`siteDescription`）与 `SiteConfig` 接口（追加派生 `githubUrl` 与 `siteUrl`）
- [x] 2.3 实现 `loadSiteConfig()` 函数：`path.join(process.cwd(), 'content', 'site.yaml')` + `fs.readFileSync` + `YAML.parse`，对三个必填字段做 `typeof === 'string' && length > 0` 校验，失败时抛错明确指向文件路径与字段名
- [x] 2.4 实现模块级单例缓存（`let cached: SiteConfig | null = null`，首次调用解析并缓存，后续返回缓存值）
- [x] 2.5 导出 `export const siteConfig: SiteConfig = loadSiteConfig()`（模块评估时 eager load）
- [x] 2.6 `siteUrl` 保留 `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ruixe-blog.vercel.app'`，`githubUrl` 派生为 `` `https://github.com/${githubUsername}` ``
- [x] 2.7 移除 `process.env.GITHUB_USERNAME` 读取与 `'RuixeWolf'` 硬编码回退（YAML 为唯一来源）
- [x] 2.8 更新 `siteConfig` 各字段的 JSDoc 注释，反映 YAML 来源（`githubUsername`、`siteTitle`、`siteDescription`）与环境变量来源（`siteUrl`）

## 3. 客户端组件 prop 传递

- [x] 3.1 `components/layout/MobileDrawer.tsx`：移除 `import { siteConfig } from '@/lib/site-config'`，在组件 props 签名新增 `siteTitle: string`，将 `<Drawer.Heading>{siteConfig.siteTitle}</Drawer.Heading>` 改为 `<Drawer.Heading>{siteTitle}</Drawer.Heading>`，更新组件 JSDoc
- [x] 3.2 `components/layout/MobileHeader.tsx`：移除 `import { siteConfig } from '@/lib/site-config'`，在组件 props 签名新增 `siteTitle: string`，将站点标题位置的 `siteConfig.siteTitle` 改为 `siteTitle`，向 `<MobileDrawer>` 透传 `siteTitle={siteTitle}`，更新组件 JSDoc
- [x] 3.3 `app/[lang]/layout.tsx`：`import { siteConfig } from '@/lib/site-config'`，向 `<MobileHeader>` 传入 `siteTitle={siteConfig.siteTitle}` prop

## 4. 环境变量文档清理

- [x] 4.1 编辑 `.env.example`：移除 `GITHUB_USERNAME=RuixeWolf` 行及其注释，新增 `NEXT_PUBLIC_SITE_URL=https://ruixe-blog.vercel.app` 行并附注释说明用于 SEO metadata 与 Open Graph（preview 部署可覆盖）

## 5. 验证

- [x] 5.1 运行 `pnpm format-lint`，确认无 lint/格式错误（注意 `proxy.ts` matcher 若被 Prettier 转为 `String.raw` 需手动回退为纯字符串数组 - 见 repo memory）
- [x] 5.2 运行 `pnpm build`，确认构建成功且所有路由仍为 `● (SSG)`（`fs.readFileSync` 不影响静态渲染）
- [x] 5.3 启动 `pnpm dev`，访问 `/zh` 与 `/en`，确认 Header、MobileDrawer、ProfileCard、NavLinks 中的站点标题与 GitHub 链接正确反映 `content/site.yaml` 值
- [x] 5.4 临时将 `content/site.yaml` 的 `githubUsername` 改为空字符串，重启 dev server，确认 import 时抛错且错误消息明确指向文件与字段；恢复后确认恢复正常
- [x] 5.5 临时重命名 `content/site.yaml`，重启 dev server，确认 import 时抛错且错误消息明确指出文件缺失；恢复后确认恢复正常
- [x] 5.6 在浏览器中验证移动端 Drawer（窄视口）标题显示正确的 `siteTitle`，GitHub 外链指向 `https://github.com/RuixeWolf`
- [x] 5.7 运行 SonarQube 分析（`sonarqube_analyze_file`）覆盖修改的文件：`lib/site-config.ts`、`components/layout/MobileHeader.tsx`、`components/layout/MobileDrawer.tsx`、`app/[lang]/layout.tsx`，确认无新增 code quality 问题
