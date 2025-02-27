import { Meteor } from 'meteor/meteor';
import OpenAI from 'openai';

// 获取用户选择的活跃AI模型配置
export const getActiveModelConfig = async (userId) => {
  if (!userId) {
    throw new Meteor.Error('not-authorized', '需要用户ID');
  }
  
  // 直接从数据库获取用户配置
  const user = Meteor.users.findOne(userId);
  if (!user) {
    throw new Meteor.Error('user-not-found', '用户不存在');
  }

  // 获取用户AI设置
  const aiSettings = user.profile?.aiSettings || {};
  
  // 检查是否启用AI功能
  if (!aiSettings.aiEnabled) {
    throw new Meteor.Error('ai-disabled', 'AI功能未启用');
  }

  // 检查API密钥
  if (!aiSettings.apiKey) {
    throw new Meteor.Error('api-key-required', '需要配置API密钥');
  }

  // 获取用户的AI模型配置
  const models = user.profile?.aiModels || [];
  const defaultModel = models.find(m => m.isDefault && m.isActive);
  const anyActiveModel = models.find(m => m.isActive);
  
  if (defaultModel) {
    return {
      ...defaultModel,
      apiKey: aiSettings.apiKey // 使用用户的API密钥
    };
  } else if (anyActiveModel) {
    return {
      ...anyActiveModel,
      apiKey: aiSettings.apiKey // 使用用户的API密钥
    };
  } else {
    // 如果没有配置模型，使用默认配置
    return {
      id: 'default-openai',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: aiSettings.apiKey,
      models: ['gpt-4', 'gpt-3.5-turbo'],
      defaultModel: aiSettings.apiModel || 'gpt-3.5-turbo',
      isActive: true,
      isDefault: true
    };
  }
};

// 创建适当的AI客户端
export const createAIClient = (modelConfig) => {
  if (!modelConfig.apiKey) {
    throw new Meteor.Error('api-key-required', '需要配置API密钥');
  }

  switch (modelConfig.provider) {
    case 'openai':
      return new OpenAI({
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseUrl
      });
    
    case 'anthropic':
      // 这里需要安装anthropic库
      // 简化起见，这里返回一个模拟对象
      return {
        provider: 'anthropic',
        baseUrl: modelConfig.baseUrl,
        apiKey: modelConfig.apiKey,
        // 具体实现需要根据anthropic库的API
        messages: {
          create: async (params) => {
            // 实际实现会调用anthropic API
            throw new Meteor.Error('not-implemented', 'Anthropic API未实现');
          }
        }
      };
    
    case 'local':
      // 为本地模型返回一个简单的客户端
      return {
        provider: 'local',
        baseUrl: modelConfig.baseUrl,
        // 简单实现ollama兼容的API
        chat: {
          completions: {
            create: async (params) => {
              try {
                const response = await fetch(`${modelConfig.baseUrl}/chat`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: params.model,
                    messages: params.messages
                  })
                });
                
                if (!response.ok) {
                  throw new Meteor.Error('api-error', `HTTP error: ${response.status}`);
                }
                
                const data = await response.json();
                return {
                  choices: [
                    {
                      message: {
                        content: data.message?.content || ''
                      }
                    }
                  ]
                };
              } catch (error) {
                throw new Meteor.Error('api-error', `Ollama API error: ${error.message}`);
              }
            }
          }
        }
      };
    
    case 'custom':
      // 为自定义API返回一个通用客户端
      return {
        provider: 'custom',
        baseUrl: modelConfig.baseUrl,
        apiKey: modelConfig.apiKey,
        // 接口方法需要在使用时定义
      };
    
    default:
      throw new Meteor.Error('invalid-provider', `不支持的AI提供商: ${modelConfig.provider}`);
  }
};

// 使用用户配置创建AI客户端
export const getAIClientForUser = async (userId) => {
  try {
    const modelConfig = await getActiveModelConfig(userId);
    return {
      client: createAIClient(modelConfig),
      config: modelConfig
    };
  } catch (error) {
    throw new Meteor.Error('client-creation-failed', `创建AI客户端失败: ${error.message}`);
  }
};
