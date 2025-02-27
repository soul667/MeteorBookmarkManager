import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Table, Button, Modal, Space, Tag, Typography, 
  Card, Switch, Popconfirm, message
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  CheckCircleOutlined, StarOutlined, StarFilled
} from '@ant-design/icons';
import ModelConfigForm from './ModelConfigForm';

const { Title, Text } = Typography;

const AIModelManager = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  
  // 加载模型配置列表
  const loadModels = () => {
    setLoading(true);
    Meteor.call('users.getAIModels', (error, result) => {
      setLoading(false);
      if (error) {
        message.error(`加载模型配置失败: ${error.reason || error.message}`);
      } else {
        setModels(result || []);
      }
    });
  };
  
  useEffect(() => {
    loadModels();
  }, []);
  
  // 处理添加新模型配置
  const handleAddModel = (values) => {
    return new Promise((resolve, reject) => {
      Meteor.call('users.addAIModel', values, (error, result) => {
        if (error) {
          message.error(`添加模型配置失败: ${error.reason || error.message}`);
          reject(error);
        } else {
          message.success('模型配置添加成功');
          loadModels();
          setModalVisible(false);
          resolve(result);
        }
      });
    });
  };
  
  // 处理更新模型配置
  const handleUpdateModel = (values) => {
    if (!editingModel) return Promise.reject(new Error('No model to update'));
    
    return new Promise((resolve, reject) => {
      Meteor.call('users.updateAIModel', editingModel.id, values, (error, result) => {
        if (error) {
          message.error(`更新模型配置失败: ${error.reason || error.message}`);
          reject(error);
        } else {
          message.success('模型配置更新成功');
          loadModels();
          setModalVisible(false);
          setEditingModel(null);
          resolve(result);
        }
      });
    });
  };
  
  // 处理删除模型配置
  const handleDeleteModel = (modelId) => {
    Meteor.call('users.deleteAIModel', modelId, (error) => {
      if (error) {
        message.error(`删除模型配置失败: ${error.reason || error.message}`);
      } else {
        message.success('模型配置已删除');
        loadModels();
      }
    });
  };
  
  // 设置默认模型配置
  const handleSetDefaultModel = (modelId) => {
    Meteor.call('users.setDefaultAIModel', modelId, (error) => {
      if (error) {
        message.error(`设置默认模型失败: ${error.reason || error.message}`);
      } else {
        message.success('默认模型已更新');
        loadModels();
      }
    });
  };
  
  // 切换模型启用状态
  const toggleModelActive = (model, active) => {
    Meteor.call('users.updateAIModel', model.id, { ...model, isActive: active }, (error) => {
      if (error) {
        message.error(`更新模型状态失败: ${error.reason || error.message}`);
      } else {
        message.success(`模型已${active ? '启用' : '禁用'}`);
        loadModels();
      }
    });
  };
  
  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {text}
          {record.isDefault && <Tag color="gold" icon={<StarFilled />}>默认</Tag>}
        </Space>
      )
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: provider => {
        const providerColors = {
          openai: 'green',
          anthropic: 'blue',
          local: 'orange',
          custom: 'purple'
        };
        const displayNames = {
          openai: 'OpenAI',
          anthropic: 'Anthropic',
          local: '本地模型',
          custom: '自定义'
        };
        return <Tag color={providerColors[provider]}>{displayNames[provider] || provider}</Tag>;
      }
    },
    {
      title: '默认模型',
      dataIndex: 'defaultModel',
      key: 'defaultModel',
    },
    {
      title: '状态',
      key: 'isActive',
      dataIndex: 'isActive',
      render: (active, record) => (
        <Switch
          checkedChildren="已启用"
          unCheckedChildren="已禁用"
          checked={active}
          onChange={(checked) => toggleModelActive(record, checked)}
          disabled={record.isDefault} // 默认模型不能禁用
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {!record.isDefault && (
            <Button 
              type="text" 
              icon={<StarOutlined />} 
              onClick={() => handleSetDefaultModel(record.id)}
              title="设为默认"
            />
          )}
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingModel(record);
              setModalVisible(true);
            }}
          />
          {!record.isDefault && (
            <Popconfirm
              title="确定删除此模型配置?"
              onConfirm={() => handleDeleteModel(record.id)}
              okText="删除"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>AI模型配置</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingModel(null);
            setModalVisible(true);
          }}
        >
          添加模型配置
        </Button>
      </div>
      
      <Card>
        <Table
          dataSource={models}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
      
      <Modal
        title={editingModel ? '编辑模型配置' : '添加模型配置'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingModel(null);
        }}
        footer={null}
        width={700}
      >
        <ModelConfigForm
          initialValues={editingModel}
          onSave={editingModel ? handleUpdateModel : handleAddModel}
          onCancel={() => {
            setModalVisible(false);
            setEditingModel(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default AIModelManager;