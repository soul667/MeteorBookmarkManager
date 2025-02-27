import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Layout, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined, MailOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // 获取友好的错误消息
  const getFriendlyErrorMessage = (error) => {
    if (!error) return '注册失败，请稍后重试';

    const errorMessage = error.reason || error.message;
    if (!errorMessage) return '注册失败，请稍后重试';

    // 处理常见错误情况
    if (errorMessage.includes('Username already exists')) {
      return '用户名已被使用，请选择其他用户名';
    }
    if (errorMessage.includes('Email already exists')) {
      return '邮箱已被注册，请使用其他邮箱或直接登录';
    }
    if (errorMessage.includes('invalid-username')) {
      return '用户名不合法，请使用字母、数字和下划线';
    }
    if (errorMessage.includes('username-too-short')) {
      return '用户名太短，至少需要3个字符';
    }
    if (errorMessage.includes('Password must')) {
      return '密码不符合要求，请确保密码至少包含6个字符';
    }
    if (errorMessage.includes('Network Error')) {
      return '网络连接失败，请检查网络设置';
    }

    return errorMessage;
  };

  // 发送验证码
  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱地址');
        return;
      }

      setLoading(true);
      await new Promise((resolve, reject) => {
        Meteor.call('email.sendVerificationCode', email, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      setVerificationSent(true);
      setCountdown(60);
      message.success('验证码已发送，请查收邮件');

      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('发送验证码失败:', error);
      message.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async (values) => {
    const { username, email, password, verificationCode } = values;
    // 转换验证码为大写
    const normalizedCode = verificationCode.toUpperCase();

    setLoading(true);
    setError('');

    try {
      // 首先验证验证码
      await new Promise((resolve, reject) => {
        Meteor.call('email.verifyCode', email, normalizedCode, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      // 验证码正确，创建用户
      await new Promise((resolve, reject) => {
        Accounts.createUser({
          username,
          email,
          password,
          profile: {
            createdAt: new Date()
          }
        }, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      message.success('注册成功！正在跳转...');
      navigate('/');
    } catch (error) {
      console.error('注册错误:', error);
      const errorMessage = getFriendlyErrorMessage(error);
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '50px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
          {error && (
            <Alert
              message="注册错误"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Card bordered={false} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <Title level={2} style={{ marginTop: 16 }}>注册新账号</Title>
              <Paragraph type="secondary">
                加入智能书签管家，开启智能收藏之旅
              </Paragraph>
            </div>

            <Form
              form={form}
              name="register"
              onFinish={handleRegister}
              layout="vertical"
              scrollToFirstError
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名!' },
                  { min: 3, message: '用户名至少3个字符!' },
                  { 
                    pattern: /^[a-zA-Z0-9_]+$/, 
                    message: '用户名只能包含字母、数字和下划线!' 
                  }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  size="large"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址!' },
                  { type: 'email', message: '请输入有效的邮箱地址!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="邮箱地址"
                  size="large"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="verificationCode"
                    noStyle
                    rules={[
                      { required: true, message: '请输入验证码!' },
                      { len: 6, message: '验证码为6位!' },
                      { pattern: /^[A-Za-z0-9]+$/, message: '验证码只能包含字母和数字!' }
                    ]}
                    normalize={value => value ? value.toUpperCase() : value}
                  >
                    <Input
                      placeholder="验证码 (不区分大小写)"
                      size="large"
                      style={{ width: 'calc(100% - 120px)' }}
                    />
                  </Form.Item>
                  <Button
                    size="large"
                    type="primary"
                    onClick={sendVerificationCode}
                    disabled={countdown > 0}
                    loading={loading && !verificationSent}
                    style={{ width: 120 }}
                  >
                    {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                  </Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码!' },
                  { min: 6, message: '密码至少6个字符!' }
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  size="large"
                  autoComplete="new-password"
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
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认密码"
                  size="large"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading && verificationSent}
                  style={{ width: '100%' }}
                  size="large"
                >
                  注册
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text>
                  已有账号？ <Link to="/login">立即登录</Link>
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
