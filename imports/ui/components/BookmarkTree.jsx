import React, { useMemo } from 'react';
import { Tree, Typography, Space, Button, Dropdown, Menu } from 'antd';
import { FolderOutlined, LinkOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

const BookmarkTree = ({ bookmarks = [], folders = [], loading = false, onEdit }) => {
  const treeData = useMemo(() => {
    const folderMap = new Map(folders.map(f => [f._id, { ...f, bookmarks: [] }]));
    const rootBookmarks = [];

    bookmarks.forEach(bookmark => {
      if (bookmark.folderId && folderMap.has(bookmark.folderId)) {
        folderMap.get(bookmark.folderId).bookmarks.push(bookmark);
      } else {
        rootBookmarks.push(bookmark);
      }
    });

    const folderNodes = Array.from(folderMap.values()).map(folder => ({
      key: `folder-${folder._id}`,
      title: (
        <Space>
          <FolderOutlined />
          <Text>{folder.name}</Text>
        </Space>
      ),
      children: folder.bookmarks.map(bookmark => ({
        key: bookmark._id,
        title: (
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text>{bookmark.title}</Text>
            <Space>
              <Button 
                type="link" 
                icon={<LinkOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(bookmark.url, '_blank');
                }}
              />
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(bookmark);
                }}
              />
            </Space>
          </Space>
        ),
        isLeaf: true
      }))
    }));

    const rootBookmarkNodes = rootBookmarks.map(bookmark => ({
      key: bookmark._id,
      title: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{bookmark.title}</Text>
          <Space>
            <Button 
              type="link" 
              icon={<LinkOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                window.open(bookmark.url, '_blank');
              }}
            />
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(bookmark);
              }}
            />
          </Space>
        </Space>
      ),
      isLeaf: true
    }));

    return [...folderNodes, ...rootBookmarkNodes];
  }, [bookmarks, folders, onEdit]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <Tree
      showLine
      defaultExpandAll
      treeData={treeData}
      selectable={false}
    />
  );
};

export default BookmarkTree;
