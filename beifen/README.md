# 书签管理系统 - Meteor React Ant Design

基于Meteor、React和Ant Design构建的现代化书签管理系统。

## 功能特点

- 用户认证和授权
- 书签添加、编辑、删除
- 书签分类管理(文件夹/标签)
- 书签搜索和过滤
- 书签分享功能
- 响应式设计
- 明/暗主题切换

## 开发环境设置

### 使用DevContainer(推荐)

本项目包含DevContainer配置，可以在Visual Studio Code中快速设置开发环境：

1. 安装Docker和Visual Studio Code
2. 在Visual Studio Code中安装Remote - Containers扩展
3. 克隆项目仓库
4. 在VS Code中打开项目文件夹
5. VS Code会提示"在容器中重新打开"，点击确认
6. 等待容器构建和项目初始化

### 手动设置

1. 安装Node.js (推荐v14+)
2. 安装Meteor:
   ```bash
   curl https://install.meteor.com/ | sh
   ```
3. 克隆项目仓库
4. 安装依赖:
   ```bash
   meteor npm install
   ```
5. 运行开发服务器:
   ```bash
   meteor
   ```

## 项目结构

```
/
│
├── client/                  # 客户端代码
│   ├── main.jsx            # 客户端入口点
│   └── main.html           # 主HTML模板
│
├── imports/                 # 客户端和服务器共享的代码
│   ├── api/                # 集合和方法定义
│   ├── startup/            # 客户端/服务器启动代码
│   ├── ui/                 # React组件
│   └── utils/              # 工具函数
│
├── public/                  # 静态资源
│
├── server/                  # 服务器代码
│   └── main.js             # 服务器入口点
│
├── .meteor/                 # Meteor特定文件
│
├── .devcontainer/          # DevContainer配置
│
└── package.json            # 项目依赖
```

## 安装依赖

```bash
meteor npm install --save react react-dom react-router-dom antd @ant-design/icons moment bcrypt
```

## 数据库设计

本项目使用MongoDB作为数据库，主要集合包括：
- Users - 用户信息
- Bookmarks - 书签数据
- Folders - 文件夹结构
- Tags - 标签管理

详细的数据模型请参考`docs/requirements.md`。

## 部署指南

### Meteor Up部署
1. 安装mup：`npm install -g mup`
2. 初始化mup配置：`mup init`
3. 编辑`mup.js`和`settings.json`配置文件
4. 设置服务器：`mup setup`
5. 部署应用：`mup deploy`

### Docker部署
1. 构建Docker镜像：`meteor build --directory ../build`
2. 创建Dockerfile
3. 构建并运行容器

## 贡献指南

1. Fork项目仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m '添加一些功能'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

## 许可证

MIT许可证 - 详见LICENSE文件