## 1. Header 毛玻璃背景

- [x] 1.1 在 `components/layout/Header.tsx` 的 `<header>` 类名中添加 `bg-background/80 backdrop-blur-md`（保留现有 `sticky top-0 z-40 border-b border-default`）
- [x] 1.2 在 `components/layout/MobileHeader.tsx` 的 `<header>` 类名中添加 `bg-background/80 backdrop-blur-md`（保留现有 `sticky top-0 z-40 border-b border-default`）
- [x] 1.3 浏览器实测：浅色模式滚动页面，确认 Header 呈白色毛玻璃、内容不清晰透出；深色模式同理呈黑色毛玻璃

## 2. 移动端内容水平留白

- [x] 2.1 在 `app/[lang]/layout.tsx` 中将内容容器的类名由 `px-0 lg:px-6` 改为 `px-4 lg:px-6`
- [x] 2.2 浏览器实测：移动端视口（<1024px）下文章列表与文章详情 左右各有 16px 留白，内容不紧贴屏幕边缘

## 3. 侧栏头像圆角

- [x] 3.1 在 `components/layout/ProfileCard.tsx` 的 `<Avatar>` 类名中将 `size-20` 改为 `size-20 rounded-lg`
- [x] 3.2 在 `<Avatar.Image>` 上添加 `className="rounded-lg"`
- [x] 3.3 在 `<Avatar.Fallback>` 上添加 `className="rounded-lg"`
- [x] 3.4 浏览器实测：桌面端 Sidebar 与移动端 Drawer 中的头像均 为 8px 圆角矩形；断开网络或使用无效头像 URL 验证 Fallback 圆角一致

## 4. 语言切换器 Dropdown 改造

- [x] 4.1 在 `components/layout/LanguageSwitcher.tsx` 顶部新增 `LOCALE_LABELS` 常量：`{ zh: { name: '中文', code: 'ZH' }, en: { name: 'English', code: 'EN' } }`
- [x] 4.2 为 `LanguageSwitcher` 函数签名添加 `variant: 'inline' | 'dropdown'` prop（带默认值 `'inline'` 以保持向后兼容）
- [x] 4.3 实现 `variant="dropdown"` 分支：使用 HeroUI `Dropdown` + `Dropdown.Trigger`（包裹 `isIconOnly variant="ghost"` 地球图标按钮，`aria-label={tHeader('Language')}`）+ `Dropdown.Popover` + `Dropdown.Menu`（`selectionMode="single"` `selectedKeys={new Set([currentLocale])}` `onAction={(key) => switchTo(key as Locale)}`）
- [x] 4.4 在 `Dropdown.Menu` 内为每个 locale 渲染 `<Dropdown.Item id={locale} textValue={LOCALE_LABELS[locale].name}>`，内含 `<Dropdown.ItemIndicator />` 与 `<Label>{LOCALE_LABELS[locale].name} ({LOCALE_LABELS[locale].code})</Label>`
- [x] 4.5 将现有内联按钮列表逻辑包裹在 `variant === 'inline'` 条件分支中，保持现有行为不变
- [x] 4.6 在 `components/layout/Header.tsx` 中将 `<LanguageSwitcher />` 改为 `<LanguageSwitcher variant="dropdown" />`
- [x] 4.7 确认 `components/layout/MobileHeader.tsx` 中的 `<LanguageSwitcher />` 保持 `variant="inline"`（默认值，无需显式传 prop）
- [x] 4.8 浏览器实测：桌面端 Header 仅显示地球图标；点击展开菜单显示 `中文 (ZH)` 与 `English (EN)`，当前 locale 有勾选标记；点击非当前 locale 切换语言并保留路径；点击当前 locale 无导航；移动端设置 Popover 内仍为内联按钮列表

## 5. 桌面端侧栏与主内容顶部对齐

- [x] 5.1 在 `components/layout/Sidebar.tsx` 的 sticky 包装层 `<div>` 类名中将 `sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto` 改为 `sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto lg:pt-4`
- [x] 5.2 浏览器实测：桌面端首页 Sidebar 内 ProfileCard 顶部边缘与 main 内第一个 PostCard 顶部边缘水平对齐（均距 Header 底部 32px）；移动端 Drawer 内 SidebarContent 顶部仍为 16px（不受 `lg:pt-4` 影响）

## 6. 质量保证

- [x] 6.1 运行 `pnpm format-lint` 确保格式与 lint 通过（注意：Prettier 会重排 Tailwind 类名顺序，属正常现象）
- [x] 6.2 运行 `pnpm build` 确认生产构建无类型错误、无编译错误
- [x] 6.3 在 `http://localhost:3000/zh` 与 `http://localhost:3000/en` 分别验证浅色/深色模式下所有 5 项改动
