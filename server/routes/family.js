const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const parseValue = (val) => typeof val === 'string' ? JSON.parse(val) : val;

// 获取用户的家庭列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [families] = await pool.query(`
      SELECT f.*, fm.role as user_role
      FROM families f
      JOIN family_members fm ON f.id = fm.family_id
      WHERE fm.user_id = ?
    `, [req.user.userId]);
    
    res.json({
      code: 200,
      data: families
    });
  } catch (error) {
    console.error('获取家庭列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取家庭列表失败'
    });
  }
});

// 创建家庭
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO families (name, creator_id, created_at) VALUES (?, ?, NOW())',
      [name, req.user.userId]
    );
    
    // 将创建者添加为管理员
    await pool.query(
      'INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [result.insertId, req.user.userId, 'admin']
    );
    
    res.json({
      code: 200,
      message: '创建成功',
      data: { familyId: result.insertId }
    });
  } catch (error) {
    console.error('创建家庭错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建家庭失败'
    });
  }
});

// 获取家庭成员列表
router.get('/:familyId/members', authMiddleware, async (req, res) => {
  try {
    const [members] = await pool.query(`
      SELECT u.id, u.username, u.phone, u.avatar, fm.role, fm.joined_at
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = ?
    `, [req.params.familyId]);
    
    res.json({
      code: 200,
      data: members
    });
  } catch (error) {
    console.error('获取家庭成员错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取家庭成员失败'
    });
  }
});

// 获取家庭内可共享的健康档案成员
router.get('/:familyId/health-members', authMiddleware, async (req, res) => {
  try {
    const [memberCheck] = await pool.query(
      'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
      [req.params.familyId, req.user.userId]
    );

    if (memberCheck.length === 0) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该家庭数据'
      });
    }

    const [members] = await pool.query(`
      SELECT hm.*, u.username as owner_username, u.id as owner_user_id
      FROM health_members hm
      JOIN family_members fm ON hm.user_id = fm.user_id
      JOIN users u ON hm.user_id = u.id
      WHERE fm.family_id = ?
      ORDER BY u.id ASC, hm.id ASC
    `, [req.params.familyId]);

    res.json({
      code: 200,
      data: members
    });
  } catch (error) {
    console.error('获取家庭健康档案成员错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取健康档案成员失败'
    });
  }
});

// 邀请成员加入家庭
router.post('/:familyId/invite', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    
    // 检查是否是管理员
    const [adminCheck] = await pool.query(
      'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
      [req.params.familyId, req.user.userId]
    );
    
    if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权邀请成员'
      });
    }
    
    // 查找被邀请用户
    const [users] = await pool.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    // 检查是否已是成员
    const [existing] = await pool.query(
      'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
      [req.params.familyId, users[0].id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该用户已是家庭成员'
      });
    }
    
    // 创建邀请
    await pool.query(
      'INSERT INTO family_invitations (family_id, inviter_id, invitee_id, status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [req.params.familyId, req.user.userId, users[0].id, 'pending']
    );
    
    res.json({
      code: 200,
      message: '邀请已发送'
    });
  } catch (error) {
    console.error('邀请成员错误:', error);
    res.status(500).json({
      code: 500,
      message: '邀请失败'
    });
  }
});

// 获取我的邀请列表
router.get('/invitations/my', authMiddleware, async (req, res) => {
  try {
    const [invitations] = await pool.query(`
      SELECT fi.*, f.name as family_name, u.username as inviter_name
      FROM family_invitations fi
      JOIN families f ON fi.family_id = f.id
      JOIN users u ON fi.inviter_id = u.id
      WHERE fi.invitee_id = ? AND fi.status = 'pending'
    `, [req.user.userId]);
    
    res.json({
      code: 200,
      data: invitations
    });
  } catch (error) {
    console.error('获取邀请列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取邀请列表失败'
    });
  }
});

// 接受邀请
router.put('/invitations/:id/accept', authMiddleware, async (req, res) => {
  try {
    const [invitations] = await pool.query(
      'SELECT * FROM family_invitations WHERE id = ? AND invitee_id = ? AND status = ?',
      [req.params.id, req.user.userId, 'pending']
    );
    
    if (invitations.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '邀请不存在或已处理'
      });
    }
    
    const invitation = invitations[0];
    
    // 更新邀请状态
    await pool.query(
      'UPDATE family_invitations SET status = ? WHERE id = ?',
      ['accepted', req.params.id]
    );
    
    // 添加为家庭成员
    await pool.query(
      'INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [invitation.family_id, req.user.userId, 'member']
    );
    
    res.json({
      code: 200,
      message: '已加入家庭'
    });
  } catch (error) {
    console.error('接受邀请错误:', error);
    res.status(500).json({
      code: 500,
      message: '操作失败'
    });
  }
});

// 拒绝邀请
router.put('/invitations/:id/reject', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE family_invitations SET status = ? WHERE id = ? AND invitee_id = ?',
      ['rejected', req.params.id, req.user.userId]
    );
    
    res.json({
      code: 200,
      message: '已拒绝邀请'
    });
  } catch (error) {
    console.error('拒绝邀请错误:', error);
    res.status(500).json({
      code: 500,
      message: '操作失败'
    });
  }
});

// 移除家庭成员
router.delete('/:familyId/members/:userId', authMiddleware, async (req, res) => {
  try {
    // 检查是否是管理员
    const [adminCheck] = await pool.query(
      'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
      [req.params.familyId, req.user.userId]
    );
    
    if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权移除成员'
      });
    }
    
    // 不能移除自己
    if (parseInt(req.params.userId) === req.user.userId) {
      return res.status(400).json({
        code: 400,
        message: '不能移除自己'
      });
    }
    
    await pool.query(
      'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
      [req.params.familyId, req.params.userId]
    );
    
    res.json({
      code: 200,
      message: '移除成功'
    });
  } catch (error) {
    console.error('移除成员错误:', error);
    res.status(500).json({
      code: 500,
      message: '移除失败'
    });
  }
});

// 获取家庭成员的健康数据（共享功能）
router.get('/:familyId/health/:memberId', authMiddleware, async (req, res) => {
  try {
    // 检查是否是家庭成员
    const [memberCheck] = await pool.query(
      'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
      [req.params.familyId, req.user.userId]
    );
    
    if (memberCheck.length === 0) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该数据'
      });
    }
    
    // 检查目标成员是否属于该家庭的用户
    const [targetMember] = await pool.query(`
      SELECT hm.* FROM health_members hm
      JOIN family_members fm ON hm.user_id = fm.user_id
      WHERE hm.id = ? AND fm.family_id = ?
    `, [req.params.memberId, req.params.familyId]);
    
    if (targetMember.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '成员不存在或不在该家庭中'
      });
    }
    
    // 获取健康数据
    const [healthData] = await pool.query(`
      SELECT * FROM health_data 
      WHERE member_id = ?
      ORDER BY record_date DESC LIMIT 30
    `, [req.params.memberId]);
    
    res.json({
      code: 200,
      data: {
        member: targetMember[0],
        healthData: healthData.map(item => ({
          ...item,
          value: parseValue(item.value)
        }))
      }
    });
  } catch (error) {
    console.error('获取家庭成员健康数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取数据失败'
    });
  }
});

// 退出家庭
router.delete('/:familyId/leave', authMiddleware, async (req, res) => {
  try {
    // 检查是否是创建者
    const [family] = await pool.query(
      'SELECT creator_id FROM families WHERE id = ?',
      [req.params.familyId]
    );
    
    if (family.length > 0 && family[0].creator_id === req.user.userId) {
      return res.status(400).json({
        code: 400,
        message: '创建者不能退出家庭，请先转让管理权限或解散家庭'
      });
    }
    
    await pool.query(
      'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
      [req.params.familyId, req.user.userId]
    );
    
    res.json({
      code: 200,
      message: '已退出家庭'
    });
  } catch (error) {
    console.error('退出家庭错误:', error);
    res.status(500).json({
      code: 500,
      message: '退出失败'
    });
  }
});

module.exports = router;
