const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// 获取所有家庭成员
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [members] = await pool.query(`
      SELECT m.*, 
             TIMESTAMPDIFF(YEAR, m.birth_date, CURDATE()) as age
      FROM health_members m
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `, [req.user.userId]);
    
    res.json({
      code: 200,
      data: members
    });
  } catch (error) {
    console.error('获取成员列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取成员列表失败'
    });
  }
});

// 添加家庭成员
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, relation, gender, birth_date, phone, avatar } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO health_members 
       (user_id, name, relation, gender, birth_date, phone, avatar, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [req.user.userId, name, relation, gender, birth_date, phone, avatar]
    );
    
    res.json({
      code: 200,
      message: '添加成功',
      data: { memberId: result.insertId }
    });
  } catch (error) {
    console.error('添加成员错误:', error);
    res.status(500).json({
      code: 500,
      message: '添加成员失败'
    });
  }
});

// 获取单个成员详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [members] = await pool.query(`
      SELECT m.*, 
             TIMESTAMPDIFF(YEAR, m.birth_date, CURDATE()) as age
      FROM health_members m
      WHERE m.id = ? AND m.user_id = ?
    `, [req.params.id, req.user.userId]);
    
    if (members.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '成员不存在'
      });
    }
    
    res.json({
      code: 200,
      data: members[0]
    });
  } catch (error) {
    console.error('获取成员详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取成员详情失败'
    });
  }
});

// 更新成员信息
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, relation, gender, birth_date, phone, avatar } = req.body;
    
    const [result] = await pool.query(
      `UPDATE health_members 
       SET name = ?, relation = ?, gender = ?, birth_date = ?, phone = ?, avatar = ?
       WHERE id = ? AND user_id = ?`,
      [name, relation, gender, birth_date, phone, avatar, req.params.id, req.user.userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '成员不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新成员错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新成员失败'
    });
  }
});

// 删除成员
router.delete('/:id', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const memberId = req.params.id;

    const [members] = await conn.query(
      'SELECT id FROM health_members WHERE id = ? AND user_id = ?',
      [memberId, req.user.userId]
    );
    
    if (members.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '成员不存在'
      });
    }

    await conn.beginTransaction();

    // 兼容未正确建立 ON DELETE CASCADE 的客户数据库，手动清理所有关联数据。
    await conn.query('DELETE FROM health_data WHERE member_id = ?', [memberId]);
    await conn.query('DELETE FROM health_alerts WHERE member_id = ?', [memberId]);
    await conn.query('DELETE FROM medical_records WHERE member_id = ?', [memberId]);
    await conn.query('DELETE FROM checkup_reports WHERE member_id = ?', [memberId]);
    await conn.query('DELETE FROM appointments WHERE member_id = ?', [memberId]);
    await conn.query('DELETE FROM user_devices WHERE member_id = ?', [memberId]);

    await conn.query(
      'DELETE FROM health_members WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    await conn.commit();
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('删除成员错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除成员失败'
    });
  } finally {
    conn.release();
  }
});

// 上传成员头像
router.post('/:id/avatar', authMiddleware, (req, res, next) => {
  req.uploadSubDir = 'avatars';
  next();
}, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件'
      });
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    await pool.query(
      'UPDATE health_members SET avatar = ? WHERE id = ? AND user_id = ?',
      [avatarUrl, req.params.id, req.user.userId]
    );
    
    res.json({
      code: 200,
      message: '上传成功',
      data: { avatar: avatarUrl }
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    res.status(500).json({
      code: 500,
      message: '上传失败'
    });
  }
});

module.exports = router;
