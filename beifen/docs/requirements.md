# 书签管理网站需求文档

## 项目概述

开发一个现代化的书签管理应用，允许用户保存、组织和分享网页书签。该应用将使用Meteor作为全栈框架，React作为前端库，Ant Design提供UI组件，并集成AI功能来增强用户体验。

## 技术栈

- **后端**: Meteor
- **前端**: React
- **UI库**: Ant Design (antd)
- **数据库**: MongoDB (由Meteor提供)
- **认证**: Meteor Accounts系统
- **AI服务**: OpenAI API, Natural, Compromise
- **网页抓取**: Cheerio, node-fetch

## 功能需求

### 用户管理
1. 用户注册和登录
2. 第三方登录(可选: Google, GitHub)
3. 用户资料管理
4. 密码重置功能

### 书签管理
1. 添加新书签(URL, 标题, 描述, 标签)
2. 编辑现有书签
3. 删除书签
4. 导入/导出书签(支持HTML格式)

### 书签组织
1. 创建和管理书签文件夹
2. 为书签添加标签
3. 按多种条件搜索(标题, URL, 标签, 文件夹)
4. 按不同字段排序(标题, 添加日期, 访问频率)

### 分享功能
1. 公开/私有书签设置
2. 生成分享链接
3. 社交媒体分享

### AI增强功能
1. **内容自动总结**
   - 从书签URL提取关键内容并生成概要
   - 提供不同长度的摘要选项

2. **智能标签推荐**
   - 基于网页内容自动推荐相关标签
   - 用户可接受或修改推荐标签

3. **智能分类**
   - 自动将书签归类到适当的文件夹
   - 推荐创建新的分类类别

4. **相关内容推荐**
   - 基于现有书签推荐相似内容
   - 发现用户书签集合中的知识联系

5. **内容聚类与可视化**
   - 以视觉方式展示书签之间的关联
   - 提供主题地图浏览功能

6. **定制化学习和改进**
   - 根据用户的选择和偏好调整AI建议
   - 随着使用时间增长提高推荐准确性

### 附加功能
1. 书签有效性检查
2. 网站缩略图生成
3. 访问统计
4. 阅读稍后功能

## 界面需求

### 总体设计
- 响应式布局，适配桌面和移动设备
- 明暗两种主题
- 左侧导航栏(文件夹/标签列表)
- 主内容区(书签列表/详情)

### AI功能界面
- AI摘要显示与编辑区域
- 标签推荐接口，支持一键采纳和修改
- 书签关联可视化界面
- AI设置面板，允许用户自定义AI行为

### 主要页面
1. **登录/注册页**
   - 表单验证
   - 记住登录状态选项

2. **主书签页**
   - 网格视图和列表视图切换
   - 搜索和筛选器
   - 书签卡片展示(标题, URL, 缩略图, AI摘要)

3. **书签详情页**
   - 书签全部信息
   - 编辑选项
   - 分享选项
   - 访问统计
   - AI生成摘要和分析

4. **智能视图页面**
   - 主题聚类视图
   - 书签关联网络图
   - 时间线视图

5. **用户设置页**
   - 个人信息设置
   - 应用偏好设置
   - AI功能配置
   - 导入/导出功能

## 数据模型

### User 模型
```javascript
{
  _id: String,
  username: String,
  emails: Array,
  profile: {
    name: String,
    avatar: String,
    preferences: Object,
    aiSettings: {
      summarizationEnabled: Boolean,
      autoTaggingEnabled: Boolean,
      autoClassificationEnabled: Boolean,
      summarizationLength: String // "short", "medium", "long"
    }
  }
}
```

### Bookmark 模型
```javascript
{
  _id: String,
  title: String,
  url: String,
  description: String,
  thumbnail: String,
  createdAt: Date,
  updatedAt: Date,
  lastVisitedAt: Date,
  visitCount: Number,
  isPublic: Boolean,
  ownerId: String,
  folderId: String,
  tags: [String],
  aiGenerated: {
    summary: String,
    suggestedTags: [String],
    contentVector: Array, // 向量表示，用于相似性搜索
    keyPhrases: [String],
    categories: [String],
    lastAnalyzed: Date
  }
}
```

### Folder 模型
```javascript
{
  _id: String,
  name: String,
  parentId: String,
  ownerId: String,
  createdAt: Date,
  updatedAt: Date,
  isPublic: Boolean,
  aiGenerated: Boolean, // 指示此文件夹是否为AI自动创建
  aiCategory: String // 对应的AI分类名称
}
```

### Content Vector 模型
```javascript
{
  _id: String,
  bookmarkId: String,
  ownerId: String,
  vector: Array, // 网页内容的向量表示
  createdAt: Date,
  updatedAt: Date
}
```

## AI接口设计

### 摘要生成API
- `/api/ai/summarize` - 根据URL或内容生成摘要

### 标签推荐API
- `/api/ai/suggest-tags` - 根据URL或内容推荐标签

### 智能分类API
- `/api/ai/categorize` - 对内容进行分类
- `/api/ai/suggest-folders` - 推荐合适的文件夹

### 相似内容API
- `/api/ai/similar-bookmarks` - 查找相似书签
- `/api/ai/related-content` - 发现相关内容

### 用户API
- `/api/users/ai-settings` - 获取/更新AI设置

## 性能要求
1. 页面加载时间不超过2秒
2. 支持至少1000个书签的流畅操作
3. 搜索结果实时显示
4. AI处理时间反馈，避免用户等待焦虑

## 安全要求
1. 所有API需要身份验证
2. 防止XSS和CSRF攻击
3. 敏感数据加密存储
4. AI API密钥安全存储
5. 用户数据不得未经许可用于训练模型

## 部署要求
1. 支持Docker容器化部署
2. 配置MongoDB数据库备份
3. 支持SSL/TLS加密
4. AI服务故障降级方案