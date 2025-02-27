import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, RobotOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // 处理注册
  const handleRegister = (values) => {
    const { username, email, password } = values;
    
    setLoading(true);
    Accounts.createUser({
      username,
      email,
      password,
      profile: {
        aiSettings: {
          aiEnabled: true,
          summarizationEnabled: true,
          autoTaggingEnabled: true,
          autoClassificationEnabled: true,
          summarizationLength: 'medium',
          processingMode: 'add',
          suggestedTagsCount: 5
        }
      }
    }, (error) => {
      setLoading(false);
      if (error) {
        message.error(error.reason || '注册失败');
      } else {
        message.success('注册成功！正在登录...');
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
              <Title level={2} style={{ marginTop: 16 }}>注册账号</Title>
              <Paragraph type="secondary">
                创建您的智能书签管家账号
              </Paragraph>
            </div>
            
            <Form
              name="register"
              onFinish={handleRegister}
              layout="vertical"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名!' },
                  { min: 3, message: '用户名至少3个字符!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                  size="large" 
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱!' },
                  { type: 'email', message: '请输入有效的邮箱地址!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  type="email"
                  placeholder="电子邮箱" 
                  size="large" 
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码!' },
                  { min: 6, message: '密码至少6个字符!' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                  size="large" 
                />
              </Form.Item>
              
              <Form.Item
                name="confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="确认密码" 
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
                  注册
                </Button>
              </Form.Item>
              
              <div style={{ textAlign: 'center' }}>
                <Text>
                  已有账号？ <Link to="/login">返回登录</Link>
                </Text>
              </div>
            </Form>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default RegisterPage;