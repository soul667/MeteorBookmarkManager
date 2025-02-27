import React, { useState } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { 
  List, Card, Typography, Button, Space, Modal,
  Menu, Dropdown, Tree, Empty, Tooltip, message 
} from 'antd';
import {
  FolderOutlined, FolderAddOutlined, EditOutlined, 
  DeleteOutlined, MoreOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { Folders } from '../../api/folders/folders';

const { Title, Text } = Typography;
const { confirm } = Modal;

const FolderList = ({ 
  loading, 
  folders, 
  onFolderClick, 
  onAddFolder,
  onEditFolder,
  activeFolder 
}) => {
  // 将文件夹数据转换为树形结构
  const buildFolderTree = (items, parentId = null) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        key: item._id,
        title: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>{item.name}</span>
            <Space>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditFolder(item);
                }}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(item._id);
                }}
              />
            </Space>
          </div>
        ),
        folder: item,
        children: buildFolderTree(items, item._id),
      }));
  };

  // 处理删除文件夹
  const handleDeleteFolder = (folderId) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '删除文件夹将无法恢复，确定要删除吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        Meteor.call('folders.remove', folderId, (error) => {
          if (error) {
            message.error(`删除文件夹失败: ${error.reason || error.message}`);
          } else {
            message.success('文件夹已删除');
          }
        });
      },
    });
  };

  // 生成树形菜单数据
  const treeData = buildFolderTree(folders);

  return (
    <Card 
      title={<><FolderOutlined /> 文件夹</>}
      extra={
        <Button 
          type="link" 
          icon={<FolderAddOutlined />} 
          onClick={onAddFolder}
        >
          新建文件夹
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          加载中...
        </div>
      ) : folders.length > 0 ? (
        <Tree
          treeData={treeData}
          defaultExpandAll
          selectedKeys={activeFolder ? [activeFolder] : []}
          onSelect={(selectedKeys) => {
            if (selectedKeys.length > 0 && onFolderClick) {
              onFolderClick(selectedKeys[0]);
            }
          }}
        />
      ) : (
        <Empty 
          description="暂无文件夹" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );
};

export default withTracker(() => {
  const foldersHandle = Meteor.subscribe('folders.user');
  const loading = !foldersHandle.ready();
  const folders = Folders.find({}, { sort: { name: 1 } }).fetch();
  
  return {
    loading,
    folders
  };
})(FolderList);