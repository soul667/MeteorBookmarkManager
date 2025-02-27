import React, { useState, useEffect } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { 
  List, Card, Tag, Space, Typography, Button, Empty, 
  Tooltip, Dropdown, Menu, Input, Skeleton, message 
} from 'antd';
import { 
  LinkOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, ShareAltOutlined, MoreOutlined,
  TagOutlined, FolderOutlined, RobotOutlined
} from '@ant-design/icons';
import { Bookmarks } from '../../api/bookmarks/bookmarks';
import { Folders } from '../../api/folders/folders';
import moment from 'moment';

const { Text, Title, Paragraph } = Typography;
const { Search } = Input;

const BookmarkList = ({ 
  loading, 
  bookmarks, 
  folders, 
  onEdit, 
  onDelete, 
  filter = {} 
}) => {
  const [searchText, setSearchText] = useState('');
  
  // 筛选书签
  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (!searchText) return true;
    
    const searchRegex = new RegExp(searchText, 'i');
    return (
      searchRegex.test(bookmark.title) ||
      searchRegex.test(bookmark.url) ||
      searchRegex.test(bookmark.description) ||
      bookmark.tags.some(tag => searchRegex.test(tag))
    );
  });

  // 获取文件夹名称
  const getFolderName = (folderId) => {
    if (!folderId) return '未分类';
    const folder = folders.find(f => f._id === folderId);
    return folder ? folder.name : '未知文件夹';
  };
  
  // 访问书签
  const visitBookmark = (bookmarkId, url) => {
    // 记录访问
    Meteor.call('bookmarks.recordVisit', bookmarkId, (error) => {
      if (error) {
        console.error("访问记录错误", error);
      }
    });
    
    // 在新窗口打开链接
    window.open(url, '_blank');
  };
  
  // 相似书签查询
  const findSimilarBookmarks = (bookmarkId) => {
    Meteor.call('ai.findSimilarBookmarks', bookmarkId, 5, (error, result) => {
      if (error) {
        message.error(`查找相似书签失败: ${error.reason || error.message}`);
        console.error("相似书签查询错误", error);
      } else {
        // 此处可以显示相似书签结果，例如在模态框中
        // 简化起见，我们只显示一个消息
        message.info(`找到 ${result.length} 个相似书签`);
        console.log("相似书签:", result);
      }
    });
  };
  
  // 创建书签项的下拉菜单
  const getBookmarkMenu = (bookmark) => (
    <Menu>
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => onEdit(bookmark)}>
        编辑
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={() => onDelete(bookmark._id)} danger>
        删除
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="similar" icon={<RobotOutlined />} onClick={() => findSimilarBookmarks(bookmark._id)}>
        查找相似内容
      </Menu.Item>
    </Menu>
  );

  // 渲染书签列表项
  const renderBookmarkItem = (bookmark) => (
    <List.Item>
      <Card 
        hoverable 
        style={{ width: '100%' }}
        actions={[
          <Tooltip title="访问链接">
            <Button 
              type="link" 
              icon={<LinkOutlined />} 
              onClick={() => visitBookmark(bookmark._id, bookmark.url)}
            />
          </Tooltip>,
          <Tooltip title="编辑">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => onEdit(bookmark)}
            />
          </Tooltip>,
          <Dropdown overlay={getBookmarkMenu(bookmark)} trigger={['click']}>
            <Button type="link" icon={<MoreOutlined />} />
          </Dropdown>
        ]}
      >
        <div style={{ display: 'flex' }}>
          {bookmark.thumbnail && (
            <div style={{ marginRight: 16 }}>
              <img 
                src={bookmark.thumbnail} 
                alt={bookmark.title}
                style={{ width: 120, height: 80, objectFit: 'cover' }}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
          
          <div style={{ flex: 1 }}>
            <Title level={5} ellipsis style={{ marginBottom: 8 }}>
              <a 
                href={bookmark.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault(); 
                  visitBookmark(bookmark._id, bookmark.url);
                }}
              >
                {bookmark.title}
              </a>
            </Title>
            
            <Paragraph type="secondary" ellipsis={{ rows: 1 }} style={{ fontSize: 12 }}>
              {bookmark.url}
            </Paragraph>
            
            {bookmark.description && (
              <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                {bookmark.description}
              </Paragraph>
            )}
            
            {bookmark.aiGenerated?.summary && !bookmark.description && (
              <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                <RobotOutlined style={{ marginRight: 4 }} />
                {bookmark.aiGenerated.summary}
              </Paragraph>
            )}
            
            <Space wrap>
              <Tooltip title="文件夹">
                <Tag icon={<FolderOutlined />} color="blue">
                  {getFolderName(bookmark.folderId)}
                </Tag>
              </Tooltip>
              
              {bookmark.tags.map(tag => (
                <Tag key={tag} icon={<TagOutlined />}>
                  {tag}
                </Tag>
              ))}
            </Space>
            
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
              <Space split="·">
                <span>
                  添加于 {moment(bookmark.createdAt).format('YYYY-MM-DD')}
                </span>
                {bookmark.visitCount > 0 && (
                  <span>
                    <EyeOutlined /> {bookmark.visitCount} 次访问
                  </span>
                )}
                {bookmark.isPublic && (
                  <span>
                    <ShareAltOutlined /> 公开
                  </span>
                )}
              </Space>
            </div>
          </div>
        </div>
      </Card>
    </List.Item>
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索书签..."
          allowClear
          enterButton
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      
      <List
        grid={{ 
          gutter: 16,
          xs: 1,
          sm: 1,
          md: 1,
          lg: 1,
          xl: 1,
          xxl: 2,
        }}
        dataSource={filteredBookmarks}
        renderItem={renderBookmarkItem}
        loading={loading}
        pagination={{
          onChange: page => {
            window.scrollTo(0, 0);
          },
          pageSize: 10,
        }}
        locale={{
          emptyText: <Empty description="暂无书签" />
        }}
      />
    </div>
  );
};

export default withTracker(({ filter = {} }) => {
  // 订阅书签数据
  const bookmarksHandle = Meteor.subscribe('bookmarks.user', filter);
  const foldersHandle = Meteor.subscribe('folders.user');
  
  const loading = !bookmarksHandle.ready() || !foldersHandle.ready();
  
  // 构建查询条件
  const query = {};
  if (filter.folderId) {
    query.folderId = filter.folderId;
  }
  if (filter.tags && filter.tags.length > 0) {
    query.tags = { $all: filter.tags };
  }
  if (filter.search) {
    const searchRegex = new RegExp(filter.search, 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { url: searchRegex },
      { tags: searchRegex }
    ];
  }
  
  // 获取查询结果
  const bookmarks = Bookmarks.find(
    query,
    { sort: { createdAt: -1 } }
  ).fetch();
  
  const folders = Folders.find({}).fetch();
  
  return {
    loading,
    bookmarks,
    folders
  };
})(BookmarkList);