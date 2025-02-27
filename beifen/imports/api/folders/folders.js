import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

export const Folders = new Mongo.Collection('folders');

// 设置索引
if (Meteor.isServer) {
  Meteor.startup(() => {
    Folders.createIndex({ ownerId: 1 });
    Folders.createIndex({ parentId: 1 });
  });
}

// 定义方法
Meteor.methods({
  'folders.insert'(folderData) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证数据
    check(folderData, {
      name: String,
      parentId: Match.Maybe(String),
      isPublic: Match.Maybe(Boolean),
      aiGenerated: Match.Maybe(Boolean),
      aiCategory: Match.Maybe(String)
    });
    
    // 检查同名文件夹
    if (folderData.parentId) {
      const existingFolder = Folders.findOne({
        name: folderData.name,
        parentId: folderData.parentId,
        ownerId: this.userId
      });
      
      if (existingFolder) {
        throw new Meteor.Error('duplicate-folder', '此文件夹已存在');
      }
    } else {
      const existingRootFolder = Folders.findOne({
        name: folderData.name,
        parentId: { $exists: false },
        ownerId: this.userId
      });
      
      if (existingRootFolder) {
        throw new Meteor.Error('duplicate-folder', '此文件夹已存在');
      }
    }
    
    // 如果指定了父文件夹，确保它存在且属于该用户
    if (folderData.parentId) {
      const parentFolder = Folders.findOne(folderData.parentId);
      if (!parentFolder) {
        throw new Meteor.Error('parent-not-found', '父文件夹不存在');
      }
      
      if (parentFolder.ownerId !== this.userId) {
        throw new Meteor.Error('not-authorized', '无权在此文件夹中创建');
      }
    }
    
    // 创建文件夹对象
    const folder = {
      ...folderData,
      isPublic: folderData.isPublic || false,
      ownerId: this.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 插入数据库
    return Folders.insert(folder);
  },
  
  'folders.update'(folderId, folderData) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证数据
    check(folderId, String);
    check(folderData, {
      name: Match.Maybe(String),
      parentId: Match.Maybe(String),
      isPublic: Match.Maybe(Boolean),
      aiCategory: Match.Maybe(String)
    });
    
    // 确保用户拥有此文件夹
    const folder = Folders.findOne(folderId);
    if (!folder) {
      throw new Meteor.Error('folder-not-found', '文件夹不存在');
    }
    
    if (folder.ownerId !== this.userId) {
      throw new Meteor.Error('not-authorized', '无权修改此文件夹');
    }
    
    // 检查周期引用
    if (folderData.parentId && this.checkCyclicReference(folderId, folderData.parentId)) {
      throw new Meteor.Error('cyclic-reference', '不能将文件夹移动到其子文件夹中');
    }
    
    // 更新文件夹
    Folders.update(folderId, { 
      $set: { 
        ...folderData,
        updatedAt: new Date() 
      } 
    });
    
    return folderId;
  },
  
  'folders.remove'(folderId) {
    // 检查用户是否登录
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', '用户未登录');
    }
    
    // 验证ID
    check(folderId, String);
    
    // 确保用户拥有此文件夹
    const folder = Folders.findOne(folderId);
    if (!folder) {
      throw new Meteor.Error('folder-not-found', '文件夹不存在');
    }
    
    if (folder.ownerId !== this.userId) {
      throw new Meteor.Error('not-authorized', '无权删除此文件夹');
    }
    
    // 检查是否有子文件夹
    const hasSubfolders = Folders.findOne({ parentId: folderId });
    if (hasSubfolders) {
      throw new Meteor.Error('has-subfolders', '请先删除子文件夹');
    }
    
    // 检查文件夹中是否有书签
    const { Bookmarks } = require('../bookmarks/bookmarks');
    const hasBookmarks = Bookmarks.findOne({ folderId: folderId });
    if (hasBookmarks) {
      throw new Meteor.Error('has-bookmarks', '请先移除或删除文件夹中的书签');
    }
    
    // 删除文件夹
    Folders.remove(folderId);
  },
  
  // 检查周期引用
  checkCyclicReference(folderId, newParentId) {
    let currentParentId = newParentId;
    
    while (currentParentId) {
      if (currentParentId === folderId) {
        return true;
      }
      
      const parent = Folders.findOne(currentParentId);
      if (!parent) {
        return false;
      }
      
      currentParentId = parent.parentId;
    }
    
    return false;
  }
});

// 发布
if (Meteor.isServer) {
  // 发布用户的文件夹
  Meteor.publish('folders.user', function() {
    if (!this.userId) {
      return this.ready();
    }
    
    return Folders.find({ ownerId: this.userId });
  });
  
  // 发布公开文件夹
  Meteor.publish('folders.public', function() {
    return Folders.find({ isPublic: true });
  });
  
  // 发布单个文件夹的详情
  Meteor.publish('folders.single', function(folderId) {
    check(folderId, String);
    
    const folder = Folders.findOne(folderId);
    if (!folder) {
      return this.ready();
    }
    
    // 只有拥有者或公开文件夹可见
    if (folder.ownerId === this.userId || folder.isPublic) {
      return Folders.find({ _id: folderId });
    }
    
    return this.ready();
  });
}