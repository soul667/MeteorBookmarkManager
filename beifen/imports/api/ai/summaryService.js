// 修改summaryService.js文件，更新生成摘要的方法，使用用户配置的模型

// 引入工具类
import { getAIClientForUser } from './aiServiceUtils';

// 使用OpenAI生成摘要 (修改现有函数)
async function generateSummary(content, length = "medium", userId) {
  try {
    const lengthPrompt = {
      short: "一个非常简短的摘要，不超过30个汉字。",
      medium: "一个中等长度的摘要，不超过100个汉字。",
      long: "一个详细的摘要，不超过200个汉字。"
    };
    
    // 获取用户配置的AI客户端
    const { client, config } = await getAIClientForUser(userId);
    const model = config.defaultModel;
    
    // 根据不同的提供商处理请求
    switch (config.provider) {
      case 'openai':
        const response = await client.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: `你是一个专业的内容摘要专家。请为提供的网页内容生成${lengthPrompt[length]}摘要应当捕捉内容的本质，语言清晰简洁。`
            },
            {
              role: "user",
              content: `请为以下网页内容生成摘要：\n\n标题: ${content.title}\n\n描述: ${content.metaDescription}\n\n正文内容: ${content.mainContent.substring(0, 5000)}`
            }
          ],
          temperature: 0.5,
          max_tokens: 500
        });
        
        return response.choices[0].message.content.trim();
        
      case 'anthropic':
        // 假设使用anthropic客户端
        const anthropicResponse = await client.messages.create({
          model: model,
          system: `你是一个专业的内容摘要专家。请为提供的网页内容生成${lengthPrompt[length]}`,
          messages: [
            {
              role: "user",
              content: `请为以下网页内容生成摘要：\n\n标题: ${content.title}\n\n描述: ${content.metaDescription}\n\n正文内容: ${content.mainContent.substring(0, 5000)}`
            }
          ],
          max_tokens: 500
        });
        
        return anthropicResponse.content[0].text;
        
      case 'local':
        // 使用本地Ollama API
        const localResponse = await client.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: `你是一个专业的内容摘要专家。请为提供的网页内容生成${lengthPrompt[length]}摘要应当捕捉内容的本质，语言清晰简洁。`
            },
            {
              role: "user",
              content: `请为以下网页内容生成摘要：\n\n标题: ${content.title}\n\n描述: ${content.metaDescription}\n\n正文内容: ${content.mainContent.substring(0, 2000)}`
            }
          ]
        });
        
        return localResponse.choices[0].message.content.trim();
        
      default:
        throw new Error(`不支持的AI提供商: ${config.provider}`);
    }
  } catch (error) {
    console.error(`AI API error: ${error.message}`);
    throw new Meteor.Error('openai-error', `AI摘要生成失败: ${error.message}`);
  }
}

// 更新SummaryService.summarizeUrl方法以接收userId参数
export const SummaryService = {
  async summarizeUrl(url, options = { length: "medium" }, userId) {
    const html = await fetchPageContent(url);
    const content = extractMainContent(html);
    const summary = await generateSummary(content, options.length, userId);
    const contentVector = await generateContentVector(`${content.title} ${content.metaDescription} ${content.mainContent.substring(0, 1000)}`, userId);
    
    return {
      summary,
      contentVector,
      originalContent: content
    };
  }
};

// 更新Meteor方法以传递userId
Meteor.methods({
  async 'ai.summarizeUrl'(url, options) {
    // 检查用户登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 检查URL格式
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      throw new Meteor.Error('invalid-url', '无效的URL');
    }
    
    return await SummaryService.summarizeUrl(url, options, this.userId);
  }
});