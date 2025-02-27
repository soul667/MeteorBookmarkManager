import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Form, Switch, Card, Button, Select, Slider, 
  Input, Typography, Divider, Radio, ColorPicker, message
} from 'antd';
import { 
  SaveOutlined, LoadingOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

// 通用设置表单组件
const GeneralSettingsForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  
  // 在组件加载时获取用户设置
  useEffect(() => {
    setLoading(true);
    Meteor.call('users.getSettings', (error, result) => {
      setLoading(false);
      if (error) {
        message.error(`无法获取设置: ${error.reason || error.message}`);
        console.error("获取用户设置错误", error);
      } else {
        setUserSettings(result || {});
        form.setFieldsValue(result || {
          darkMode: false,
          primaryColor: '#1890ff',
          language: 'zh_CN',
          defaultView: 'grid',
          itemsPerPage: 12,
          autoRefresh: true,
          notifications: {
            enabled: true,
            browserNotifications: false,
            emailNotifications: false
          }
        });
      }
    });
  }, []);
  
  // 保存设置
  const handleSaveSettings = (values) => {
    setSaving(true);
    Meteor.call('users.updateSettings', values, (error) => {
      setSaving(false);
      if (error) {
        message.error(`保存设置失败: ${error.reason || error.message}`);
        console.error("保存用户设置错误", error);
      } else {
        message.success('设置已保存');
        setUserSettings(values);
      }
    });
  };

  if (loading && !userSettings) {
    return <div style={{textAlign: 'center', padding: '20px'}}>加载中...</div>;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSaveSettings}
    >
      <Card title="界面设置" style={{ marginBottom: 24 }} bordered={false}>
        <Form.Item
          name="darkMode"
          valuePropName="checked"
          label="深色模式"
        >
          <Switch disabled={saving} />
        </Form.Item>
        
        <Form.Item
          name="language"
          label="语言"
        >
          <Select disabled={saving}>
            <Select.Option value="zh_CN">简体中文</Select.Option>
            <Select.Option value="en_US">English</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="primaryColor"
          label="主题色"
        >
          <ColorPicker disabled={saving} />
        </Form.Item>
      </Card>
      
      <Card title="书签显示设置" style={{ marginBottom: 24 }} bordered={false}>
        <Form.Item
          name="defaultView"
          label="默认视图"
        >
          <Radio.Group disabled={saving}>
            <Radio.Button value="grid">网格视图</Radio.Button>
            <Radio.Button value="list">列表视图</Radio.Button>
            <Radio.Button value="compact">紧凑视图</Radio.Button>
          </Radio.Group>
        </Form.Item>
        
        <Form.Item
          name="itemsPerPage"
          label="每页显示数量"
        >
          <Slider
            min={6}
            max={48}
            step={6}
            marks={{ 6: '6', 12: '12', 24: '24', 36: '36', 48: '48' }}
            disabled={saving}
          />
        </Form.Item>
        
        <Form.Item
          name="autoRefresh"
          valuePropName="checked"
          label="自动刷新列表"
        >
          <Switch disabled={saving} />
        </Form.Item>
      </Card>
      
      <Card title="通知设置" style={{ marginBottom: 24 }} bordered={false}>
        <Form.Item
          name={['notifications', 'enabled']}
          valuePropName="checked"
          label="启用通知"
        >
          <Switch disabled={saving} />
        </Form.Item>
        
        <Form.Item
          name={['notifications', 'browserNotifications']}
          valuePropName="checked"
          label="浏览器推送通知"
        >
          <Switch disabled={saving || !form.getFieldValue(['notifications', 'enabled'])} />
        </Form.Item>
        
        <Form.Item
          name={['notifications', 'emailNotifications']}
          valuePropName="checked"
          label="邮件通知"
        >
          <Switch disabled={saving || !form.getFieldValue(['notifications', 'enabled'])} />
        </Form.Item>
      </Card>
      
      <div style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={saving}
          icon={saving ? <LoadingOutlined /> : <SaveOutlined />}
        >
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </Form>
  );
};

export default GeneralSettingsForm;