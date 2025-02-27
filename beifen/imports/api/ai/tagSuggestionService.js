import { Meteor } from 'meteor/meteor';
import OpenAI from 'openai';
import natural from 'natural';
import compromise from 'compromise';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: Meteor.settings.private.openai.apiKey,
});

// 初始化Natural库的TF-IDF
const TfIdf = natural.TfIdf;

export const TagSuggestionService = {
  // 使用OpenAI API生成标签建议
  async suggestTagsWithAI(content, existingTags = [], maxTags = 5) {
    try {
      // 准备内容
      const contentText = `标题: ${content.title || ''}\n描述: ${content.metaDescription || ''}\n内容: ${(content.mainContent || '').substring(0, 3000)}`;
      
      // 准备现有标签
      const existingTagsText = existingTags.length > 0 
        ? `用户现有的标签包括: ${existingTags.join(', ')}`
        : '用户目前没有使用任何标签。';

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `你是一个专业的内容分析专家，能够从网页内容中提取关键标签。请为提供的网页内容生成${maxTags}个最适合的标签。
            标签应当简洁（1-3个词），能准确反映内容主题，便于分类和搜索。
            请考虑用户现有的标签体系，可以复用合适的现有标签，也可以推荐新标签。
            返回格式：仅返回标签列表，每行一个标签。`
          },
          {
            role: "user",
            content: `请为以下网页内容推荐标签：\n\n${contentText}\n\n${existingTagsText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      });
      
      // 处理响应，分行获取标签
      const suggestedTagsText = response.choices[0].message.content.trim();
      const suggestedTags = suggestedTagsText
        .split('\n')
        .map(tag => tag.trim())
        .filter(tag => tag && !tag.startsWith('-') && !tag.match(/^[0-9]+\./))
        .slice(0, maxTags);
      
      return suggestedTags;
    } catch (error) {
      console.error(`AI tag suggestion error: ${error.message}`);
      // 如果AI服务失败，回退到本地方法
      return this.suggestTagsLocally(content, existingTags, maxTags);
    }
  },
  
  // 使用本地NLP库分析内容并提取标签
  suggestTagsLocally(content, existingTags = [], maxTags = 5) {
    try {
      // 合并内容为一个文本
      const text = `${content.title || ''} ${content.metaDescription || ''} ${content.mainContent || ''}`;
      
      // 使用Compromise库提取名词短语
      const doc = compromise(text);
      const nounPhrases = doc.nouns().out('array');
      
      // 使用TF-IDF计算关键词权重
      const tfidf = new TfIdf();
      tfidf.addDocument(text);
      
      // 获取高TF-IDF值的词语
      const terms = [];
      tfidf.listTerms(0).forEach(item => {
        terms.push({
          term: item.term,
          tfidf: item.tfidf
        });
      });
      
      // 合并名词短语和高权重词语
      const candidates = [...new Set([...nounPhrases, ...terms.map(t => t.term)])];
      
      // 过滤掉太短或太长的候选词
      const filteredCandidates = candidates
        .filter(term => term && term.length >= 3 && term.length <= 25)
        .filter(term => !existingTags.includes(term))
        .slice(0, maxTags);
      
      return filteredCandidates;
    } catch (error) {
      console.error(`Local tag suggestion error: ${error.message}`);
      return [];
    }
  }
};

// 设置Meteor方法
Meteor.methods({
  async 'ai.suggestTags'(content, existingTags = [], maxTags = 5) {
    // 检查用户登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    return await TagSuggestionService.suggestTagsWithAI(content, existingTags, maxTags);
  }
});