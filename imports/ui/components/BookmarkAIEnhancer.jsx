import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Card, Button, Input, Tag, Spin, Typography, 
  Collapse, Space, Switch, message, Tooltip, Select 
} from 'antd';
import { 
  RobotOutlined, TagOutlined, EditOutlined, 
  CheckOutlined, CloseOutlined, LoadingOutlined 
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const BookmarkAIEnhancer = ({ url, existingTags = [], onSummaryChange, onTagsChange }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [tempSummary, setTempSummary] = useState('');
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [summaryLength, setSummaryLength] = useState('medium');

  // 获取AI摘要
  const fetchSummary = async () => {
    if (!url) return;
    
    setLoading(true);
    try {
      Meteor.call('ai.summarizeUrl', url, { length: summaryLength }, (error, result) => {
        if (error) {
          message.error(`获取摘要失败: ${error.reason || error.message}`);
          console.error("摘要生成错误", error);
        } else {
          setSummary(result.summary);
          if (onSummaryChange) onSummaryChange(result.summary);
          
          // 获取标签推荐
          fetchTagSuggestions(result.originalContent);
        }
        setLoading(false);
      });
    } catch (error) {
      message.error(`处理请求时出错: ${error.message}`);
      setLoading(false);
    }
  };

  // 获取标签建议
  const fetchTagSuggestions = (content) => {
    if (!content) return;
    
    Meteor.call('ai.suggestTags', content, existingTags, 8, (error, result) => {
      if (error) {
        message.error(`获取标签建议失败: ${error.reason || error.message}`);
        console.error("标签推荐错误", error);
      } else {
        setSuggestedTags(result);
      }
    });
  };
  
  // 编辑摘要
  const handleEditSummary = () => {
    setTempSummary(summary);
    setEditingSummary(true);
  };
  
  // 保存编辑后的摘要
  const handleSaveSummary = () => {
    setSummary(tempSummary);
    setEditingSummary(false);
    if (onSummaryChange) onSummaryChange(tempSummary);
  };
  
  // 取消编辑摘要
  const handleCancelEdit = () => {
    setEditingSummary(false);
  };
  
  // 处理标签选择
  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      const newSelectedTags = [...selectedTags, tag];
      setSelectedTags(newSelectedTags);
      if (onTagsChange) onTagsChange(newSelectedTags);
    }
  };
  
  // 移除已选择的标签
  const handleTagRemove = (tag) => {
    const newSelectedTags = selectedTags.filter(t => t !== tag);
    setSelectedTags(newSelectedTags);
    if (onTagsChange) onTagsChange(newSelectedTags);
  };
  
  // 当URL变化时重置状态
  useEffect(() => {
    setSummary('');
    setSuggestedTags([]);
    setSelectedTags([]);
    setEditingSummary(false);
  }, [url]);

  // 设置初始已选标签
  useEffect(() => {
    if (existingTags && existingTags.length > 0) {
      setSelectedTags(existingTags);
    }
  }, [existingTags]);

  return (
    <Card title={
      <Space>
        <RobotOutlined style={{ color: '#1890ff' }} /> 
        <span>AI 辅助工具</span>
      </Space>
    }>
      <Collapse defaultActiveKey={['1', '2']}>
        <Panel 
          header={
            <Space>
              <span>内容摘要</span>
              <Select 
                value={summaryLength} 
                onChange={setSummaryLength} 
                style={{ width: 100 }}
                size="small"
              >
                <Option value="short">简短</Option>
                <Option value="medium">中等</Option>
                <Option value="long">详细</Option>
              </Select>
            </Space>
          } 
          key="1"
        >
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              onClick={fetchSummary} 
              loading={loading}
              disabled={!url}
            >
              {loading ? '生成中...' : '生成摘要'}
            </Button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <div style={{ marginTop: 8 }}>AI正在分析网页内容...</div>
            </div>
          ) : summary ? (
            <div>
              {editingSummary ? (
                <>
                  <TextArea 
                    value={tempSummary} 
                    onChange={(e) => setTempSummary(e.target.value)}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ marginBottom: 16 }}
                  />
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<CheckOutlined />} 
                      onClick={handleSaveSummary}
                    >
                      保存
                    </Button>
                    <Button 
                      icon={<CloseOutlined />} 
                      onClick={handleCancelEdit}
                    >
                      取消
                    </Button>
                  </Space>
                </>
              ) : (
                <>
                  <Paragraph>{summary}</Paragraph>
                  <Button 
                    icon={<EditOutlined />} 
                    type="link" 
                    onClick={handleEditSummary}
                  >
                    编辑摘要
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Text type="secondary">
              点击"生成摘要"按钮来自动分析网页内容并生成摘要
            </Text>
          )}
        </Panel>
        
        <Panel 
          header={<><TagOutlined /> 智能标签推荐</>} 
          key="2"
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>已选标签:</Text>
            </div>
            {selectedTags.length > 0 ? (
              <div>
                {selectedTags.map(tag => (
                  <Tag 
                    key={tag} 
                    closable 
                    onClose={() => handleTagRemove(tag)}
                    style={{ marginBottom: 8 }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary">暂无已选标签</Text>
            )}
          </div>
          
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>推荐标签:</Text>
            </div>
            {suggestedTags.length > 0 ? (
              <div>
                {suggestedTags.map(tag => (
                  <Tag 
                    key={tag} 
                    color={selectedTags.includes(tag) ? 'green' : 'blue'}
                    style={{ marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => handleTagSelect(tag)}
                  >
                    {tag} {selectedTags.includes(tag) && <CheckOutlined />}
                  </Tag>
                ))}
              </div>
            ) : loading ? (
              <Spin size="small" />
            ) : (
              <Text type="secondary">
                {!url ? '添加URL后获取标签建议' : '生成摘要后将自动提供标签建议'}
              </Text>
            )}
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default BookmarkAIEnhancer;