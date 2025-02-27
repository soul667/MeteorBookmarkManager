import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

export const Bookmarks = new Mongo.Collection('bookmarks');

// 定义数据模式（仅用于文档目的，Meteor不强制执行模式）
const BookmarkSchema = {
  title: String,
  url: String,
  description: String,
  thumbnail: Match.Maybe(String),
  createdAt: Date,
  updatedAt: Date,
  lastVisitedAt: Match.Maybe(Date),
  visitCount: Number,
  isPublic: Boolean,
  ownerId: String,
  folderId: Match.Maybe(String),
  tags: [String],
  aiGenerated: Match.Maybe({
    summary: Match.Maybe(String),
    suggestedTags: Match.Maybe([String]),
    contentVector: Match.Maybe([Number]),
    keyPhrases: Match.Maybe([String]),
    categories: Match.Maybe([String]),
    lastAnalyzed: Match.Maybe(Date),
    enabled: Boolean
  }),
  customIcon: Match.Maybe(String)
};

// 设置索引
if (Meteor.isServer) {
  Meteor.startup(() => {
    // 确保索引存在（性能优化）
    Bookmarks.createIndex({ ownerId: 1 });
    Bookmarks.createIndex({ url: 1, ownerId: 1 }, { unique: true });
    Bookmarks.createIndex({ tags: 1 });
    Bookmarks.createIndex({ folderId: 1 });
    Bookmarks.createIndex({ isPublic: 1 });
    Bookmarks.createIndex({ createdAt: -1 });
  });
}

// 定义方法
Meteor.methods({
  'bookmarks.insert'(bookmarkData) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证数据
    check(bookmarkData, {
      title: String,
      url: String,
      description: Match.Maybe(String),
      folderId: Match.Maybe(String),
      tags: Match.Maybe([String]),
      isPublic: Match.Maybe(Boolean),
      aiGenerated: Match.Maybe(Object),
      customIcon: Match.Maybe(String)
    });
    
    // 检查URL是否已存在
    const existingBookmark = Bookmarks.findOne({ 
      url: bookmarkData.url, 
      ownerId: this.userId 
    });
    
    if (existingBookmark) {
      throw new Meteor.Error('duplicate-bookmark', '此URL已收藏');
    }
    
    // 创建书签对象
    const bookmark = {
      ...bookmarkData,
      description: bookmarkData.description || '',
      tags: bookmarkData.tags || [],
      isPublic: bookmarkData.isPublic || false,
      ownerId: this.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      visitCount: 0
    };
    
    // 插入数据库
    return Bookmarks.insert(bookmark);
  },
  
  'bookmarks.update'(bookmarkId, bookmarkData) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证数据
    check(bookmarkId, String);
    check(bookmarkData, {
      title: Match.Maybe(String),
      url: Match.Maybe(String),
      description: Match.Maybe(String),
      folderId: Match.Maybe(String),
      tags: Match.Maybe([String]),
      isPublic: Match.Maybe(Boolean),
      aiGenerated: Match.Maybe(Object),
      customIcon: Match.Maybe(String)
    });
    
    // 确保用户拥有此书签
    const bookmark = Bookmarks.findOne(bookmarkId);
    if (!bookmark) {
      throw new Meteor.Error('bookmark-not-found', '书签不存在');
    }
    
    if (bookmark.ownerId !== this.userId) {
      throw new Meteor.Error('not-authorized', '无权修改此书签');
    }
    
    // 如果URL被修改，检查是否与其他书签冲突
    if (bookmarkData.url && bookmarkData.url !== bookmark.url) {
      const existingBookmark = Bookmarks.findOne({ 
        url: bookmarkData.url, 
        ownerId: this.userId,
        _id: { $ne: bookmarkId }
      });
      
      if (existingBookmark) {
        throw new Meteor.Error('duplicate-bookmark', '此URL已收藏');
      }
    }
    
    // 更新书签
    Bookmarks.update(bookmarkId, { 
      $set: { 
        ...bookmarkData,
        updatedAt: new Date() 
      } 
    });
    
    return bookmarkId;
  },
  
  'bookmarks.remove'(bookmarkId) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证ID
    check(bookmarkId, String);
    
    // 确保用户拥有此书签
    const bookmark = Bookmarks.findOne(bookmarkId);
    if (!bookmark) {
      throw new Meteor.Error('bookmark-not-found', '书签不存在');
    }
    
    if (bookmark.ownerId !== this.userId) {
      throw new Meteor.Error('not-authorized', '无权删除此书签');
    }
    
    // 删除书签
    Bookmarks.remove(bookmarkId);
  },
  
  'bookmarks.recordVisit'(bookmarkId) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证ID
    check(bookmarkId, String);
    
    // 记录访问
    Bookmarks.update(
      { _id: bookmarkId, ownerId: this.userId },
      { 
        $inc: { visitCount: 1 },
        $set: { lastVisitedAt: new Date() }
      }
    );
  }
});

// 发布
if (Meteor.isServer) {
  // 发布用户的书签
  Meteor.publish('bookmarks.user', function(options = {}) {
    if (!this.userId) {
      return this.ready();
    }
    
    const { folderId, tags, search, sort, limit } = options;
    const query = { ownerId: this.userId };
    const sortOptions = sort || { createdAt: -1 };
    const limitOption = limit || 100;
    
    // 文件夹过滤
    if (folderId) {
      query.folderId = folderId;
    }
    
    // 标签过滤
    if (tags && tags.length > 0) {
      query.tags = { $all: tags };
    }
    
    // 搜索
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { url: searchRegex },
        { tags: searchRegex }
      ];
    }
    
    return Bookmarks.find(query, { 
      sort: sortOptions,
      limit: limitOption 
    });
  });
  
  // 发布公开书签
  Meteor.publish('bookmarks.public', function(options = {}) {
    const { search, sort, limit } = options;
    const query = { isPublic: true };
    const sortOptions = sort || { createdAt: -1 };
    const limitOption = limit || 50;
    
    // 搜索
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { url: searchRegex },
        { tags: searchRegex }
      ];
    }
    
    return Bookmarks.find(query, { 
      sort: sortOptions,
      limit: limitOption 
    });
  });
  
  // 发布单个书签的详情
  Meteor.publish('bookmarks.single', function(bookmarkId) {
    check(bookmarkId, String);
    
    const bookmark = Bookmarks.findOne(bookmarkId);
    if (!bookmark) {
      return this.ready();
    }
    
    // 只有拥有者或公开书签可见
    if (bookmark.ownerId === this.userId || bookmark.isPublic) {
      return Bookmarks.find({ _id: bookmarkId });
    }
    
    return this.ready();
  });
}