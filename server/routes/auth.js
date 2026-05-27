const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, phone, email } = req.body;
    
    // 检查用户是否已存在
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR phone = ?',
      [username, phone]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '用户名或手机号已存在'
      });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password, phone, email, created_at) VALUES (?, ?, ?, ?, NOW())',
      [username, hashedPassword, phone, email]
    );
    
    // 创建默认家庭
    const [familyResult] = await pool.query(
      'INSERT INTO families (name, creator_id, created_at) VALUES (?, ?, NOW())',
      [`${username}的家庭`, result.insertId]
    );
    
    // 将用户添加到家庭
    await pool.query(
      'INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [familyResult.insertId, result.insertId, 'admin']
    );
    
    res.json({
      code: 200,
      message: '注册成功',
      data: { userId: result.insertId }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      message: '注册失败'
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR phone = ?',
      [username, username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    // 生成JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // 更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败'
    });
  }
});

// 获取当前用户信息
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, phone, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    res.json({
      code: 200,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    });
  }
});

// 修改密码
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const [users] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    const isValid = await bcrypt.compare(oldPassword, users[0].password);
    if (!isValid) {
      return res.status(400).json({
        code: 400,
        message: '原密码错误'
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.userId]
    );
    
    res.json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      code: 500,
      message: '修改密码失败'
    });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { email, avatar } = req.body;
    
    await pool.query(
      'UPDATE users SET email = ?, avatar = ? WHERE id = ?',
      [email, avatar, req.user.userId]
    );
    
    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新失败'
    });
  }
});

// 头像上传
router.post('/avatar', authMiddleware, (req, res, next) => {
  req.uploadSubDir = 'avatars';
  next();
}, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择图片' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.userId]);
    res.json({ code: 200, data: { url: avatarUrl }, message: '上传成功' });
  } catch (error) {
    console.error('头像上传错误:', error);
    res.status(500).json({ code: 500, message: '上传失败' });
  }
});

module.exports = router;
