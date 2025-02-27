import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import nodemailer from 'nodemailer';

// 存储验证码信息
const VerificationCodes = new Mongo.Collection('verification_codes');

// 创建邮件传输器
let transporter = null;

// 初始化邮件传输器
const initializeTransporter = () => {
  const emailConfig = Meteor.settings.private?.emailConfig;
  
  if (!emailConfig?.smtpConfig) {
    console.warn('未配置SMTP设置，邮件功能将不可用');
    return;
  }

  try {
    const config = {
      ...emailConfig.smtpConfig,
      // 添加更多SMTP配置
      tls: {
        rejectUnauthorized: false // 开发环境可能需要
      },
      debug: true, // 启用调试
      logger: true // 启用日志
    };

    console.log('邮件配置:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user
    });

    transporter = nodemailer.createTransport(config);

    // 验证配置
    transporter.verify(function(error, success) {
      if (error) {
        console.error('邮件服务验证失败:', error);
      } else {
        console.log('邮件服务配置成功，服务器已就绪');
      }
    });
  } catch (error) {
    console.error('邮件服务配置错误:', error);
  }
};

// 设置索引以自动过期
Meteor.startup(() => {
  if (Meteor.isServer) {
    VerificationCodes.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 600 }); // 10分钟后过期
    initializeTransporter();
  }
});

// 生成验证码
const generateVerificationCode = () => {
  return Random.id(6).toUpperCase(); // 生成6位大写字母和数字组合的验证码
};

// 邮件HTML模板
const getEmailTemplate = (code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>智能书签管家 - 邮箱验证</title>
  <style>
    body {
      font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .code {
      background-color: #1890ff;
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      letter-spacing: 4px;
    }
    .footer {
      font-size: 12px;
      color: #666;
      text-align: center;
      margin-top: 20px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>欢迎使用智能书签管家</h2>
    </div>
    
    <p>您好！</p>
    
    <p>感谢您注册智能书签管家。请使用以下验证码完成邮箱验证：</p>
    
    <div class="code">${code}</div>
    
    <p>请注意：</p>
    <ul>
      <li>验证码将在10分钟后失效</li>
      <li>如果这不是您的操作，请忽略此邮件</li>
      <li>请勿将验证码告诉他人</li>
    </ul>
    
    <div class="footer">
      <p>这是一封自动生成的邮件，请勿直接回复</p>
      <p>© ${new Date().getFullYear()} 智能书签管家 版权所有</p>
    </div>
  </div>
</body>
</html>
`;

// 发送邮件
const sendMail = async (to, subject, html) => {
  if (!transporter) {
    console.error('邮件服务未初始化，尝试重新初始化');
    initializeTransporter();
    if (!transporter) {
      throw new Meteor.Error('mail-not-configured', '邮件服务未配置');
    }
  }

  const emailConfig = Meteor.settings.private?.emailConfig;
  const mailOptions = {
    from: {
      name: emailConfig?.serviceName || '智能书签管家',
      address: emailConfig?.smtpConfig?.auth?.user || 'noreply@bookmarkmanager.com'
    },
    to,
    subject,
    html,
    // 添加额外配置
    priority: 'high',
    encoding: 'utf-8'
  };

  try {
    console.log('准备发送邮件到:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return info;
  } catch (error) {
    console.error('发送邮件失败:', error);
    // 尝试重新初始化传输器
    initializeTransporter();
    throw new Meteor.Error('mail-send-failed', '发送邮件失败，请稍后重试');
  }
};

// Meteor方法
Meteor.methods({
  async 'email.sendVerificationCode'(email) {
    check(email, String);
    
    if (!email) {
      throw new Meteor.Error('invalid-email', '请提供有效的邮箱地址');
    }

    // 防止频繁发送
    const lastCode = await VerificationCodes.findOneAsync(
      { 
        email,
        createdAt: {
          $gte: new Date(new Date().getTime() - 60 * 1000) // 1分钟内
        }
      },
      {
        sort: { createdAt: -1 }
      }
    );

    if (lastCode) {
      throw new Meteor.Error('too-many-requests', '请等待1分钟后再试');
    }

    // 生成新的验证码
    const code = generateVerificationCode();
    let insertResult;
    
    try {
      // 先存储验证码
      insertResult = await VerificationCodes.insertAsync({
        email,
        code,
        createdAt: new Date(),
        used: false
      });

      console.log('验证码已存储:', insertResult);

      // 发送验证码邮件
      await sendMail(
        email,
        '智能书签管家 - 邮箱验证码',
        getEmailTemplate(code)
      );

      console.log('验证码已发送到:', email);
      return true;
    } catch (error) {
      console.error('发送验证码失败:', error);
      // 如果邮件发送失败，删除已存储的验证码
      if (insertResult) {
        await VerificationCodes.removeAsync({ _id: insertResult });
      }
      throw new Meteor.Error('verification-failed', '验证码发送失败，请检查邮箱地址是否正确');
    }
  },

  async 'email.verifyCode'(email, code) {
    check(email, String);
    check(code, String);

    // 查找验证码记录
    const verificationRecord = await VerificationCodes.findOneAsync({
      email,
      code: code.toUpperCase(),
      used: false,
      createdAt: {
        $gte: new Date(new Date().getTime() - 10 * 60 * 1000) // 10分钟内的验证码
      }
    });

    if (!verificationRecord) {
      console.log('验证码验证失败:', {
        email,
        attemptedCode: code.toUpperCase(),
        hasVerificationRecord: !!verificationRecord,
        currentTime: new Date(),
      });
      throw new Meteor.Error('invalid-code', '验证码无效或已过期，请重新获取验证码');
    }

    try {
      // 标记验证码为已使用
      await VerificationCodes.updateAsync(verificationRecord._id, {
        $set: { 
          used: true,
          usedAt: new Date()
        }
      });
      console.log('验证码验证成功:', {
        email,
        verificationId: verificationRecord._id
      });
    } catch (error) {
      console.error('更新验证码状态失败:', error);
      throw new Meteor.Error('verification-error', '验证码状态更新失败');
    }

    return true;
  }
});

// 确保只有服务器端可以访问验证码集合
if (Meteor.isServer) {
  Meteor.publish(null, function () {
    return null;
  });
}
