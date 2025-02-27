// 创建一个新的工具文件，用于获取用户的AI模型配置并创建相应的客户端

import { Meteor } from 'meteor/meteor';
import OpenAI from 'openai';

// 获取用户选择的活跃AI模型配置
export const getActiveModelConfig = async (userId) => {
  if (!userId) {
    throw new Error('需要用户ID');
  }
  
  return new Promise((resolve, reject) => {
    Meteor.call('users.getAIModels', (error, models) => {
      if (error) {
        reject(error);
        return;
      }
      
      // 寻找默认或第一个活跃的模型
      const defaultModel = models.find(m => m.isDefault && m.isActive);
      const anyActiveModel = models.find(m => m.isActive);
      
      if (defaultModel) {
        resolve(defaultModel);
      } else if (anyActiveModel) {
        resolve(anyActiveModel);
      } else {
        // 如果没有活跃模型，使用系统默认配置
        resolve({
          id: 'system-default',
          provider: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: '', // 使用服务器端的API密钥
          models: ['gpt-4', 'gpt-3.5-turbo'],
          defaultModel: 'gpt-3.5-turbo'
        });
      }
    });
  });
};

// 创建适当的AI客户端
export const createAIClient = (modelConfig) => {
  switch (modelConfig.provider) {
    case 'openai':
      return new OpenAI({
        apiKey: modelConfig.apiKey || Meteor.settings.public.useSystemApi ? undefined : null,
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
            throw new Error('Anthropic API未实现');
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
                  throw new Error(`HTTP error: ${response.status}`);
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
                throw new Error(`Ollama API error: ${error.message}`);
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
      throw new Error(`不支持的AI提供商: ${modelConfig.provider}`);
  }
};

// 使用用户配置创建AI客户端
export const getAIClientForUser = async (userId) => {
  const modelConfig = await getActiveModelConfig(userId);
  return {
    client: createAIClient(modelConfig),
    config: modelConfig
  };
};