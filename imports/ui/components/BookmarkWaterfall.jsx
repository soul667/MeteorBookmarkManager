import React from 'react';
import { Card, Space, Typography, Button, Image } from 'antd';
import { LinkOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

const BookmarkWaterfall = ({ bookmarks = [], loading = false, onEdit }) => {
  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{
      columnCount: 'auto',
      columnWidth: '300px',
      columnGap: '16px'
    }}>
      {bookmarks.map(bookmark => (
        <Card
          key={bookmark._id}
          hoverable
          style={{
            breakInside: 'avoid',
            marginBottom: '16px'
          }}
          cover={
            bookmark.thumbnail ? (
              <Image
                alt={bookmark.title}
                src={bookmark.thumbnail}
                style={{ objectFit: 'cover' }}
                fallback="https://via.placeholder.com/300x200?text=No+Image"
              />
            ) : null
          }
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
                  {new Date(bookmark.createdAt).toLocaleDateString()}
                </Text>
              </Space>
            }
          />
        </Card>
      ))}
    </div>
  );
};

export default BookmarkWaterfall;
