## 1. 源图迁移与脚本重写

- [x] 1.1 执行 `git mv app/icon.png assets/app-icon.png` 迁移 master；验证：`Get-FileHash assets/app-icon.png` 等于迁移前 `app/icon.png` 的 SHA256（`4FC5D78B574EEA7D90C76ABB233AA3EBF8D1301283F6F03F6BB222DD1B0D9545`），且 `git status` 识别为 rename
- [x] 1.2 重写 `scripts/generate-pwa-icons.mjs` 基础部分：`SOURCE` 指向 `assets/app-icon.png`、新增 `RATIO = 0.24` 常量、圆角遮罩助手（SVG `<rect rx>` + `composite({ blend: 'dest-in' })`）、4× 超采样助手；更新模块 JSDoc（新职责：favicon/浏览器图标/PWA 图标全量生成；新输出清单）；验证：`node --check scripts/generate-pwa-icons.mjs` 通过，且文件中不再出现以 `app/icon.png` 为输入的路径
- [x] 1.3 实现圆角输出：`app/icon.png`（1184，按目标尺寸直接遮罩）、`public/icon-192.png`、`public/icon-512.png`；验证：运行 `pnpm generate-pwa-icons` 后用 sharp 探针读取三文件，四角像素 alpha=0、边中像素 alpha=255
- [x] 1.4 实现不透明方形输出：`app/apple-icon.png`（master 直接输出）、`public/icon-512-maskable.png`（保留 80% 安全区 + navy 底逻辑，输入改为 master）；验证：两文件四角 alpha=255；`git status` 显示 `public/icon-512-maskable.png` 无变更（与现状字节一致）
- [x] 1.5 实现 ICO 写入器与 favicon 生成：帧序 `[32, 16, 48]`、各帧 4× 超采样、PNG-in-ICO 容器（6 字节 ICONDIR + 16 字节 ×3 ENTRY + PNG 载荷）写入 `app/favicon.ico`；验证：用 `node_modules/next/dist/compiled/image-size` 解析该文件，返回 `width:32`、`type:'ico'`，`images` 含 16/32/48 三帧

## 2. 生成与集成验证

- [x] 2.1 全量运行 `pnpm generate-pwa-icons` 并执行角部探针总检：`app/icon.png`、`public/icon-192.png`、`public/icon-512.png`、`app/favicon.ico` 各帧四角 alpha=0；`app/apple-icon.png`、`public/icon-512-maskable.png` 四角 alpha=255
- [x] 2.2 确定性验证：连续两次运行 `pnpm generate-pwa-icons`，第二次运行后 `git status --porcelain` 不新增任何图标文件变更（字节级一致）
- [x] 2.3 构建与 head 验证：`pnpm build` 成功；确认页面 `<head>` 含 favicon.ico / icon.png / apple-icon.png 三个链接；favicon 链接的 `sizes` 值由 Next.js（Turbopack 构建）取 ICO 最大帧探测为 `48x48`——帧序无关且 spec 不约束具体值，已按决策接受（原「首帧 32 生效 → 32x32」假设不成立于 Turbopack 构建路径）
- [x] 2.4 直抓路径验证：请求 `/favicon.ico` 返回 200 且 Content-Type 为 `image/x-icon`（RSS 阅读器等直抓路径不 404）

## 3. 文档同步

- [x] 3.1 更新 `AGENTS.md`：命令表与 PWA 条目说明图标生成范围（favicon/浏览器图标/PWA 图标统一由脚本产出）、master 源图位置 `assets/app-icon.png`；验证：全文检索 `generate-pwa-icons` 与 `icon.png` 相关描述与新管线一致，无残留「只生成 public/ PWA 图标」表述
- [x] 3.2 确认无其他文件遗留旧行为引用（如 `lib/feed.ts` 的 `/favicon.ico`、`app/manifest.ts` 的图标路径）；验证：`pnpm build` 与 2.3 的 head 检查共同覆盖，无文件需额外修改

## 4. 收尾

- [x] 4.1 运行 `pnpm format-lint` 全部通过（重写的 `.mjs` 符合 Prettier/ESLint 规则）
- [x] 4.2 核对变更集与 proposal 的 Impact 清单一致：`git status` 应仅含 `assets/app-icon.png`（rename）、`scripts/generate-pwa-icons.mjs`、`app/icon.png`、`app/favicon.ico`、`app/apple-icon.png`、`public/icon-192.png`、`public/icon-512.png`、`AGENTS.md`（外加 openspec 变更工件）；提交
