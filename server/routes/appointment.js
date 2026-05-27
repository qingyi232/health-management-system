const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 获取挂号记录列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, member_id } = req.query;
    
    let sql = `
      SELECT a.*, 
             h.name as hospital_name,
             hd.name as department_name,
             d.name as doctor_name,
             d.title as doctor_title,
             hm.name as member_name
      FROM appointments a
      JOIN hospitals h ON a.hospital_id = h.id
      JOIN hospital_departments hd ON a.department_id = hd.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN health_members hm ON a.member_id = hm.id
      WHERE hm.user_id = ?
    `;
    const params = [req.user.userId];
    
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    
    if (member_id) {
      sql += ' AND a.member_id = ?';
      params.push(member_id);
    }
    
    sql += ' ORDER BY a.appointment_date DESC, a.created_at DESC';
    
    const [appointments] = await pool.query(sql, params);
    
    res.json({
      code: 200,
      data: appointments
    });
  } catch (error) {
    console.error('获取挂号记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取挂号记录失败'
    });
  }
});

// 创建挂号
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { member_id, hospital_id, department_id, doctor_id, appointment_date, time_slot, symptoms } = req.body;
    
    // 验证成员归属
    const [members] = await pool.query(
      'SELECT id FROM health_members WHERE id = ? AND user_id = ?',
      [member_id, req.user.userId]
    );
    
    if (members.length === 0) {
      return res.status(403).json({
        code: 403,
        message: '无权为该成员挂号'
      });
    }
    
    // 检查是否有可用号源
    const [schedules] = await pool.query(`
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = ? AND schedule_date = ? AND time_slot = ? AND remaining > 0
    `, [doctor_id, appointment_date, time_slot]);
    
    if (schedules.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '该时段已无号源'
      });
    }
    
    // 生成挂号单号
    const orderNo = 'GH' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    // 创建挂号记录
    const [result] = await pool.query(
      `INSERT INTO appointments 
       (order_no, member_id, hospital_id, department_id, doctor_id, appointment_date, time_slot, symptoms, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [orderNo, member_id, hospital_id, department_id, doctor_id, appointment_date, time_slot, symptoms]
    );
    
    // 减少号源
    await pool.query(
      'UPDATE doctor_schedules SET remaining = remaining - 1 WHERE doctor_id = ? AND schedule_date = ? AND time_slot = ?',
      [doctor_id, appointment_date, time_slot]
    );
    
    res.json({
      code: 200,
      message: '挂号成功',
      data: { 
        id: result.insertId,
        orderNo 
      }
    });
  } catch (error) {
    console.error('创建挂号错误:', error);
    res.status(500).json({
      code: 500,
      message: '挂号失败'
    });
  }
});

// 获取可预约时段（无排班时自动生成）
router.get('/slots/:doctorId', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const doctorId = req.params.doctorId;
    
    let [slots] = await pool.query(`
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = ? AND schedule_date = ? AND remaining > 0
      ORDER BY time_slot ASC
    `, [doctorId, date]);
    
    if (slots.length === 0) {
      const [doctors] = await pool.query('SELECT title FROM doctors WHERE id = ?', [doctorId]);
      const title = doctors.length > 0 ? doctors[0].title : '';
      const price = title === '主任医师' ? 50 : title === '副主任医师' ? 30 : 15;

      const [existing] = await pool.query(
        'SELECT id FROM doctor_schedules WHERE doctor_id = ? AND schedule_date = ?',
        [doctorId, date]
      );

      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO doctor_schedules (doctor_id, schedule_date, time_slot, total, remaining, price) VALUES 
           (?, ?, 'morning', 20, 20, ?),
           (?, ?, 'afternoon', 20, 20, ?)`,
          [doctorId, date, price, doctorId, date, price]
        );
      }
      
      [slots] = await pool.query(`
        SELECT * FROM doctor_schedules 
        WHERE doctor_id = ? AND schedule_date = ? AND remaining > 0
        ORDER BY time_slot ASC
      `, [doctorId, date]);
    }
    
    res.json({
      code: 200,
      data: slots
    });
  } catch (error) {
    console.error('获取可预约时段错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取可预约时段失败'
    });
  }
});

// 获取挂号详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [appointments] = await pool.query(`
      SELECT a.*, 
             h.name as hospital_name, h.address as hospital_address, h.phone as hospital_phone,
             hd.name as department_name, hd.location as department_location,
             d.name as doctor_name, d.title as doctor_title, d.avatar as doctor_avatar,
             hm.name as member_name
      FROM appointments a
      JOIN hospitals h ON a.hospital_id = h.id
      JOIN hospital_departments hd ON a.department_id = hd.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN health_members hm ON a.member_id = hm.id
      WHERE a.id = ?
    `, [req.params.id]);
    
    if (appointments.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '挂号记录不存在'
      });
    }
    
    res.json({
      code: 200,
      data: appointments[0]
    });
  } catch (error) {
    console.error('获取挂号详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取挂号详情失败'
    });
  }
});

// 取消挂号
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    // 获取挂号信息
    const [appointments] = await pool.query(
      'SELECT * FROM appointments WHERE id = ? AND status = ?',
      [req.params.id, 'pending']
    );
    
    if (appointments.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '挂号记录不存在或无法取消'
      });
    }
    
    const appointment = appointments[0];
    
    // 更新状态
    await pool.query(
      'UPDATE appointments SET status = ?, cancel_time = NOW() WHERE id = ?',
      ['cancelled', req.params.id]
    );
    
    // 恢复号源
    await pool.query(
      'UPDATE doctor_schedules SET remaining = remaining + 1 WHERE doctor_id = ? AND schedule_date = ? AND time_slot = ?',
      [appointment.doctor_id, appointment.appointment_date, appointment.time_slot]
    );
    
    res.json({
      code: 200,
      message: '取消成功'
    });
  } catch (error) {
    console.error('取消挂号错误:', error);
    res.status(500).json({
      code: 500,
      message: '取消挂号失败'
    });
  }
});

// 完成就诊
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE appointments SET status = ?, complete_time = NOW() WHERE id = ?',
      ['completed', req.params.id]
    );
    
    res.json({
      code: 200,
      message: '已完成就诊'
    });
  } catch (error) {
    console.error('完成就诊错误:', error);
    res.status(500).json({
      code: 500,
      message: '操作失败'
    });
  }
});

module.exports = router;
