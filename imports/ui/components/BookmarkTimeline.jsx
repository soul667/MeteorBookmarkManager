import React from 'react';
import { Timeline, Card, Space, Typography, Button, Select } from 'antd';
import { LinkOutlined, EditOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;

const BookmarkTimeline = ({ bookmarks = [], loading = false, onEdit }) => {
  const [sortBy, setSortBy] = React.useState('createdAt'); // 'createdAt' or 'lastVisitedAt'

  if (loading) {
    return <div>加载中...</div>;
  }

  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    const dateA = new Date(a[sortBy] || a.createdAt);
    const dateB = new Date(b[sortBy] || b.createdAt);
    return dateB - dateA;
  });

  const groupedBookmarks = sortedBookmarks.reduce((groups, bookmark) => {
    const date = new Date(bookmark[sortBy] || bookmark.createdAt);
    const key = date.toLocaleDateString();
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(bookmark);
    return groups;
  }, {});

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Text>排序方式：</Text>
        <Select 
          value={sortBy} 
          onChange={setSortBy}
          style={{ width: 160 }}
        >
          <Option value="createdAt">按创建时间</Option>
          <Option value="lastVisitedAt">按最后访问时间</Option>
        </Select>
      </Space>

      <Timeline mode="left">
        {Object.entries(groupedBookmarks).map(([date, items]) => (
          <Timeline.Item 
            key={date}
            dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
            label={date}
          >
            <Space direction="vertical" style={{ width: '100%', gap: '16px' }}>
              {items.map(bookmark => (
                <Card
                  key={bookmark._id}
                  size="small"
                  title={bookmark.title}
                  extra={
                    <Space>
                      <Button 
                        type="link" 
                        icon={<LinkOutlined />} 
                        onClick={() => window.open(bookmark.url, '_blank')}
                      >
                        访问
                      </Button>
                      <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => onEdit(bookmark)}
                      >
                        编辑
                      </Button>
                    </Space>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary" ellipsis>{bookmark.description}</Text>
                    {bookmark.tags?.length > 0 && (
                      <Space size={[0, 8]} wrap>
                        {bookmark.tags.map(tag => (
                          <Text key={tag} type="secondary" style={{ fontSize: '12px' }}>
                            #{tag}
                          </Text>
                        ))}
                      </Space>
                    )}
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {sortBy === 'lastVisitedAt' ? '最后访问：' : '创建于：'}
                      {new Date(bookmark[sortBy] || bookmark.createdAt).toLocaleTimeString()}
                    </Text>
                  </Space>
                </Card>
              ))}
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
};

export default BookmarkTimeline;
