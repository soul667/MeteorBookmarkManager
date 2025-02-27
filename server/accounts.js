import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Folders } from '../imports/api/folders/folders';

// 配置账户创建选项
Accounts.config({
  forbidClientAccountCreation: false, // 允许客户端创建账户
});

// 配置账户验证规则
Accounts.validateNewUser((user) => {
  if (!user.username) {
    throw new Meteor.Error('invalid-username', '用户名不能为空');
  }
  if (user.username.length < 3) {
    throw new Meteor.Error('username-too-short', '用户名至少需要3个字符');
  }
  return true;
});

// 设置用户创建后的初始化
Accounts.onCreateUser((options, user) => {
  // 确保有profile字段
  user.profile = options.profile || {};
  
  // 设置默认设置
  user.profile.settings = {
    theme: 'light',
    language: 'zh',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    notifications: {
      enabled: true,
      sound: true,
      desktop: true
    }
  };
  
  // 设置AI默认设置
  user.profile.aiSettings = {
    aiEnabled: true,
    summarizationEnabled: true,
    autoTaggingEnabled: true,
    autoClassificationEnabled: true,
    summarizationLength: 'medium',
    processingMode: 'add',
    suggestedTagsCount: 5,
    apiModel: 'gpt-3.5-turbo'
  };
  
  // 返回用户对象
  return user;
});

// 用户创建后，创建默认文件夹
Accounts.onLogin(async ({ user }) => {
  if (!user) return;

  try {
    // 检查是否已有默认文件夹
    const hasDefaultFolders = await Folders.find({ ownerId: user._id }).countAsync();
    if (hasDefaultFolders === 0) {
      // 创建默认文件夹
      const defaultFolders = [
        { name: '收藏夹', icon: 'star' },
        { name: '稍后阅读', icon: 'clock' },
        { name: '工作', icon: 'laptop' },
        { name: '学习', icon: 'book' }
      ];

      for (const folder of defaultFolders) {
        await Folders.insertAsync({
          name: folder.name,
          icon: folder.icon,
          ownerId: user._id,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error('创建默认文件夹失败:', error);
  }
});

// 发布用户数据
Meteor.publish('userData', function() {
  if (!this.userId) {
    return this.ready();
  }

  return Meteor.users.find(
    { _id: this.userId },
    {
      fields: {
        'profile': 1,
        'username': 1,
        'emails': 1
      }
    }
  );
});
