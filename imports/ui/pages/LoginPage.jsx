import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Layout, Alert } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // 获取友好的错误消息
  const getFriendlyErrorMessage = (error) => {
    if (!error) return '登录失败，请稍后重试';

    switch (error.error) {
      case 400:
        return '请输入用户名和密码';
      case 403:
        if (error.reason === 'User not found') {
          return '用户不存在，请检查用户名';
        }
        if (error.reason === 'Incorrect password') {
          return '密码错误，请重新输入';
        }
        return '登录失败，请检查用户名和密码';
      case 'too-many-requests':
        return '登录尝试次数过多，请稍后再试';
      default:
        if (error.message && error.message.includes('Network Error')) {
          return '网络连接失败，请检查网络设置';
        }
        return error.reason || '登录失败，请稍后重试';
    }
  };
  
  // 处理登录
  const handleLogin = (values) => {
    const { username, password } = values;
    
    setLoading(true);
    setError('');
    
    // 添加超时处理
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      const timeoutError = '登录请求超时，请检查网络连接';
      setError(timeoutError);
      message.error(timeoutError);
    }, 15000);
    
    Meteor.loginWithPassword(username, password, (error) => {
      clearTimeout(loginTimeout);
      setLoading(false);
      
      if (error) {
        console.error('登录错误:', error);
        const errorMessage = getFriendlyErrorMessage(error);
        setError(errorMessage);
        message.error(errorMessage);
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
          {error && (
            <Alert 
              message="登录错误" 
              description={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: 16 }} 
            />
          )}
          
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
                  autoComplete="username"
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
                  autoComplete="current-password"
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
