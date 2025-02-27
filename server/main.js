import { Meteor } from 'meteor/meteor';
import { LinksCollection } from '/imports/api/links';
import { MongoInternals } from 'meteor/mongo';
import './accounts.js';
import './email-verification.js';  // 导入邮箱验证模块
import '../imports/api/bookmarks/bookmarks';
import '../imports/api/folders/folders';

// 导入AI服务
import '../imports/api/ai/aiServiceUtils';
import '../imports/api/ai/summaryService';
import '../imports/api/ai/tagSuggestionService';
import '../imports/api/ai/classificationService';
import '../imports/api/ai/relatedContentService';

// 导入用户方法
import './methods/userMethods';

async function insertLink({ title, url }) {
  await LinksCollection.insertAsync({ title, url, createdAt: new Date() });
}

Meteor.startup(async () => {
  if (Meteor.isDevelopment) {
    process.env.METEOR_LOG = 'debug';
  }
  
  // 检查并加载配置
  if (!Meteor.settings || !Meteor.settings.private) {
    console.warn('警告: 请确保使用 --settings settings.json 启动应用');
  }

  // 配置邮件发送服务
  if (Meteor.settings.private?.MAIL_URL) {
    process.env.MAIL_URL = Meteor.settings.private.MAIL_URL;
    console.log('邮件服务已配置');
  } else {
    console.warn('警告: 未配置MAIL_URL，邮件功能将不可用');
  }
  
  // 检查数据库连接
  try {
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    const status = await db.admin().serverStatus();
    console.log('MongoDB连接状态: 正常');
    console.log('数据库版本:', status.version);
    const userCount = await Meteor.users.find().countAsync();
    console.log('用户集合状态: 共有', userCount, '个用户');
  } catch (error) {
    console.error('数据库连接检查失败:', error.message);
  }
  
  // 初始化示例数据
  if (await LinksCollection.find().countAsync() === 0) {
    await insertLink({
      title: 'Do the Tutorial',
      url: 'https://www.meteor.com/tutorials/react/creating-an-app',
    });

    await insertLink({
      title: 'Follow the Guide',
      url: 'https://guide.meteor.com',
    });

    await insertLink({
      title: 'Read the Docs',
      url: 'https://docs.meteor.com',
    });

    await insertLink({
      title: 'Discussions',
      url: 'https://forums.meteor.com',
    });
  }

  // 发布链接集合
  Meteor.publish("links", function () {
    return LinksCollection.find();
  });
  
  console.log('服务器启动完成');
});
