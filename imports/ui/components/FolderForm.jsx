import React from 'react';
import { Form, Input, Button, Select, Switch, Space } from 'antd';
import { SaveOutlined, LoadingOutlined } from '@ant-design/icons';

const { Option } = Select;

const FolderForm = ({ initialValues = {}, folders = [], onSubmit, loading = false }) => {
  const [form] = Form.useForm();
  
  // 提交表单
  const handleSubmit = (values) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };
  
  // 获取可用的父文件夹（防止循环引用）
  const getAvailableParentFolders = () => {
    if (!initialValues._id) {
      return folders;
    }
    
    // 排除自己及其子文件夹
    const childFolderIds = getChildFolderIds(initialValues._id);
    return folders.filter(folder => 
      folder._id !== initialValues._id && !childFolderIds.includes(folder._id)
    );
  };
  
  // 获取所有子文件夹ID
  const getChildFolderIds = (folderId) => {
    const result = [];
    const directChildren = folders.filter(folder => folder.parentId === folderId);
    
    directChildren.forEach(child => {
      result.push(child._id);
      result.push(...getChildFolderIds(child._id));
    });
    
    return result;
  };
  
  const availableParentFolders = getAvailableParentFolders();
  
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="name"
        label="文件夹名称"
        rules={[{ required: true, message: '请输入文件夹名称!' }]}
      >
        <Input placeholder="文件夹名称" disabled={loading} />
      </Form.Item>
      
      <Form.Item
        name="parentId"
        label="父文件夹"
      >
        <Select 
          placeholder="选择父文件夹" 
          allowClear
          disabled={loading}
        >
          {availableParentFolders.map(folder => (
            <Option key={folder._id} value={folder._id}>
              {folder.name}
            </Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item
        name="isPublic"
        label="公开文件夹"
        valuePropName="checked"
        extra="公开文件夹中的书签将对其他用户可见"
      >
        <Switch disabled={loading} />
      </Form.Item>
      
      <Form.Item
        name="aiCategory"
        label="AI分类标签（可选）"
        extra="用于AI智能分类，可以留空"
      >
        <Input placeholder="例：技术、学习、工作、娱乐" disabled={loading} />
      </Form.Item>
      
      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button 
            type="primary" 
            htmlType="submit"
            icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
            loading={loading}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FolderForm;