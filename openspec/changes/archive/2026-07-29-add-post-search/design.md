## Context

Ruixe Blog 是一个文件驱动的 MDX 博客(Next.js 16 App Router,React Compiler),无 CMS、无数据库,所有路由保持 SSG(`●`)。文章为 `content/posts/{slug}.{locale}.mdx` 文件,通过 `lib/posts.ts`(`import 'server-only'`,使用 `node:fs`)在构建时读取。当前 Header 右侧的搜索按钮是禁用占位元素(`app-layout` spec 的「搜索按钮占位」需求),用户无法检索文章。

项目的关键约束:

- **Server/client 边界**:`lib/posts`、`lib/taxonomy` 等模块 `import 'server-only'`,客户端组件 MUST NOT import 它们。已有模式:RSC(`app/[lang]/layout.tsx`、`SidebarContent`、`PostList`)在服务端读取数据,通过 props 传给客户端组件。
- **SSG 守卫**:`fs.readFileSync` 在 server-only 模块中不破坏 SSG(已由 `lib/posts`/`lib/taxonomy` 验证),但任何引入 `getLocale()` 动态读取的做法会强制路由变为 `ƒ`(动态)--须避免。
- **HeroUI v3 beta**:compound 组件,无 Provider,基于 React Aria。API 与 v2 差异大,训练数据不可靠,须以 `heroui-react` MCP 文档为准。
- **i18n**:next-intl,locale 经 `/[lang]` URL 前缀,locales 为 `zh`(默认)/`en`。`usePathname()` 返回 locale-stripped 路径。
- **版本 pin**:`typescript ~6.0.3`、`eslint ~9.39.5` 不可升级。新增依赖须不触发这两者的 peer 冲突。

Fuse.js 是项目技术栈规划中预选的搜索库(`.temp/my-first-blog-website.md` L113),轻量、零依赖、TypeScript 友好,适合客户端中小数据集模糊搜索。当前仅 2 篇文章(hello-world.zh/en.mdx),单作者博客规模可控。

## Goals / Non-Goals

**Goals:**

- 实现当前 locale 文章的客户端模糊搜索(元数据 + 预处理正文)
- 保持全路由 SSG,搜索索引经 RSC props 内联,零运行时服务端搜索开销
- 提供 `⌘K`/`Ctrl+K` 快捷键与 Header 按钮两种触发方式
- 搜索弹窗支持键盘导航(↑↓ 选择、Enter 跳转、ESC 清空/关闭)、ARIA 可访问性
- 延续项目的 server/client 边界、fail-fast 校验、模块级缓存、i18n key 命名约定

**Non-Goals:**

- 跨 locale 搜索(不混合 zh/en 结果,仅搜当前 locale)
- 全文高亮匹配片段(`includeMatches` 不启用,MVP 展示标题/描述/分类/标签/日期即可)
- 搜索结果分页(MVP 限制 10 条,超出不显示)
- 搜索历史/智能推荐/拼音搜索
- 服务端搜索 API 或外部搜索服务(Algolia/Meilisearch)
- 搜索结果 SSR/SEO(弹窗交互为客户端行为,无独立 URL)
- 修正 `PostCard`(async server component)以在客户端复用--搜索结果项是新客户端组件,接收预本地化数据

## Decisions

### 决策 1:搜索数据粒度 -- 元数据 + 预处理正文

**选择**:索引 `title`、`description`、`content`(经 `stripMarkdown` 预处理)、`categoryName`(预本地化)、`tagNames`(预本地化)、`publishedTime`、`slug`。

**理由**:纯元数据搜索会漏掉正文中的关键词(如某篇文章正文提到「React Server Components」但标题/描述未提);索引原始正文又会让 Fuse 的 bitap 算法在 markdown 语法噪音(`#`、`*`、`` ` ``、`[text](url)`)上浪费匹配。`stripMarkdown` 用零依赖正则链剥离 frontmatter(已由 `gray-matter` 剥离,但 `content` 字段已是 body)、代码块、行内代码、链接、图片、HTML 标签、转义字符、多余空白,得到纯文本 `contentText`。

**备选**:(a) 仅元数据--漏召回率高,否决;(b) 索引原始正文--噪声大、payload 大,否决;(c) 引入 markdown 解析库(unified/remark)--过重,正则链对当前 markdown 子集足够,否决。

### 决策 2:数据传递 -- RSC props 内联裁剪索引 + ⌘K/Ctrl+K 触发

**选择**:`app/[lang]/layout.tsx`(RSC)调用 `lib/search.ts` 的 `buildSearchIndex(lang)` 得到 `SearchIndexItem[]`,作为 prop 传入 `SearchProvider`(`'use client'`)。索引**不包含**完整 `PostMeta`(排除 `content` 原文、`modifiedTime`、`lang` 等搜索不需要的字段),仅保留搜索所需的最小字段集。

**SearchIndexItem 结构**:

```ts
interface SearchIndexItem {
  slug: string
  title: string
  description: string
  contentText: string // stripMarkdown(content),正则预处理后的纯文本
  categoryName: string // getCategory(category, lang).name[lang],服务端预本地化
  tagNames: string[] // tags.map(id => getTag(id, lang).name[lang]),服务端预本地化
  publishedTime: string
}
```

**理由**:

- SSG 下无运行时服务端,数据必须在构建时确定。RSC props 内联是 Next.js App Router 的原生方式,数据随 HTML/RSC payload 下发,无需额外 fetch 端点。
- 裁剪索引而非传完整 `PostMeta`:避免把原始 markdown 正文(可能很大)重复塞进 RSC payload--`contentText` 已是预处理后的精简文本。
- 分类/标签在服务端预本地化为当前 locale 名称:客户端无需 import `lib/taxonomy`(server-only),结果项直接显示本地化文本。
- `⌘K`/`Ctrl+K` 触发是现代博客/文档站的事实标准,降低功能发现成本;Header 按钮作为可见入口补充。

**备选**:(a) 独立 `/api/search` 端点--破坏 SSG,需动态渲染,否决;(b) 客户端 `fetch` JSON 索引文件--多一次网络请求 + 需生成静态 JSON,不如 RSC props 内联简洁;(c) 传完整 `PostMeta`--payload 冗余,否决。

### 决策 3:UI 组件 -- HeroUI v3 Modal + SearchField + 结果列表

**选择**:基于 HeroUI v3 `Modal`(compound:`Modal.Backdrop` > `Modal.Container` > `Modal.Dialog` > `Modal.Header/Body`)构建搜索弹窗,内含 `SearchField`(`SearchField.Group` > `SearchField.SearchIcon` + `SearchField.Input` + `SearchField.ClearButton`)与自建结果列表(`<ul role="listbox">` + `<li role="option">`)。

**Modal 关键配置**:

- `Modal.Backdrop`:`isOpen`/`onOpenChange` 受控,`isDismissable`(点击遮罩/ESC 关闭)
- `Modal.Container`:`placement="top"`(弹窗靠上,贴近视觉焦点)、`size` 桌面端用自定义 `sm:max-w-2xl`(Modal.Container 的 `size` prop 枚举为 `xs|sm|md|lg|cover|full`,2xl 需 className 覆盖),移动端用 `size="cover"`(全屏覆盖)
- `Modal.Body`:`scroll` 启用,结果列表超长时内部滚动
- Modal 默认提供 focus trap + scroll lock + ESC 关闭 + 遮罩点击关闭

**理由**:HeroUI v3 是项目既定 UI 库,Modal 的 focus trap/scroll lock/ARIA 语义开箱即用,避免自建弹窗的可访问性陷阱。SearchField 已封装搜索图标 + 清除按钮 + 输入框,compound API 清晰。结果列表不自用 `ListBox`(v3 `ListBox` 的选择语义与「点击跳转路由」交互不完全匹配,且 keyboard nav 需自定义),用原生 `<ul>/<li>` + ARIA listbox 语义更可控。

**备选**:(a) HeroUI v3 `Autocomplete`--其过滤逻辑内置且强耦合数据源,无法接 Fuse.js,且键盘导航行为固定,否决;(b) 自建弹窗--放弃 Modal 的 focus trap/scroll lock,可访问性成本高,否决;(c) 用 `ListBox` 做结果列表--选择语义与路由跳转冲突,需 hack,否决。

### 决策 4:键盘导航 -- ARIA combobox + listbox 模式

**选择**:搜索弹窗实现 ARIA combobox + listbox 子集语义:

- `SearchField.Input` 设 `role="combobox"`、`aria-expanded`(弹窗开)、`aria-controls`(指向 listbox id)、`aria-activedescendant`(指向当前激活项 id)
- 结果列表 `<ul role="listbox">`,`<li role="option"` + `aria-selected`(当前激活项)
- 键盘行为:`↓`/`↑` 移动激活项(循环)、`Enter` 跳转激活项、`ESC` 有内容时先清空、无内容时关闭弹窗

**理由**:combobox + listbox 是 WAI-ARIA 标准的搜索框 + 结果列表模式,屏幕阅读器支持最好。MVP 实现核心子集(`role`、`aria-selected`、`aria-activedescendant`),覆盖主要可访问性需求。`aria-activedescendant` 让屏幕阅读器朗读激活项而不移动 DOM 焦点,与 Modal focus trap 协调良好。

**备选**:(a) roving tabindex(激活项获真实 DOM 焦点)--与 Modal focus trap + SearchField 输入焦点冲突,实现复杂,否决;(b) 不做键盘导航--可访问性差,否决。

### 决策 5:Fuse.js 配置 -- useMemo 缓存 + 加权 keys + 防抖

**选择**:

```ts
const fuse = useMemo(
  () =>
    new Fuse(searchIndex, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.25 },
        { name: 'tagNames', weight: 0.2 },
        { name: 'categoryName', weight: 0.1 },
        { name: 'contentText', weight: 0.05 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true,
    }),
  [searchIndex],
)
```

查询经 200ms 防抖(`useDeferredValue` 或 `setTimeout` 模式),结果限制 10 条。

**理由**(基于 Context7 获取的 Fuse.js 官方文档):

- **加权 keys**:标题匹配权重最高(0.4),正文最低(0.05)--标题命中通常最相关。文档确认 `keys` 接受 `{name, weight}` 数组。
- **`threshold: 0.4`**:默认 0.6 过松(允许较多错配),0.4 更严格。文档明确 threshold 是「最大可接受分数」,分数 = errors/patternLen + 位置惩罚。对中文(每字单 codepoint)同样适用。
- **`ignoreLocation: true`**:文档明确此选项「移除位置惩罚项」,对全文搜索至关重要--否则正文末尾的关键词会因离起点远而得分差。文档源码证实 `ignoreLocation` 时 score = accuracy(errors/patternLen),与位置无关。
- **`minMatchCharLength: 2`**:过滤单字符噪声匹配。文档源码证实不满足此长度的连续匹配会被标记 `isMatch=false`。
- **`includeScore: true`**:可用于结果排序调试(无需 `includeMatches`,MVP 不高亮)。
- **useMemo 缓存**:索引数组在 prop 不变时只构造一次 Fuse 实例,避免每次渲染重建 bitap 表。
- **200ms 防抖**:用户快速输入时不立即搜索,减少计算。用 React 19 的 `useDeferredValue(query)` 是 React Compiler 友好的方式(无需手动 `setTimeout`/`clearTimeout`)。

**备选**:(a) 不防抖--每次按键搜索,小数据集尚可但浪费计算,否决;(b) `setTimeout` 手动防抖--与 React Compiler 的 memoization 交互差,`useDeferredValue` 更原生;(c) `threshold: 0.6`(默认)--中文短词误匹配多,否决。

### 决策 6:搜索范围 -- 仅当前 locale

**选择**:`SearchProvider` 接收的 `searchIndex` 已是当前 locale 的文章索引(`buildSearchIndex(lang)` 按 locale 过滤)。切换 locale 时,layout 重新渲染并传入新 locale 的索引,Fuse 实例因 `searchIndex` 变化而重建。

**理由**:单作者博客中英文章多为对应语言读者阅读,跨 locale 混合结果(中文查询返回英文文章)实用性低且增加结果噪声。locale 切换时数据自然替换,无需额外过滤逻辑。

**备选**:跨 locale 搜索 + 结果标注语言--复杂度高、实用性低,否决。

### 决策 7:⌘K 监听器位置 -- SearchProvider 内部(选项 β)

**选择**:全局 `keydown` 监听器放在 `SearchProvider` 内(`useEffect` 注册),监听 `(e.metaKey || e.ctrlKey) && e.key === 'k'`,调用 `setIsOpen(true)`。`setIsOpen(true)` 是幂等的(状态已是 true 时无操作),消除了「弹窗已开时重复触发」的闭包陷阱。

**理由**:探索阶段发现「⌘K 闭包陷阱」--若监听器在 `SearchDialog` 内部且依赖 `isOpen` 状态,当 `isOpen` 变 true 后监听器的闭包捕获的是旧值,重复按 ⌘K 可能触发意外行为。把监听器放在 Provider 层 + `setIsOpen(true)` 幂等,从架构上消除该陷阱,无需 `useRef` hack。

**备选**:(a) 监听器在 `SearchDialog` 内 + `useRef` 存最新状态--增加复杂度,否决;(b) 监听器在 `SearchTrigger`--Trigger 可能有多个实例(桌面 + 移动),重复注册,否决。

### 决策 8:客户端边界 -- SearchProvider 作为 Context wrapper

**选择**:`SearchProvider` 是 `'use client'` 组件,内部用 React Context 暴露 `{ isOpen, setIsOpen }`。`app/[lang]/layout.tsx`(RSC)渲染 `<SearchProvider searchIndex={...}>{Header, MobileHeader, children}</SearchProvider>`,Provider 内部渲染单个 `SearchDialog` 实例。`SearchTrigger`(`'use client'`)通过 `useSearch()` 消费 Context 调用 `setIsOpen(true)`。

**理由**:延续项目 `ThemeProvider` 的 `'use client'` wrapper 模式。Provider 在 layout 层注入一次,所有后代(Header、MobileHeader)都能消费 Context,无需 prop drilling。`SearchDialog` 在 Provider 内渲染,保证全局只有一个弹窗实例。

**备选**:(a) prop drilling `setIsOpen` 到 Header/MobileHeader--跨多层组件,冗长,否决;(b) 全局事件总线(EventEmitter)--反 React 范式,否决。

### 决策 9:Kbd 提示的 hydration 安全 -- useMounted 守卫

**选择**:`SearchTrigger` 桌面端在按钮旁渲染 `⌘K`/`Ctrl+K` `Kbd` 提示,但仅 `useMounted()` 为 true 时渲染(避免服务端与客户端渲染不一致的 hydration mismatch--服务端不知道平台)。复用项目 `ThemeToggle.tsx` 的 `useSyncExternalStore` mount 检测模式(React Compiler 友好)。

**理由**:服务端渲染时无法知道客户端是 Mac(⌘)还是 Windows/Linux(Ctrl),直接渲染会导致 hydration mismatch 警告。`useMounted` 守卫让 Kbd 仅在客户端挂载后渲染,服务端 HTML 不含 Kbd,客户端首屏后补入。`useSyncExternalStore` 比 `useEffect + useState` 更不易被 React Compiler 优化出问题(项目已验证此模式)。

**备选**:(a) 不显示 Kbd--降低功能可发现性,否决;(b) 用 `navigator.platform` 直接判断--服务端无 `navigator`,需守卫,回到方案 a;(c) `useEffect + useState`--React Compiler 下需谨慎,项目已有 `useSyncExternalStore` 模式更稳。

### 决策 10:ESC 行为 -- 有内容清空,无内容关闭(文档级捕获监听器)

**选择**:HeroUI v3 Modal(React Aria)在 overlay 层拦截 ESC。通过 `Modal.Backdrop` 的 `isKeyboardDismissDisabled` 禁用 Modal 默认 ESC 关闭,在 `document` 上注册**捕获阶段** `keydown` 监听器(`addEventListener('keydown', handler, true)`),使其在 React Aria overlay 的 ESC 处理之前触发。监听逻辑:查询框有内容时 ESC 先清空查询(`queryRef.current !== ''` -> `setQuery('')`);查询为空时 ESC 关闭弹窗(`onOpenChange(false)`)。

**关键实现细节**:

- `queryRef` 在 `useEffect` 中同步(`queryRef.current = query`),避免 React Compiler 的 `react-hooks/refs` 规则报错(禁止在渲染期间写 `ref.current`)。
- `onOpenChange` 是 `SearchProvider` 传入的 `setIsOpen`(useState setter,稳定引用),直接作为 effect 依赖,无需 `onOpenChangeRef` 间接层。
- ESC 关闭有退出动画延迟(~1-3s),弹窗确在关闭,只是不在可访问性快照中即时反映。

**理由**:用户输入长查询后误按 ESC,直接关闭弹窗会丢失输入上下文,体验差。先清空再关闭是更温和的退出梯度,符合常见搜索 UX(GitHub、Algolia DocSearch)。文档级捕获监听器比 `SearchField.Input` 的 `onKeyDown` 更可靠--即使 input 失焦(如焦点移到结果项),ESC 仍能触发。React Aria 的 overlay ESC 处理在冒泡阶段,捕获阶段监听器先于其执行,确保自定义逻辑优先。

**备选**:(a) ESC 直接关闭--丢失输入,体验差,否决;(b) ESC 永远只清空不关闭--无法用键盘关闭弹窗,违反 Modal 语义,否决;(c) 在 `SearchField.Input` 的 `onKeyDown` 处理(原设计)--input 失焦时 ESC 不触发,需依赖 Modal focus trap 保持 input 聚焦,脆弱,否决。

### 决策 11:结果项内容 -- 分类 + 标签 + 日期(PostCard 风格)

**选择**:`SearchResultItem` 展示:标题(主)、描述(次,截断)、底部 meta 行:分类名 + 标签名 + 发布日期。视觉风格参考 `PostCard` 但更紧凑(列表项高度小于卡片)。

**理由**:与 `PostList` 的 `PostCard` 视觉语言一致,降低用户认知负担。分类/标签/日期是用户筛选文章的主要维度,在搜索结果中提供这些信息帮助用户快速判断结果相关性。数据全部预本地化(来自 `SearchIndexItem`),客户端无需 import taxonomy。

**备选**:仅显示标题 + 描述--信息量不足,用户需点击才能判断,否决。

### 决策 12:stripMarkdown -- 零依赖正则链

**选择**:`lib/search.ts` 内实现 `stripMarkdown(content: string): string`,按序应用正则:

1. 移除代码块(` `...` ` 和 `~~~...~~~`,含语言标识)
2. 移除行内代码(`` `code` ``)
3. 移除图片(`![alt](url)`)
4. 移除链接,保留文本(`[text](url)` -> `text`)
5. 移除 HTML 标签(`<...>`)
6. 移除标题/列表/引用标记符(`#`、`-`、`*`、`>`、数字列表前缀)
7. 移除强调标记(`**`、`*`、`__`、`_`)
8. 移除转义反斜杠(`\x` -> `x`)
9. 折叠多余空白为单空格

**理由**:零依赖、可控、对项目当前 markdown 子集足够。markdown 语法结构固定,正则链按「块级 -> 行内 -> 标记符 -> 清理」顺序处理可避免相互干扰。项目已用 `gray-matter` 剥离 frontmatter,`content` 字段是纯 body,无需再处理 frontmatter。

**备选**:(a) `unified` + `remark`--完整 AST 解析,但增加依赖体积与构建时间,对搜索索引场景过重,否决;(b) `strip-markdown` npm 包--多一个依赖,正则链等价且可控,否决。

## Risks / Trade-offs

- **[HeroUI v3 beta 运行时行为与文档不符]** -> 实现时在 dev server + `next-devtools` 中核验 Modal focus trap、SearchField `autoFocus`、Modal.Container `size` 的实际行为;若 `autoFocus` 在 focus trap 下失效,在 `onOpenChange(isOpen)` 为 true 时手动 `inputRef.current?.focus()`。
- **[Fuse.js 中文搜索 threshold 0.4 偏严或偏松]** -> 实现后用真实中文文章(标题/正文)测试;若短词(2-3 字)召回率低,适度上调 threshold(如 0.5);若误匹配多,下调(如 0.3)。中文每字单 codepoint,bitap 算法对中文与拉丁文一致(文档源码证实)。
- **[RSC payload 体积增长]** -> 当前仅 2 篇文章,payload 增长可忽略;随文章增多,`contentText` 会累积。`pnpm build` 后检查 `.next/server/app/[lang]/page.rsp` 体积;若过大,考虑截断 `contentText`(如前 2000 字符)或移除正文索引仅搜元数据。
- **[Modal focus trap 与 SearchField autoFocus 冲突]** -> Modal 的 focus trap 默认聚焦首个可聚焦元素;SearchField.Input 若非首个可能不被自动聚焦。缓解:将 SearchField 放在 Modal.Body 顶部,或手动在 `onOpenChange` 中 focus input。
- **[ESC 自定义行为与 Modal 默认 ESC 冲突]** -> 设 `isKeyboardDismissDisabled` 禁用 Modal 默认 ESC,在 `document` 上注册捕获阶段 `keydown` 监听器(先于 React Aria overlay 的冒泡阶段处理)。此方案不依赖 input 保持焦点,比原设计的 `SearchField.Input` `onKeyDown` 更健壮。`queryRef` 在 `useEffect` 中同步以满足 React Compiler `react-hooks/refs` 规则。
- **[移动端 Modal size="cover" 全屏体验]** -> 全屏弹窗在小屏可接受,但需测试 SearchField 与结果列表的布局。若 `cover` 不可用或体验差,降级为 `size="full"` 或自定义 className。
- **[⌘K 监听器在输入框内重复触发]** -> 用户在弹窗内按 ⌘K,`setIsOpen(true)` 幂等无副作用。但需 `e.preventDefault()` 阻止浏览器默认行为(如 Cmd+K 可能绑定到其他快捷键)。
- **[React Compiler 与 useEffect/渲染期 setState]** -> `react-hooks/refs` 规则禁止渲染期写 `ref.current`,改在 `useEffect` 中同步 `queryRef`。`react-hooks/set-state-in-effect` 规则禁止 `useEffect` 体中同步 `setState`,采用两种 React 推荐模式规避:(a) **派生值**--clamp 逻辑改为 `const safeActiveIndex = activeIndex < results.length ? activeIndex : -1`(渲染期计算,无 setState);(b) **存储前一个 prop**--关闭时重置 query/activeIndex 改为 `useState(prevIsOpen)` + 渲染期条件 `setState`(prop 变化时触发,React 立即重渲染不提交)。⌘K 监听器 `useEffect` 依赖 `[]`(`setIsOpen` 稳定),防抖用 `useDeferredValue`。
- **[搜索结果跳转后弹窗状态]** -> 点击结果 `router.push` 跳转后,弹窗应关闭。在结果项 `onClick`/`onKeyDown Enter` 中先 `setIsOpen(false)` 再 `router.push`,或在 `usePathname` 变化时关闭。前者更直接。

## Migration Plan

此变更为纯新增功能 + 替换占位元素,无数据迁移、无破坏性 API 变更:

1. `pnpm add fuse.js`(确认无 peer 冲突,不触碰 pinned 版本)
2. 创建 `lib/search.ts`、`components/search/*`(4 个组件)
3. 修改 `app/[lang]/layout.tsx` 注入 `SearchProvider`
4. 修改 `Header.tsx`/`MobileHeader.tsx` 替换占位按钮为 `SearchTrigger`
5. 更新 `i18n/messages/{zh,en}.json`(新增 `Search` 命名空间,删除 `Header.SearchComingSoon`)
6. `pnpm dev` + `next-devtools` 核验 Modal/SearchField 运行时行为
7. `pnpm build` 确认全路由保持 SSG(`●`)、RSC payload 体积合理
8. `pnpm format-lint` 通过
9. 手动测试:⌘K/Ctrl+K 触发、按钮触发、中英文搜索、键盘导航、ESC 行为、结果跳转、移动端布局

**回滚**:git revert 即可,无遗留状态(搜索为纯客户端行为,无数据库/配置迁移)。删除 `fuse.js` 依赖:`pnpm remove fuse.js`。

## Open Questions

实现阶段已核验并解决的运行时细节:

1. HeroUI v3 `Modal` 的 `size="cover"` 让移动端弹窗全屏覆盖;桌面端需在 `Modal.Dialog` 上叠加 `sm:h-auto sm:min-h-0 sm:max-h-[85vh]` 恢复紧凑高度。其中 `sm:min-h-0` 不可或缺——`size="cover"` 会同时设 `height:100%` 与 `min-height:100%`,仅 `sm:h-auto` 仍被 `min-height:100%` 撑满至容器全高(实测桌面端 720px)。`Modal.Container` 的 `className="sm:max-w-2xl"` 限制桌面端宽度。
2. `SearchField.Input` 在 Modal focus trap 下 `autoFocus` 可靠,无需手动 `inputRef.current?.focus()`。
3. Fuse.js `threshold: 0.4` 对中文短词(2 字如「博客」「你好」)召回率良好,返回正确结果;单字符因 `minMatchCharLength: 2` 不匹配,符合预期。
