import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Form, Input, Button, Select, Switch, Space, 
  Typography, Divider, Alert, message
} from 'antd';
import { 
  SaveOutlined, PlusOutlined, MinusCircleOutlined, 
  LoadingOutlined, ApiOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const ModelConfigForm = ({ initialValues = null, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(initialValues?.provider || 'openai');
  
  // 根据provider设置不同的默认baseUrl
  useEffect(() => {
    const baseUrls = {
      'openai': 'https://api.openai.com/v1',
      'anthropic': 'https://api.anthropic.com',
      'local': 'http://localhost:11434/api',
      'custom': ''
    };
    
    if (!initialValues && baseUrls[provider]) {
      form.setFieldsValue({ baseUrl: baseUrls[provider] });
    }
  }, [provider, initialValues]);
  
  // 加载初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setProvider(initialValues.provider);
    }
  }, [initialValues]);
  
  // 测试连接
  const testConnection = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 调用测试API连接的方法
      Meteor.call('ai.testModelConnection', {
        provider: values.provider,
        baseUrl: values.baseUrl,
        apiKey: values.apiKey,
        model: values.defaultModel
      }, (error, result) => {
        setLoading(false);
        
        if (error || !result?.success) {
          message.error(`连接测试失败: ${error?.reason || result?.message || '未知错误'}`);
        } else {
          message.success('连接测试成功！');
        }
      });
    } catch (error) {
      console.error('表单验证失败', error);
    }
  };
  
  // 提交表单
  const handleSubmit = async (values) => {
    if (onSave) {
      setLoading(true);
      try {
        await onSave(values);
        setLoading(false);
      } catch (error) {
        console.error('保存模型配置失败', error);
        setLoading(false);
      }
    }
  };
  
  // 获取提供商对应的默认模型列表
  const getDefaultModels = (provider) => {
    switch (provider) {
      case 'openai':
        return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      case 'anthropic':
        return ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
      case 'local':
        return ['llama3', 'mistral', 'custom-local-model'];
      default:
        return [];
    }
  };
  
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-3.5-turbo',
        isActive: true
      }}
    >
      <Form.Item
        name="name"
        label="配置名称"
        rules={[{ required: true, message: '请输入配置名称!' }]}
      >
        <Input placeholder="例如: 我的OpenAI API" />
      </Form.Item>
      
      <Form.Item
        name="provider"
        label="服务提供商"
        rules={[{ required: true, message: '请选择服务提供商!' }]}
      >
        <Select onChange={value => setProvider(value)}>
          <Option value="openai">OpenAI</Option>
          <Option value="anthropic">Anthropic</Option>
          <Option value="local">本地模型 (Ollama)</Option>
          <Option value="custom">自定义</Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        name="baseUrl"
        label="API基础URL"
        rules={[{ required: true, message: '请输入API基础URL!' }]}
      >
        <Input placeholder="https://api.example.com/v1" />
      </Form.Item>
      
      <Form.Item
        name="apiKey"
        label="API密钥"
        rules={[{ required: provider !== 'local', message: '请输入API密钥!' }]}
      >
        <Input.Password 
          placeholder="sk-..." 
          disabled={provider === 'local'}
        />
      </Form.Item>
      
      <Divider>支持的模型</Divider>
      
      <Form.List name="models">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space 
                key={key} 
                style={{ display: 'flex', marginBottom: 8 }} 
                align="baseline"
              >
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: '请输入模型名称!' }]}
                >
                  <Input placeholder="模型名称 (如 gpt-4)" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <Button 
                type="dashed" 
                onClick={() => add()} 
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                添加模型
              </Button>
            </Form.Item>
            <Form.Item>
              <Button
                type="link"
                onClick={() => {
                  const defaultModels = getDefaultModels(provider);
                  form.setFieldsValue({ models: defaultModels });
                }}
              >
                使用{provider === 'openai' ? 'OpenAI' : 
                     provider === 'anthropic' ? 'Claude' : 
                     provider === 'local' ? 'Ollama' : '默认'}
                推荐模型
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
      
      <Form.Item
        name="defaultModel"
        label="默认模型"
        rules={[{ required: true, message: '请选择默认模型!' }]}
      >
        <Select
          placeholder="选择默认使用的模型"
        >
          {form.getFieldValue('models')?.map(model => (
            <Option key={model} value={model}>{model}</Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item
        name="isActive"
        valuePropName="checked"
        label="启用此配置"
      >
        <Switch />
      </Form.Item>
      
      <Divider />
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          icon={<ApiOutlined />}
          onClick={testConnection}
          disabled={loading}
        >
          测试连接
        </Button>
        
        <Space>
          {onCancel && (
            <Button onClick={onCancel} disabled={loading}>
              取消
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
          >
            保存配置
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default ModelConfigForm;