// 更新路由配置，添加设置页面路由

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  
  root.render(
    <Router>
        <Routes>
          <Route path="/" element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          } />
          <Route path="/settings" element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          } />
          <Route path="/settings/:tab" element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

    </Router>
  );
});