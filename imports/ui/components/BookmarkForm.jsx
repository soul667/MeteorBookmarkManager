import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Form, Input, Button, Select, Switch, Divider,
  Card, message, Tabs, Space, Typography
} from 'antd';
import { LinkOutlined, SaveOutlined, LoadingOutlined } from '@ant-design/icons';
import BookmarkAIEnhancer from './BookmarkAIEnhancer';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;
const { TabPane } = Tabs;

const BookmarkForm = ({ 
  initialValues = {}, 
  folders = [], 
  onSubmit, 
  loading: submitLoading 
}) => {
  const [form] = Form.useForm();
  const [url, setUrl] = useState(initialValues?.url || '');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiSummary, setAiSummary] = useState(initialValues?.aiGenerated?.summary || '');
  const [aiTags, setAiTags] = useState(initialValues?.tags || []);
  const [isUrlValidating, setIsUrlValidating] = useState(false);

  useEffect(() => {
    // 当URL通过表单修改时更新状态
    form.setFieldsValue({
      ...initialValues,
      aiGenerated: {
        ...(initialValues?.aiGenerated || {}),
        summary: aiSummary
      },
      tags: aiTags.length > 0 ? [...aiTags] : initialValues?.tags || []
    });
  }, [aiSummary, aiTags]);

  // 验证URL
  const validateUrl = async (rule, value) => {
    if (!value) return;
    
    if (!value.match(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/)) {
      throw new Error('请输入有效的URL!');
    }
  };
  
  // 提交表单
  const handleSubmit = (values) => {
    // 确保URL有http/https前缀
    if (values.url && !values.url.startsWith('http')) {
      values.url = `https://${values.url}`;
    }
    
    // 整合AI生成的数据
    if (aiEnabled) {
      values.aiGenerated = {
        ...values.aiGenerated,
        summary: aiSummary
      };
    }
    
    if (onSubmit) {
      onSubmit(values);
    }
  };
  
  // 处理URL变更
  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    form.setFieldsValue({ url: newUrl });
  };
  
  // 处理AI摘要变更
  const handleSummaryChange = (summary) => {
    setAiSummary(summary);
    form.setFieldsValue({ 
      description: form.getFieldValue('description') || summary
    });
  };
  
  // 处理AI标签变更
  const handleTagsChange = (tags) => {
    setAiTags(tags);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        {initialValues?._id ? '编辑书签' : '添加新书签'}
      </Title>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        <Card title="基本信息" style={{ marginBottom: 24 }}>
          <Form.Item
            name="url"
            label="网址 (URL)"
            rules={[
              { required: true, message: '请输入URL!' },
              { validator: validateUrl }
            ]}
            validateStatus={isUrlValidating ? 'validating' : ''}
            help={isUrlValidating ? '正在验证URL...' : ''}
          >
            <Input 
              prefix={<LinkOutlined />} 
              placeholder="https://example.com" 
              onChange={handleUrlChange}
              disabled={submitLoading}
            />
          </Form.Item>
          
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题!' }]}
          >
            <Input placeholder="书签标题" disabled={submitLoading} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea 
              rows={4} 
              placeholder="网页描述或备注" 
              disabled={submitLoading} 
            />
          </Form.Item>
        </Card>
        
        <Card title="分类与标签" style={{ marginBottom: 24 }}>
          <Form.Item
            name="folderId"
            label="文件夹"
          >
            <Select placeholder="选择文件夹" allowClear disabled={submitLoading}>
              {folders.map(folder => (
                <Option key={folder._id} value={folder._id}>
                  {folder.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="添加标签"
              style={{ width: '100%' }}
              disabled={submitLoading}
            >
              {/* 标签选项会由表单控制 */}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="isPublic"
            label="公开书签"
            valuePropName="checked"
          >
            <Switch disabled={submitLoading} />
          </Form.Item>
        </Card>
        
        <Tabs defaultActiveKey="1">
          <TabPane tab="AI辅助" key="1">
            <div style={{ marginBottom: 16 }}>
              <Space>
                <span>启用AI功能:</span>
                <Switch 
                  checked={aiEnabled} 
                  onChange={setAiEnabled} 
                  disabled={submitLoading} 
                />
              </Space>
            </div>
            
            {aiEnabled && (
              <BookmarkAIEnhancer 
                url={url}
                existingTags={initialValues?.tags || []}
                onSummaryChange={handleSummaryChange}
                onTagsChange={handleTagsChange}
              />
            )}
          </TabPane>
          
          <TabPane tab="高级设置" key="2">
            <Card>
              <Form.Item
                name={['aiGenerated', 'enabled']}
                label="允许AI处理此书签"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch disabled={submitLoading} />
              </Form.Item>
              
              <Form.Item
                name="customIcon"
                label="自定义图标URL"
              >
                <Input placeholder="图标URL" disabled={submitLoading} />
              </Form.Item>
            </Card>
          </TabPane>
        </Tabs>
        
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              icon={submitLoading ? <LoadingOutlined /> : <SaveOutlined />}
              loading={submitLoading}
            >
              {submitLoading ? '保存中...' : '保存书签'}
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default BookmarkForm;
