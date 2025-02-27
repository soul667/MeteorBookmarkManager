import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';

// 深度合并函数，用于正确合并嵌套对象
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

Meteor.methods({
  // 获取用户AI设置
  'users.getAISettings'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    const user = Meteor.users.findOne(this.userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', '用户不存在');
    }
    
    return user.profile?.aiSettings || {
      aiEnabled: true,
      summarizationEnabled: true,
      autoTaggingEnabled: true,
      autoClassificationEnabled: true,
      summarizationLength: 'medium',
      processingMode: 'add',
      suggestedTagsCount: 5
    };
  },
  
  // 更新用户AI设置
  'users.updateAISettings'(settings) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    check(settings, {
      aiEnabled: Boolean,
      summarizationEnabled: Match.Maybe(Boolean),
      autoTaggingEnabled: Match.Maybe(Boolean),
      autoClassificationEnabled: Match.Maybe(Boolean),
      summarizationLength: Match.Maybe(String),
      processingMode: Match.Maybe(String),
      suggestedTagsCount: Match.Maybe(Number),
      apiKey: Match.Maybe(String),
      apiModel: Match.Maybe(String),
      batchProcessingEnabled: Match.Maybe(Boolean)
    });
    
    Meteor.users.update(this.userId, {
      $set: {
        'profile.aiSettings': settings
      }
    });
    
    return true;
  },

  // 获取用户AI模型配置
  'users.getAIModels'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    const user = Meteor.users.findOne(this.userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', '用户不存在');
    }
    
    return user.profile?.aiModels || [{
      id: 'default-openai',
      name: 'OpenAI (默认)',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '', // 客户端应使用系统默认API
      models: ['gpt-4', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-3.5-turbo',
      isActive: true,
      isDefault: true
    }];
  },
  
  // 添加新的AI模型配置
  'users.addAIModel'(modelConfig) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    check(modelConfig, {
      name: String,
      provider: String,
      baseUrl: String,
      apiKey: String,
      models: [String],
      defaultModel: String
    });
    
    // 验证默认模型在模型列表中
    if (!modelConfig.models.includes(modelConfig.defaultModel)) {
      throw new Meteor.Error('invalid-model', '默认模型必须在模型列表中');
    }
    
    // 加密API密钥 (实际项目应该实现真正的加密)
    const encryptedApiKey = modelConfig.apiKey ? 
      encryptApiKey(modelConfig.apiKey, this.userId) : 
      modelConfig.apiKey;
    
    // 创建新模型配置
    const newModel = {
      id: Random.id(),
      ...modelConfig,
      apiKey: encryptedApiKey,
      isActive: true,
      isDefault: false,
      createdAt: new Date()
    };
    
    // 添加到用户配置
    Meteor.users.update(this.userId, {
      $push: {
        'profile.aiModels': newModel
      }
    });
    
    return newModel.id;
  },
  
  // 更新AI模型配置
  'users.updateAIModel'(modelId, modelConfig) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    check(modelId, String);
    check(modelConfig, {
      name: String,
      provider: String,
      baseUrl: String,
      apiKey: String,
      models: [String],
      defaultModel: String,
      isActive: Boolean
    });
    
    // 验证默认模型在模型列表中
    if (!modelConfig.models.includes(modelConfig.defaultModel)) {
      throw new Meteor.Error('invalid-model', '默认模型必须在模型列表中');
    }
    
    // 查找用户
    const user = Meteor.users.findOne(this.userId);
    if (!user || !user.profile || !user.profile.aiModels) {
      throw new Meteor.Error('model-not-found', '未找到模型配置');
    }
    
    // 查找并更新模型
    const aiModels = user.profile.aiModels;
    const modelIndex = aiModels.findIndex(model => model.id === modelId);
    
    if (modelIndex === -1) {
      throw new Meteor.Error('model-not-found', '未找到指定的模型配置');
    }
    
    // 处理API密钥 - 仅在有变更时更新
    if (modelConfig.apiKey && modelConfig.apiKey !== '••••••••') {
      modelConfig.apiKey = encryptApiKey(modelConfig.apiKey, this.userId);
    } else {
      // 保留原有API密钥
      modelConfig.apiKey = aiModels[modelIndex].apiKey;
    }
    
    // 更新模型 - 使用深度合并
    const updatedModel = deepMerge(aiModels[modelIndex], modelConfig);
    updatedModel.updatedAt = new Date();
    
    aiModels[modelIndex] = updatedModel;
    
    // 保存更新
    Meteor.users.update(this.userId, {
      $set: {
        'profile.aiModels': aiModels
      }
    });
    
    return true;
  },
  
  // 删除AI模型配置
  'users.deleteAIModel'(modelId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    check(modelId, String);
    
    // 查找用户
    const user = Meteor.users.findOne(this.userId);
    if (!user || !user.profile || !user.profile.aiModels) {
      throw new Meteor.Error('model-not-found', '未找到模型配置');
    }
    
    // 确保不是默认模型
    const model = user.profile.aiModels.find(m => m.id === modelId);
    if (!model) {
      throw new Meteor.Error('model-not-found', '未找到指定的模型配置');
    }
    
    if (model.isDefault) {
      throw new Meteor.Error('cannot-delete-default', '无法删除默认模型');
    }
    
    // 删除模型
    Meteor.users.update(this.userId, {
      $pull: {
        'profile.aiModels': { id: modelId }
      }
    });
    
    return true;
  },
  
  // 设置默认AI模型
  'users.setDefaultAIModel'(modelId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    check(modelId, String);
    
    // 查找用户
    const user = Meteor.users.findOne(this.userId);
    if (!user || !user.profile || !user.profile.aiModels) {
      throw new Meteor.Error('model-not-found', '未找到模型配置');
    }
    
    // 确保模型存在且已启用
    const modelExists = user.profile.aiModels.find(m => m.id === modelId && m.isActive);
    if (!modelExists) {
      throw new Meteor.Error('model-not-found', '未找到指定的有效模型配置');
    }
    
    // 更新所有模型的默认状态
    const updatedModels = user.profile.aiModels.map(model => ({
      ...model,
      isDefault: model.id === modelId
    }));
    
    // 保存更新
    Meteor.users.update(this.userId, {
      $set: {
        'profile.aiModels': updatedModels
      }
    });
    
    return true;
  },
  
  // 获取用户通用设置
  'users.getSettings'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    const user = Meteor.users.findOne(this.userId);
    if (!user) {
      throw new Meteor.Error('user-