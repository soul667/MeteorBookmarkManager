// 在HomePage组件中找到userMenu变量，更新如下：

// 用户菜单
const userMenu = (
  <Menu>
    <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
      系统设置
    </Menu.Item>
    <Menu.Item key="ai-settings" icon={<RobotOutlined />} onClick={() => navigate('/settings/ai')}>
      AI智能设置
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
      退出登录
    </Menu.Item>
  </Menu>
);

// 添加navigate hook在组件顶部：
const navigate = useNavigate();