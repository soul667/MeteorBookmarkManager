import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// 需要登录的路由
const PrivateRoute = ({ children }) => {
  const { user, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe('userData');
    return {
      isLoading: !handle.ready(),
      user: Meteor.user()
    };
  });

  if (isLoading) return null;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// 已登录用户访问登录/注册页面时重定向
const PublicRoute = ({ children }) => {
  const { user } = useTracker(() => ({
    user: Meteor.user()
  }));

  if (user) {
    return <Navigate to="/" />;
  }

  return children;
};

// 全局应用容器
const App = () => {
  // 跟踪用户主题偏好
  const { darkMode } = useTracker(() => {
    const user = Meteor.user();
    return {
      darkMode: user?.profile?.settings?.theme === 'dark' || false
    };
  }, []);
  
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            {/* 公开路由 */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } 
            />
            
            {/* 私有路由 */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              } 
            />
            
            {/* 404页面 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
