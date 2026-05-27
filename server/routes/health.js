const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const parseValue = (val) => typeof val === 'string' ? JSON.parse(val) : val;

async function ensureOwnMember(memberId, userId) {
  const [members] = await pool.query(
    'SELECT id FROM health_members WHERE id = ? AND user_id = ?',
    [memberId, userId]
  );
  return members.length > 0;
}

// 获取成员的健康数据列表
router.get('/data/:memberId', authMiddleware, async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 30 } = req.query;
    const hasPermission = await ensureOwnMember(req.params.memberId, req.user.userId);
    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该成员数据'
      });
    }
    
    let sql = `
      SELECT * FROM health_data 
      WHERE member_id = ? 
    `;
    const params = [req.params.memberId];
    
    if (type) {
      sql += ' AND data_type = ?';
      params.push(type);
    }
    
    if (startDate) {
      sql += ' AND record_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND record_date <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY record_date DESC, created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [data] = await pool.query(sql, params);
    
    const processedData = data.map(item => ({
      ...item,
      value: parseValue(item.value)
    }));
    
    res.json({
      code: 200,
      data: processedData
    });
  } catch (error) {
    console.error('获取健康数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取健康数据失败'
    });
  }
});

// 添加健康数据（手动录入）
router.post('/data', authMiddleware, async (req, res) => {
  try {
    const { member_id, data_type, value, unit, record_date, remark } = req.body;
    
    // 验证成员归属
    const [members] = await pool.query(
      'SELECT id FROM health_members WHERE id = ? AND user_id = ?',
      [member_id, req.user.userId]
    );
    
    if (members.length === 0) {
      return res.status(403).json({
        code: 403,
        message: '无权操作该成员数据'
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO health_data 
       (member_id, data_type, value, unit, record_date, source, remark, created_at) 
       VALUES (?, ?, ?, ?, ?, 'manual', ?, NOW())`,
      [member_id, data_type, JSON.stringify(value), unit, record_date, remark]
    );
    
    // 检查是否需要预警
    await checkHealthAlert(member_id, data_type, value);
    
    res.json({
      code: 200,
      message: '添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加健康数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '添加健康数据失败'
    });
  }
});

// 批量添加健康数据（设备同步）
router.post('/data/batch', authMiddleware, async (req, res) => {
  try {
    const { member_id, data_list, source } = req.body;
    
    // 验证成员归属
    const [members] = await pool.query(
      'SELECT id FROM health_members WHERE id = ? AND user_id = ?',
      [member_id, req.user.userId]
    );
    
    if (members.length === 0) {
      return res.status(403).json({
        code: 403,
        message: '无权操作该成员数据'
      });
    }
    
    const values = data_list.map(item => [
      member_id,
      item.data_type,
      JSON.stringify(item.value),
      item.unit,
      item.record_date,
      source || 'device',
      item.remark || null
    ]);
    
    await pool.query(
      `INSERT INTO health_data 
       (member_id, data_type, value, unit, record_date, source, remark, created_at) 
       VALUES ?`,
      [values.map(v => [...v, new Date()])]
    );
    
    res.json({
      code: 200,
      message: '同步成功',
      data: { count: data_list.length }
    });
  } catch (error) {
    console.error('批量添加健康数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '同步健康数据失败'
    });
  }
});

// 删除健康数据
router.delete('/data/:id', authMiddleware, async (req, res) => {
  try {
    const [data] = await pool.query(`
      SELECT hd.id FROM health_data hd
      JOIN health_members hm ON hd.member_id = hm.id
      WHERE hd.id = ? AND hm.user_id = ?
    `, [req.params.id, req.user.userId]);
    
    if (data.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '数据不存在'
      });
    }
    
    await pool.query('DELETE FROM health_data WHERE id = ?', [req.params.id]);
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除健康数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除健康数据失败'
    });
  }
});

// 获取最新健康指标
router.get('/latest/:memberId', authMiddleware, async (req, res) => {
  try {
    const hasPermission = await ensureOwnMember(req.params.memberId, req.user.userId);
    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该成员数据'
      });
    }

    const dataTypes = ['height', 'weight', 'blood_pressure', 'blood_sugar', 'heart_rate', 'sleep', 'steps'];
    const latestData = {};
    
    for (const type of dataTypes) {
      const [data] = await pool.query(`
        SELECT * FROM health_data 
        WHERE member_id = ? AND data_type = ?
        ORDER BY record_date DESC, created_at DESC
        LIMIT 1
      `, [req.params.memberId, type]);
      
      if (data.length > 0) {
        latestData[type] = {
          ...data[0],
          value: parseValue(data[0].value)
        };
      }
    }
    
    res.json({
      code: 200,
      data: latestData
    });
  } catch (error) {
    console.error('获取最新健康指标错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取最新健康指标失败'
    });
  }
});

// 健康预警检查函数
async function checkHealthAlert(memberId, dataType, value) {
  const alertRules = {
    blood_pressure: {
      check: (v) => {
        const val = typeof v === 'object' ? v : JSON.parse(v);
        return val.systolic > 140 || val.systolic < 90 || val.diastolic > 90 || val.diastolic < 60;
      },
      message: '血压异常，请注意监测'
    },
    blood_sugar: {
      check: (v) => {
        const val = typeof v === 'object' ? v : JSON.parse(v);
        return val.value > 7.0 || val.value < 3.9;
      },
      message: '血糖异常，请注意监测'
    },
    heart_rate: {
      check: (v) => {
        const val = typeof v === 'object' ? v : JSON.parse(v);
        return val.value > 100 || val.value < 60;
      },
      message: '心率异常，请注意休息'
    }
  };
  
  const rule = alertRules[dataType];
  if (rule && rule.check(value)) {
    await pool.query(
      `INSERT INTO health_alerts 
       (member_id, alert_type, message, data_type, data_value, status, created_at) 
       VALUES (?, 'warning', ?, ?, ?, 'unread', NOW())`,
      [memberId, rule.message, dataType, JSON.stringify(value)]
    );
  }
}

module.exports = router;
