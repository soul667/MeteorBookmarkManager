import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout, Menu, Tabs, Card, Button, Typography,
  Space, Breadcrumb
} from 'antd';
import {
  SettingOutlined, RobotOutlined, UserOutlined,
  AppstoreOutlined, BellOutlined, ArrowLeftOutlined
} from '@ant-design/icons';

import AISettingsForm from '../components/AISettingsForm';
import AIModelManager from '../components/AIModelManager';
import GeneralSettingsForm from '../components/GeneralSettingsForm';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const SettingsPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const [activeTab, setActiveTab] = useState(tab || 'general');
  
  // 当URL的tab参数变化时更新activeTab
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab]);
  
  // 渲染内容
  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsForm />;
      case 'ai':
        return <AISettingsForm />;
      case 'models':
        return <AIModelManager />;
      case 'profile':
        return <div>个人资料设置</div>;
      case 'notifications':
        return <div>通知设置</div>;
      default:
        return <div>设置页面</div>;
    }
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="site-layout-header" style={{ padding: '0 16px', background: '#fff', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
        {/* 使用div包裹多个元素 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ marginRight: 16 }}
          />
          <Title level={4} style={{ margin: 0 }}>设置</Title>
        </div>
      </Header>
      
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            style={{ height: '100%', borderRight: 0 }}
            onSelect={({ key }) => {
              setActiveTab(key);
              navigate(`/settings/${key !== 'general' ? key : ''}`, { replace: true });
            }}
          >
            <Menu.Item key="general" icon={<SettingOutlined />}>
              常规设置
            </Menu.Item>
            <Menu.Item key="ai" icon={<RobotOutlined />}>
              AI功能设置
            </Menu.Item>
            <Menu.Item key="models" icon={<AppstoreOutlined />}>
              模型配置
            </Menu.Item>
            <Menu.Item key="profile" icon={<UserOutlined />}>
              个人资料
            </Menu.Item>
            <Menu.Item key="notifications" icon={<BellOutlined />}>
              通知设置
            </Menu.Item>
          </Menu>
        </Sider>
        
        <Layout style={{ padding: '0 24px 24px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>设置</Breadcrumb.Item>
            <Breadcrumb.Item>
              {activeTab === 'general' ? '常规设置' : 
               activeTab === 'ai' ? 'AI功能设置' : 
               activeTab === 'models' ? '模型配置' : 
               activeTab === 'profile' ? '个人资料' : '通知设置'}
            </Breadcrumb.Item>
          </Breadcrumb>
          
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default SettingsPage;