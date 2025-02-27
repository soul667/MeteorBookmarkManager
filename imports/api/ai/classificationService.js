import { Meteor } from 'meteor/meteor';
import { Folders } from '../folders/folders';
import { getAIClientForUser } from './aiServiceUtils';

export const ClassificationService = {
  // 分析内容并推荐合适的文件夹
  async suggestFolder(content, userId) {
    try {
      // 获取用户现有文件夹
      const userFolders = await Folders.find({ ownerId: userId }).fetch();
      
      // 如果用户没有文件夹，建议创建新文件夹
      if (!userFolders || userFolders.length === 0) {
        return await this.suggestNewFolder(content, userId);
      }
      
      // 获取AI客户端
      const { client, config } = await getAIClientForUser(userId);
      
      // 构建用户现有文件夹的描述
      const folderDescriptions = userFolders
        .map(folder => `- ${folder.name}`)
        .join('\n');
      
      // 构建内容的简洁描述
      const contentSummary = `
        标题: ${content.title || ''}
        描述: ${content.metaDescription || ''}
        内容摘要: ${content.mainContent ? content.mainContent.substring(0, 1000) + '...' : ''}
      `;
      
      // 使用AI服务判断内容所属的文件夹
      const response = await client.chat.completions.create({
        model: config.defaultModel,
        messages: [
          {
            role: "system",
            content: `你是一个智能分类助手。给定一个网页内容描述和用户现有的文件夹列表，你需要判断这个内容应该归入哪个文件夹。
            如果内容与现有文件夹都不匹配，回复"需要新文件夹"并建议一个合适的新文件夹名称。`
          },
          {
            role: "user",
            content: `以下是用户现有的文件夹列表:\n${folderDescriptions}\n\n以下是需要分类的内容:\n${contentSummary}\n\n请判断这个内容应该归入哪个已有文件夹，或者需要创建新文件夹。`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      });
      
      const result = response.choices[0].message.content.trim();
      
      // 检查是否建议新文件夹
      if (result.includes('需要新文件夹')) {
        // 提取建议的新文件夹名称
        let newFolderName = '';
        const match = result.match(/["']([^"']+)["']/);
        if (match) {
          newFolderName = match[1];
        } else {
          // 如果没有明确提取到名称，使用推荐新文件夹的方法
          const folderSuggestion = await this.suggestNewFolder(content, userId);
          newFolderName = folderSuggestion.name;
        }
        
        return {
          existingFolder: null,
          needsNewFolder: true,
          suggestedName: newFolderName
        };
      } else {
        // 尝试匹配结果与已有文件夹
        const folderNames = userFolders.map(f => f.name.toLowerCase());
        const matchedFolder = userFolders.find(folder => 
          result.toLowerCase().includes(folder.name.toLowerCase())
        );
        
        if (matchedFolder) {
          return {
            existingFolder: matchedFolder,
            needsNewFolder: false
          };
        } else {
          // 如果没有匹配到，建议第一个文件夹
          return {
            existingFolder: userFolders[0],
            needsNewFolder: false,
            confidence: 'low'
          };
        }
      }
    } catch (error) {
      console.error(`Folder suggestion error: ${error.message}`);
      throw new Meteor.Error('classification-error', `文件夹推荐失败: ${error.message}`);
    }
  },
  
  // 建议新文件夹名称
  async suggestNewFolder(content, userId) {
    try {
      // 获取AI客户端
      const { client, config } = await getAIClientForUser(userId);
      
      // 构建内容的简洁描述
      const contentSummary = `
        标题: ${content.title || ''}
        描述: ${content.metaDescription || ''}
        内容摘要: ${content.mainContent ? content.mainContent.substring(0, 1000) + '...' : ''}
      `;
      
      // 使用AI服务生成文件夹名称建议
      const response = await client.chat.completions.create({
        model: config.defaultModel,
        messages: [
          {
            role: "system",
            content: `你是一个智能分类助手。给定一个网页内容描述，你需要推荐一个简短且描述性强的文件夹名称用于归类该内容。
            名称应该是1-3个词，能准确反映内容的主要类别或主题。只返回文件夹名称，不要加任何其他说明。`
          },
          {
            role: "user",
            content: `以下是需要分类的内容:\n${contentSummary}\n\n请推荐一个适合的文件夹名称。`
          }
        ],
        temperature: 0.5,
        max_tokens: 50
      });
      
      const folderName = response.choices[0].message.content
        .trim()
        .replace(/^["']|["']$/g, ''); // 移除可能的引号
      
      return {
        name: folderName,
        needsNewFolder: true
      };
    } catch (error) {
      console.error(`New folder suggestion error: ${error.message}`);
      return { name: '未分类', needsNewFolder: true };
    }
  }
};

// 设置Meteor方法
Meteor.methods({
  async 'ai.suggestFolder'(content) {
    // 检查用户登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    return await ClassificationService.suggestFolder(content, this.userId);
  },
  
  async 'ai.suggestNewFolder'(content) {
    // 检查用户登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    return await ClassificationService.suggestNewFolder(content, this.userId);
  }
});
