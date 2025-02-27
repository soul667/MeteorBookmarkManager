import { Meteor } from 'meteor/meteor';
import { Bookmarks } from '../bookmarks/bookmarks';
import { vectorSimilarity } from '../../utils/vectorOps';
import { getAIClientForUser } from './aiServiceUtils';

export const RelatedContentService = {
  // 计算两个书签内容的相似度
  calculateSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB || !Array.isArray(vectorA) || !Array.isArray(vectorB)) {
      return 0;
    }
    
    try {
      return vectorSimilarity(vectorA, vectorB);
    } catch (error) {
      console.error(`Vector similarity calculation error: ${error.message}`);
      return 0;
    }
  },
  
  // 获取与给定书签相似的书签列表
  async findSimilarBookmarks(bookmarkId, userId, limit = 5) {
    try {
      // 获取目标书签
      const targetBookmark = await Bookmarks.findOne({ _id: bookmarkId, ownerId: userId });
      if (!targetBookmark || !targetBookmark.aiGenerated || !targetBookmark.aiGenerated.contentVector) {
        throw new Meteor.Error('invalid-bookmark', '目标书签不存在或未进行AI分析');
      }
      
      // 获取用户所有其他书签
      const allBookmarks = await Bookmarks.find({
        ownerId: userId,
        _id: { $ne: bookmarkId },
        'aiGenerated.contentVector': { $exists: true }
      }).fetch();
      
      // 计算相似度
      const similarityResults = allBookmarks.map(bookmark => {
        const similarity = this.calculateSimilarity(
          targetBookmark.aiGenerated.contentVector,
          bookmark.aiGenerated.contentVector
        );
        
        return {
          bookmark,
          similarity
        };
      });
      
      // 按相似度排序并限制结果数量
      return similarityResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(result => ({
          ...result.bookmark,
          similarityScore: result.similarity
        }));
    } catch (error) {
      console.error(`Similar bookmarks search error: ${error.message}`);
      throw new Meteor.Error('similarity-search-error', `查找相似书签失败: ${error.message}`);
    }
  },
  
  // 生成书签内容向量（用于相似度计算）
  async generateContentVector(text, userId) {
    if (!userId) {
      throw new Meteor.Error('not-authorized', '需要用户ID');
    }

    try {
      // 获取用户的AI客户端
      const { client, config } = await getAIClientForUser(userId);
      
      const response = await client.embeddings.create({
        model: "text-embedding-ada-002", // 保持使用ada-002作为嵌入模型
        input: text.substring(0, 8000) // 限制输入长度
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error(`Vector generation error: ${error.message}`);
      throw new Meteor.Error('vector-error', `内容向量生成失败: ${error.message}`);
    }
  }
};

// 设置Meteor方法
Meteor.methods({
  async 'ai.findSimilarBookmarks'(bookmarkId, limit = 5) {
    // 检查用户登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    return await RelatedContentService.findSimilarBookmarks(bookmarkId, this.userId, limit);
  },

  async 'ai.generateContentVector'(text) {
    // 检查用户登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }

    return await RelatedContentService.generateContentVector(text, this.userId);
  }
});
