# Tasks

## 1. robots meta

- [x] 1.1 `app/[lang]/layout.tsx` `generateMetadata` 增加 `robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } }`（含注释说明 Discover/AI Overviews 大图依赖）；验证：dev server 抽查任意页 `<head>` 含 `robots` 与 `googlebot` 两条 meta

## 2. 空 taxonomy 过滤

- [x] 2.1 `lib/posts.ts` 新增 `getTagPostCounts(lang)`（遍历 `getAllPosts(lang)` 对 `post.tags` 逐项累加，零篇键不存在，JSDoc 对齐 `getCategoryPostCounts`）；验证：临时脚本或 dev 下对现有 content 断言计数正确
- [x] 2.2 `app/sitemap.ts`：categoryEntries / tagEntries 生成前按 `getCategoryPostCounts(locale)` / `getTagPostCounts(locale)` 过滤零篇条目（per-locale）；验证：`pnpm build` 后 `sitemap.xml` 不含已知零篇分类/标签（对照 `content/taxonomy/*.yaml` 与文章分布），有内容的条目仍在
- [x] 2.3 `components/layout/SidebarContent.tsx`：分类列表改为仅渲染 `counts[id] > 0` 的项（保留计数显示），标签云改为按 `getTagPostCounts` 过滤（仅过滤，不显示计数）；验证：桌面与移动 Drawer 侧边栏均不出现零篇条目（两处共享组件，一次改动双端生效）
- [x] 2.4 确认零篇 taxonomy 页面行为不变：`generateStaticParams` 仍预渲染、页面 200、robots 为 `index, follow`（无 noindex）；验证：直接访问 `/zh/categories/backend` 返回 200 空状态

## 3. IndexNow

- [x] 3.1 生成 key（`node -e "console.log(crypto.randomUUID().replaceAll('-',''))"` 一次）并创建 `public/<key>.txt`（内容 = key 原文），`.gitignore` 确认未排除；验证：文件存在且本地 dev 下 `http://localhost:3000/<key>.txt` 返回 key 原文
- [x] 3.2 新增 `scripts/seo-index-now.mjs`（纯 Node，无 lib/ import）：默认目标 `https://blog.ruixe.net/sitemap.xml`；解析全部 `<loc>`；校验所有 URL host 与目标站点 host 一致且为 `blog.ruixe.net`，否则非零退出；POST `https://api.indexnow.org/indexnow` JSON `{ host, key, keyLocation, urlList }`（key 从 public/ 下 `*.txt` 文件名读取）；打印提交数量与响应状态；验证：对 localhost 目标运行被拒绝（非零退出、无请求发出）
- [x] 3.3 `package.json` scripts 增加 `"seo-index-now": "node scripts/seo-index-now.mjs"`；验证：`pnpm seo-index-now` 在非生产目标下打印拒绝信息退出

## 4. 验收

- [x] 4.1 `pnpm format-lint` 通过（注意 `.mjs` 脚本风格与既有 `delete-post.mjs` 一致）
- [x] 4.2 `pnpm build` 通过且全部路由保持静态；构建产物 `sitemap.xml` 抽查：零篇 taxonomy 缺席、非零条目含 alternates（含首页 x-default，属 Change A 范围一并确认）
- [x] 4.3 部署后人工执行 `pnpm seo-index-now`，确认响应 200/202，并在 Bing Webmaster Tools（或 IndexNow 门户）核对 URL 被接收
