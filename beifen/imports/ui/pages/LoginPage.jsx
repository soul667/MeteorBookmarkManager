import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // 处理登录
  const handleLogin = (values) => {
    const { username, password } = values;
    
    setLoading(true);
    Meteor.loginWithPassword(username, password, (error) => {
      setLoading(false);
      if (error) {
        message.error(error.reason || '登录失败，请检查用户名和密码');
      } else {
        message.success('登录成功！');
        navigate('/');
      }
    });
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '50px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
          <Card bordered={false} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <Title level={2} style={{ marginTop: 16 }}>智能书签管家</Title>
              <Paragraph type="secondary">
                使用AI技术增强的书签收藏助手
              </Paragraph>
            </div>
            
            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={handleLogin}
              layout="vertical"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                  size="large" 
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                  size="large" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ width: '100%' }}
                  size="large"
                >
                  登录
                </Button>
              </Form.Item>
              
              <div style={{ textAlign: 'center' }}>
                <Text>
                  没有账号？ <Link to="/register">立即注册</Link>
                </Text>
              </div>
            </Form>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;