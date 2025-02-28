import React from 'react';
import { Card, Space, Typography, Button } from 'antd';
import { LinkOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const BookmarkGrid = ({ bookmarks = [], loading = false, onEdit }) => {
  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
      {bookmarks.map(bookmark => (
        <Card
          key={bookmark._id}
          hoverable
          actions={[
            <Button 
              type="link" 
              icon={<LinkOutlined />} 
              onClick={() => window.open(bookmark.url, '_blank')}
            >
              访问
            </Button>,
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => onEdit(bookmark)}
            >
              编辑
            </Button>
          ]}
        >
          <Card.Meta
            title={bookmark.title}
            description={
              <Space direction="vertical">
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
              </Space>
            }
          />
        </Card>
      ))}
    </div>
  );
};

export default BookmarkGrid;
