import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { 
  Layout, Menu, Button, Typography, Modal, message,
  Breadcrumb, Space, Dropdown, Avatar, Tooltip, Drawer
} from 'antd';
import {
  PlusOutlined, MenuOutlined, AppstoreOutlined,
  TagsOutlined, UserOutlined, LogoutOutlined,
  SettingOutlined, FolderOutlined, RobotOutlined
} from '@ant-design/icons';
import { Bookmarks } from '../../api/bookmarks/bookmarks';
import { Folders } from '../../api/folders/folders';
import BookmarkList from '../components/BookmarkList';
import BookmarkForm from '../components/BookmarkForm';
import FolderList from '../components/FolderList';
import FolderForm from '../components/FolderForm';
import AISettingsForm from '../components/AISettingsForm';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const HomePage = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [bookmarkModalVisible, setBookmarkModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [aiSettingsVisible, setAiSettingsVisible] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [currentFilter, setCurrentFilter] = useState({});
  const [currentView, setCurrentView] = useState('all'); // 'all', 'folder', 'tags'
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 使用useTracker获取数据
  const { bookmarks, folders, isLoading, currentUser } = useTracker(() => {
    const bookmarksHandle = Meteor.subscribe('bookmarks');
    const foldersHandle = Meteor.subscribe('folders');
    const userHandle = Meteor.subscribe('userData');

    return {
      bookmarks: Bookmarks.find(currentFilter).fetch(),
      folders: Folders.find().fetch(),
      isLoading: !bookmarksHandle.ready() || !foldersHandle.ready() || !userHandle.ready(),
      currentUser: Meteor.user()
    };
  });

  // 退出登录处理
  const handleLogout = () => {
    Meteor.logout((error) => {
      if (error) {
        message.error(`退出失败: ${error.reason || error.message}`);
      } else {
        message.success('已退出登录');
        navigate('/login');
      }
    });
  };

  // 处理书签表单提交
  const handleBookmarkSubmit = async (values) => {
    setFormSubmitting(true);
    try {
      if (editingBookmark) {
        await Meteor.callAsync('bookmarks.update', editingBookmark._id, values);
        message.success('书签已更新');
      } else {
        await Meteor.callAsync('bookmarks.insert', values);
        message.success('书签已添加');
      }
      setBookmarkModalVisible(false);
      setEditingBookmark(null);
    } catch (error) {
      message.error(`操作失败: ${error.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // 处理文件夹表单提交
  const handleFolderSubmit = async (values) => {
    setFormSubmitting(true);
    try {
      if (editingFolder) {
        await Meteor.callAsync('folders.update', editingFolder._id, values);
        message.success('文件夹已更新');
      } else {
        await Meteor.callAsync('folders.insert', values);
        message.success('文件夹已创建');
      }
      setFolderModalVisible(false);
      setEditingFolder(null);
    } catch (error) {
      message.error(`操作失败: ${error.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

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

  // 处理菜单选择
  const handleMenuSelect = ({ key }) => {
    switch (key) {
      case 'all':
        setCurrentFilter({});
        setCurrentView('all');
        break;
      case 'folders':
        setCurrentView('folder');
        break;
      case 'tags':
        setCurrentView('tags');
        break;
      default:
        if (key.startsWith('folder-')) {
          const folderId = key.replace('folder-', '');
          setCurrentFilter({ folderId });
          setCurrentView('folder');
        }
    }
    setMobileDrawerOpen(false);
  };

  // 侧边栏菜单内容
  const sideMenuContent = (
    <>
      <Menu
        mode="inline"
        selectedKeys={[currentView === 'all' ? 'all' : '']}
        defaultOpenKeys={['folders']}
        onSelect={handleMenuSelect}
      >
        <Menu.Item key="all" icon={<AppstoreOutlined />}>
          所有书签
        </Menu.Item>
        <Menu.SubMenu key="folders" icon={<FolderOutlined />} title="文件夹">
          {folders.map(folder => (
            <Menu.Item key={`folder-${folder._id}`}>
              {folder.name}
            </Menu.Item>
          ))}
        </Menu.SubMenu>
        <Menu.Item key="tags" icon={<TagsOutlined />}>
          标签管理
        </Menu.Item>
      </Menu>
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 移动端抽屉 */}
      <Drawer
        placement="left"
        visible={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={250}
      >
        {sideMenuContent}
      </Drawer>

      {/* PC端侧边栏 */}
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          display: { xs: 'none', sm: 'none', md: 'block' }
        }}
      >
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>书签管理器</Title>
        </div>
        {sideMenuContent}
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileDrawerOpen(true)}
              style={{ display: { md: 'none' } }}
            />
            <Title level={4} style={{ margin: 0 }}>书签管理器</Title>
          </Space>

          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setBookmarkModalVisible(true)}>
              添加书签
            </Button>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px 16px', minHeight: 280 }}>
          <BookmarkList
            bookmarks={bookmarks}
            loading={isLoading}
            onEdit={bookmark => {
              setEditingBookmark(bookmark);
              setBookmarkModalVisible(true);
            }}
          />
        </Content>
      </Layout>

      {/* 添加/编辑书签模态框 */}
      <Modal
        title={editingBookmark ? "编辑书签" : "添加书签"}
        open={bookmarkModalVisible}
        onCancel={() => {
          setBookmarkModalVisible(false);
          setEditingBookmark(null);
        }}
        footer={null}
      >
        <BookmarkForm
          initialValues={editingBookmark}
          folders={folders}
          onSubmit={handleBookmarkSubmit}
          submitting={formSubmitting}
        />
      </Modal>

      {/* 添加/编辑文件夹模态框 */}
      <Modal
        title={editingFolder ? "编辑文件夹" : "新建文件夹"}
        open={folderModalVisible}
        onCancel={() => {
          setFolderModalVisible(false);
          setEditingFolder(null);
        }}
        footer={null}
      >
        <FolderForm
          initialValues={editingFolder}
          onSubmit={handleFolderSubmit}
          submitting={formSubmitting}
        />
      </Modal>
    </Layout>
  );
};

export default HomePage;
