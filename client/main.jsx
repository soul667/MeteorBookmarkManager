import React, { useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom';

import App from '../imports/ui/App';
import HomePage from '../imports/ui/pages/HomePage';
import SettingsPage from '../imports/ui/pages/SettingsPage';
import LoginPage from '../imports/ui/pages/LoginPage';
import RegisterPage from '../imports/ui/pages/RegisterPage';
import NotFoundPage from '../imports/ui/pages/NotFoundPage';

// 导入 Ant Design 样式
import 'antd/dist/reset.css';
import './main.css';

// 身份验证路由守卫组件
function RequireAuth({ children }) {
  const location = useLocation();
  
  // 检查用户是否已登录
  if (!Meteor.userId()) {
    // 将当前位置保存在重定向中，以便登录后返回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// 已登录用户路由守卫组件 (防止已登录用户访问登录/注册页)
function RedirectIfLoggedIn({ children }) {
  const location = useLocation();
  const { state } = location;
  
  if (Meteor.userId()) {
    // 如果有来源位置，登录后返回该位置；否则返回首页
    return <Navigate to={state?.from?.pathname || '/'} replace />;
  }
  
  return children;
}

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  if (!container) {
    console.error('找不到ID为react-target的DOM元素');
    return;
  }
  
  const root = createRoot(container);
  
  root.render(
    <Router>
        <Routes>
          {/* 主页面 - 需要登录 */}
          <Route path="/" element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          } />
          
          {/* 设置页面 - 需要登录 */}
          <Route path="/settings" element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          } />
          
          {/* 设置页面带参数 - 需要登录 */}
          <Route path="/settings/:tab" element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          } />
          
          {/* 登录页面 - 已登录用户将被重定向 */}
          <Route path="/login" element={
            <RedirectIfLoggedIn>
              <LoginPage />
            </RedirectIfLoggedIn>
          } />
          
          {/* 注册页面 - 已登录用户将被重定向 */}
          <Route path="/register" element={
            <RedirectIfLoggedIn>
              <RegisterPage />
            </RedirectIfLoggedIn>
          } />
          
          {/* 404页面 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </Router>
  );
});