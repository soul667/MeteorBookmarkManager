import { Meteor } from 'meteor/meteor';
import '../imports/api/bookmarks/bookmarks';
import '../imports/api/folders/folders';
import '../imports/api/ai/summaryService';
import '../imports/api/ai/tagSuggestionService';
import '../imports/api/ai/classificationService';
import '../imports/api/ai/relatedContentService';
import './methods/userMethods';

Meteor.startup(() => {
  // 服务器启动时代码
  console.log('智能书签管理系统服务器启动');
  
  // 确保设置文件中包含必要的配置
  if (!Meteor.settings.private?.openai?.apiKey) {
    console.warn('警告: 未配置OpenAI API密钥，AI功能将无法正常工作');
    console.warn('请在settings.json文件中配置private.openai.apiKey');
  }
  
  // 创建必要的索引
  const { Bookmarks } = require('../imports/api/bookmarks/bookmarks');
  const { Folders } = require('../imports/api/folders/folders');
  
  // 发布额外的用户数据
  Meteor.publish('userData', function() {
    if (!this.userId) {
      return this.ready();
    }
    
    return Meteor.users.find(
      { _id: this.userId },
      { fields: { 'profile': 1, 'username': 1, 'emails': 1 } }
    );
  });
  
  // 设置默认用户配置
  Meteor.users.find({ 'profile.aiSettings': { $exists: false } }).forEach(user => {
    Meteor.users.update(user._id, {
      $set: {
        'profile.aiSettings': {
          aiEnabled: true,
          summarizationEnabled: true,
          autoTaggingEnabled: true,
          autoClassificationEnabled: true,
          summarizationLength: 'medium',
          processingMode: 'add',
          suggestedTagsCount: 5
        }
      }
    });
  });
});