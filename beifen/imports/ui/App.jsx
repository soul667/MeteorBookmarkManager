import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 全局应用容器
const App = ({ children }) => {
  // 跟踪用户主题偏好
  const { darkMode } = useTracker(() => {
    const user = Meteor.user();
    return {
      darkMode: user?.profile?.preferences?.darkMode || false
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
        {children}
      </AntApp>
    </ConfigProvider>
  );
};

export default App;