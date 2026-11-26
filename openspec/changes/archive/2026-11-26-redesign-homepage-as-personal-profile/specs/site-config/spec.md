# Spec Delta

## ADDED Requirements

### Requirement: 精选文章配置

系统 SHALL 从 `content/site.yaml` 的可选字段 `featuredPosts` 读取有序的 slug 列表。每项 MUST 是合法且唯一的文章 slug。

#### Scenario: 配置精选文章

- **WHEN** 作者调整 `featuredPosts` 后重新构建
- **THEN** 中英文首页使用同一份新顺序；省略字段或提供空数组时均不展示精选栏目

#### Scenario: 配置值无效

- **WHEN** 字段类型错误、条目不符合文章 slug 格式或同一 slug 出现多次
- **THEN** 配置加载失败，错误指明 `featuredPosts`

### Requirement: 公开个人名片配置

系统 SHALL 在 `content/site.yaml` 的 `profile` 中配置公开显示名 `displayName` 和合作邮箱 `email`，初始值分别为 `Ruixe` 与 `RuixeWolf@outlook.com`。加载配置时 MUST 校验显示名为非空字符串且邮箱为单一有效的邮箱地址，配置不合法时 MUST 报告对应字段。名片 SHALL 使用该邮箱配置生成可见地址与邮件链接。

#### Scenario: 读取现有名片配置

- **WHEN** 站点使用当前配置构建并渲染任一语言首页
- **THEN** 首页主标题显示 Ruixe，邮箱链接显示 `RuixeWolf@outlook.com` 并指向 `mailto:RuixeWolf@outlook.com`

#### Scenario: 从配置更换合作邮箱

- **WHEN** 管理者仅修改 `profile.email` 为另一个有效地址并重新构建发布
- **THEN** 两种语言的名片同时显示新地址，邮件链接也指向该新地址

#### Scenario: 拒绝无效资料

- **WHEN** 站点配置缺少显示名或邮箱，或者配置值不符合对应字段要求
- **THEN** 配置加载失败，错误包含相应的字段路径
