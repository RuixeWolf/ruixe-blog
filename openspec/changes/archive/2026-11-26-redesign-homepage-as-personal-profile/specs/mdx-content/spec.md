# Spec Delta

## ADDED Requirements

### Requirement: 首页精选文章

首页 SHALL 按 `featuredPosts` 顺序展示当前语言的文章标题和摘要，点击条目 SHALL 打开当前语言的文章详情。标题与摘要取自该文章的 MDX frontmatter。

#### Scenario: 两种语言按手选顺序阅读

- **WHEN** 用户访问中文或英文首页
- **THEN** 初始配置依次展示建站记录、2026 年中旬的 AI Coding 工作流和 Modbus 模拟器 AI 支持三篇文章
- **AND** 更改配置顺序后重新构建，两个首页同步调整，全部文章页仍按发布时间排序

#### Scenario: 当前语言缺少精选内容

- **WHEN** 某项在当前语言下没有对应文章
- **THEN** 跳过该项并保留其余文章的相对顺序；可展示条目为零时省略整个栏目

### Requirement: 独立的全部文章页

系统 SHALL 在 `/[lang]/posts` 展示当前语言的全部文章，按发布时间由新到旧排列，并保留相应文章的标题、摘要、日期、分类和标签。首页的文章入口 SHALL 导向该页面。

#### Scenario: 从首页查看当前语言的全部文章

- **WHEN** 用户从中文或英文首页进入对应的文章列表页
- **THEN** 系统展示该语言的全部文章，最新发布的文章排在首位

#### Scenario: 验证现有文章的列表和详情

- **WHEN** 用户从中文列表点击一篇已有中文版本的文章
- **THEN** 列表展示该文的标题和摘要，点击后打开同语言的详情并渲染正文

## MODIFIED Requirements

### Requirement: 关于页面

系统 SHALL 提供 `app/[lang]/about/page.tsx` 页面，展示关于博主与关于本博客的信息。页面内容 SHALL 通过 `next-intl` messages 或独立 MDX 文件提供多语言版本。作者部分 SHALL 扩充作者简介、技术关注方向与创建博客的缘由。博客部分 SHALL 提供博客说明、现有博客配图、同语言的建站记录与原有版权及许可信息。

#### Scenario: 访问关于页

- **WHEN** 用户访问 `/zh/about`
- **THEN** 页面显示中文版的作者介绍、建站缘由、关于博客和版权许可内容

#### Scenario: 从英文关于页阅读建站记录

- **WHEN** 用户访问 `/en/about` 并点击建站记录
- **THEN** 前往英文建站文章，英文关于页提供与中文版相同的内容栏目和许可链接

## REMOVED Requirements

### Requirement: 文章列表页与首页等价

**Reason**: 首页改为个人名片，完整的文章列表已有独立页面。
**Migration**: 使用首页主操作或主导航的「文章」进入当前语言的 `/[lang]/posts`。

### Requirement: 占位内容

**Reason**: 仓库已有可用于验收的真实文章，早期 `hello-world` 样例已从内容目录移除，原有场景也依赖首页文章列表。
**Migration**: 用当前仓库中真实的同语言文章验证 `/[lang]/posts` 及文章详情。
