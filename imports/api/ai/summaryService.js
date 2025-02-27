// 引入必要的依赖
import { Meteor } from 'meteor/meteor';
import { getAIClientForUser } from './aiServiceUtils';

// 从URL获取页面内容
async function fetchPageContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    throw new Meteor.Error('fetch-error', `获取页面内容失败: ${error.message}`);
  }
}

// 从HTML中提取主要内容
function extractMainContent(html) {
  try {
    // 这里使用一个简单的实现，实际项目中可能需要更复杂的解析
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
    const metaDescription = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || '';
    
    // 移除scripts, styles, 和其他不需要的标签
    let mainContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      title,
      metaDescription,
      mainContent
    };
  } catch (error) {
    throw new Meteor.Error('extraction-error', `内容提取失败: ${error.message}`);
  }
}

// 使用OpenAI生成摘要
async function generateSummary(content, length = "medium", userId) {
  if (!userId) {
    throw new Meteor.Error('not-authorized', '需要用户ID');
  }

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
        throw new Meteor.Error('invalid-provider', `不支持的AI提供商: ${config.provider}`);
    }
  } catch (error) {
    console.error(`AI API error: ${error.message}`);
    throw new Meteor.Error('ai-error', `AI摘要生成失败: ${error.message}`);
  }
}

// 导出SummaryService对象
export const SummaryService = {
  async summarizeUrl(url, options = { length: "medium" }, userId) {
    try {
      const html = await fetchPageContent(url);
      const content = extractMainContent(html);
      const summary = await generateSummary(content, options.length, userId);
      
      return {
        summary,
        originalContent: content
      };
    } catch (error) {
      throw new Meteor.Error('summarize-error', `URL摘要生成失败: ${error.message}`);
    }
  }
};

// 设置Meteor方法
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
