        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ marginRight: 16 }}
        />
        <Title level={4} style={{ margin: 0 }}>设置</Title>
      </Header>
      
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            style={{ height: '100%', borderRight: 0 }}
            onSelect={({ key }) => setActiveTab(key)}
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