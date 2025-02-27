import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Form, Switch, Card, Button, Select, Slider, 
  Input, Typography, Divider, Alert, Skeleton, message
} from 'antd';
import { 
  RobotOutlined, SaveOutlined, 
  SyncOutlined, LoadingOutlined 
} from '@ant-design/icons';

const { Option } = Select;
const { Title, Paragraph, Text } = Typography;

// AI设置表单组件
const AISettingsForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  
  // 在组件加载时获取用户AI设置
  useEffect(() => {
    setLoading(true);
    Meteor.call('users.getAISettings', (error, result) => {
      setLoading(false);
      if (error) {
        message.error(`无法获取AI设置: ${error.reason || error.message}`);
        console.error("获取AI设置错误", error);
      } else {
        setUserSettings(result || {});
        form.setFieldsValue(result || {
          aiEnabled: true,
          summarizationEnabled: true,
          autoTaggingEnabled: true,
          autoClassificationEnabled: true,
          summarizationLength: 'medium',
          processingMode: 'add',
          suggestedTagsCount: 5
        });
      }
    });
  }, []);
  
  // 保存设置
  const handleSaveSettings = (values) => {
    setSaving(true);
    Meteor.call('users.updateAISettings', values, (error) => {
      setSaving(false);
      if (error) {
        message.error(`保存设置失败: ${error.reason || error.message}`);
        console.error("保存AI设置错误", error);
      } else {
        message.success('AI设置已保存');
        setUserSettings(values);
      }
    });
  };

  // 验证API密钥
  const handleValidateAPIKey = () => {
    const apiKey = form.getFieldValue('apiKey');
    if (!apiKey) {
      message.warning('请先输入API密钥');
      return;
    }
    
    setLoading(true);
    Meteor.call('ai.validateApiKey', apiKey, (error, result) => {
      setLoading(false);
      if (error || !result?.valid) {
        message.error(`API密钥无效: ${error?.reason || error?.message || '验证失败'}`);
      } else {
        message.success('API密钥有效');
      }
    });
  };

  if (loading && !userSettings) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSaveSettings}
    >
      <Card title="AI功能总览" style={{ marginBottom: 24 }} bordered={false}>
        <Form.Item
          name="aiEnabled"
          valuePropName="checked"
          label="启用AI增强功能"
        >
          <Switch disabled={saving} />
        </Form.Item>
        
        <Paragraph>
          AI增强功能使用人工智能技术帮助您更有效地管理书签，提供自动摘要、智能标签推荐和内容分类等功能。
          启用后，系统会分析您添加的网页内容，提供更智能的管理体验。
        </Paragraph>
      </Card>
      
      <Card title="功能设置" style={{ marginBottom: 24 }} bordered={false}>
        <Form.Item
          name="summarizationEnabled"
          valuePropName="checked"
          label="内容自动摘要"
        >
          <Switch disabled={saving} />
        </Form.Item>
        
        <Form.Item
          name="summarizationLength"
          label="摘要长度"
        >
          <Select disabled={saving || !form.getFieldValue('summarizationEnabled')}>
            <Option value="short">简短 (约30字)</Option>
            <Option value="medium">中等 (约100字)</Option>
            <Option value="long">详细 (约200字)</Option>
          </Select>
        </Form.Item>
        
        <Divider />
        
        <Form.Item
          name="autoTaggingEnabled"
          valuePropName="checked"
          label="智能标签推荐"
        >
          <Switch disabled={saving} />
        </Form.Item>
        
        <Form.Item
          name="suggestedTagsCount"
          label="推荐标签数量"
        >
          <Slider 
            min={3} 
            max={10} 
            marks={{ 3: '3', 6: '6', 10: '10' }} 
            disabled={saving || !form.getFieldValue('autoTaggingEnabled')}
          />
        </Form.Item>
        
        <Divider />
        
        <Form.Item
          name="autoClassificationEnabled"
          valuePropName="checked"
          label="智能分类"
        >
          <Switch disabled={saving} />
        </Form.Item>
        
        <Form.Item
          name="processingMode"
          label="处理模式"
        >
          <Select disabled={saving}>
            <Option value="add">仅处理新添加的书签</Option>
            <Option value="all">处理所有书签（包括已存在的）</Option>
            <Option value="manual">手动触发处理</Option>
          </Select>
        </Form.Item>
      </Card>
      
      <Card title="API配置" style={{ marginBottom: 24 }} bordered={false}>
        <Alert
          message="OpenAI API密钥设置（可选）"
          description="如果您想使用自己的OpenAI API密钥以获得更好的性能和控制，可以在下方输入。如不设置，将使用系统提供的共享API。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form.Item
          name="apiKey"
          label="OpenAI API密钥"
        >
          <Input.Password 
            placeholder="sk-..." 
            disabled={saving}
            addonAfter={
              <Button 
                type="link" 
                size="small" 
                onClick={handleValidateAPIKey}
                disabled={saving}
              >
                验证
              </Button>
            }
          />
        </Form.Item>
        
        <Form.Item
          name="apiModel"
          label="优先使用的模型"
        >
          <Select disabled={saving}>
            <Option value="gpt-4">GPT-4 (最佳质量，但较慢)</Option>
            <Option value="gpt-3.5-turbo">GPT-3.5 Turbo (速度和质量的平衡)</Option>
          </Select>
        </Form.Item>
      </Card>
      
      <Card title="高级设置" style={{ marginBottom: 24 }} bordered={false}>
        <Form.Item
          name="vectorSearchEnabled"
          valuePropName="checked"
          label="启用向量搜索"
        >
          <Switch disabled={saving} />
        </Form.Item>
        
        <Form.Item
          name="batchProcessingEnabled"
          valuePropName="checked"
          label="启用批量处理"
        >
          <Switch disabled={saving} />
        </Form.Item>
        
        <Button 
          icon={<SyncOutlined />} 
          style={{ marginTop: 16 }} 
          disabled={saving}
          onClick={() => {
            Modal.confirm({
              title: '重新处理所有书签',
              content: '确定要重新处理所有书签？这将使用AI重新生成所有书签的摘要、标签和分类，可能需要一些时间。',
              onOk() {
                message.loading('开始处理书签...');
                Meteor.call('ai.reprocessAllBookmarks', (error, result) => {
                  if (error) {
                    message.error(`处理失败: ${error.reason || error.message}`);
                    console.error("批量处理错误", error);
                  } else {
                    message.success(`已将${result}个书签加入处理队列`);
                  }
                });
              }
            });
          }}
        >
          重新处理所有书签
        </Button>
      </Card>
      
      <div style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          htmlType="submit"
          icon={saving ? <LoadingOutlined /> : <SaveOutlined />}
          loading={saving}
        >
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </Form>
  );
};

export default AISettingsForm;