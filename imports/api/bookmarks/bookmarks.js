import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

export const Bookmarks = new Mongo.Collection('bookmarks');

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
  'bookmarks.insert': async function(bookmarkData) {
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
    const existingBookmark = await Bookmarks.findOneAsync({ 
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
    return await Bookmarks.insertAsync(bookmark);
  },
  
  'bookmarks.update': async function(bookmarkId, bookmarkData) {
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
    const bookmark = await Bookmarks.findOneAsync(bookmarkId);
    if (!bookmark) {
      throw new Meteor.Error('bookmark-not-found', '书签不存在');
    }
    
    if (bookmark.ownerId !== this.userId) {
      throw new Meteor.Error('not-authorized', '无权修改此书签');
    }
    
    // 如果URL被修改，检查是否与其他书签冲突
    if (bookmarkData.url && bookmarkData.url !== bookmark.url) {
      const existingBookmark = await Bookmarks.findOneAsync({ 
        url: bookmarkData.url, 
        ownerId: this.userId,
        _id: { $ne: bookmarkId }
      });
      
      if (existingBookmark) {
        throw new Meteor.Error('duplicate-bookmark', '此URL已收藏');
      }
    }
    
    // 更新书签
    await Bookmarks.updateAsync(bookmarkId, { 
      $set: { 
        ...bookmarkData,
        updatedAt: new Date() 
      } 
    });
    
    return bookmarkId;
  },
  
  'bookmarks.remove': async function(bookmarkId) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证ID
    check(bookmarkId, String);
    
    // 确保用户拥有此书签
    const bookmark = await Bookmarks.findOneAsync(bookmarkId);
    if (!bookmark) {
      throw new Meteor.Error('bookmark-not-found', '书签不存在');
    }
    
    if (bookmark.ownerId !== this.userId) {
      throw new Meteor.Error('not-authorized', '无权删除此书签');
    }
    
    // 删除书签
    await Bookmarks.removeAsync(bookmarkId);
  },
  
  'bookmarks.recordVisit': async function(bookmarkId) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证ID
    check(bookmarkId, String);
    
    // 记录访问
    await Bookmarks.updateAsync(
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
  Meteor.publish('bookmarks.user', function() {
    if (!this.userId) {
      return this.ready();
    }

    const query = { ownerId: this.userId };

    console.log('Publishing bookmarks with query:', query);
    
    return Bookmarks.find(query, { 
      sort: { createdAt: -1 }
    });
  });
  
  // 发布公开书签
  Meteor.publish('bookmarks.public', function() {
    return Bookmarks.find(
      { isPublic: true },
      { 
        sort: { createdAt: -1 },
        limit: 50 
      }
    );
  });
  
  // 发布单个书签的详情
  Meteor.publish('bookmarks.single', function(bookmarkId) {
    check(bookmarkId, String);
    
    return Bookmarks.find({
      $or: [
        { _id: bookmarkId, ownerId: this.userId },
        { _id: bookmarkId, isPublic: true }
      ]
    });
  });
}
