const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 获取已绑定的设备列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [devices] = await pool.query(`
      SELECT * FROM user_devices 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.userId]);
    
    res.json({
      code: 200,
      data: devices
    });
  } catch (error) {
    console.error('获取设备列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取设备列表失败'
    });
  }
});

// 绑定设备
router.post('/bind', authMiddleware, async (req, res) => {
  try {
    const { device_type, device_name, device_id, member_id } = req.body;
    
    // 检查设备是否已绑定
    const [existing] = await pool.query(
      'SELECT id FROM user_devices WHERE device_id = ?',
      [device_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该设备已被绑定'
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO user_devices 
       (user_id, member_id, device_type, device_name, device_id, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
      [req.user.userId, member_id, device_type, device_name, device_id]
    );
    
    res.json({
      code: 200,
      message: '绑定成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('绑定设备错误:', error);
    res.status(500).json({
      code: 500,
      message: '绑定设备失败'
    });
  }
});

// 获取支持的设备类型
router.get('/types', authMiddleware, async (req, res) => {
  try {
    const deviceTypes = [
      { type: 'smart_band', name: '智能手环', icon: 'watch', supportedData: ['heart_rate', 'steps', 'sleep'] },
      { type: 'blood_pressure', name: '智能血压计', icon: 'heart', supportedData: ['blood_pressure'] },
      { type: 'blood_sugar', name: '智能血糖仪', icon: 'droplet', supportedData: ['blood_sugar'] },
      { type: 'scale', name: '智能体重秤', icon: 'scale', supportedData: ['weight'] },
      { type: 'thermometer', name: '智能体温计', icon: 'thermometer', supportedData: ['temperature'] }
    ];
    
    res.json({
      code: 200,
      data: deviceTypes
    });
  } catch (error) {
    console.error('获取设备类型错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取设备类型失败'
    });
  }
});

// 解绑设备
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_devices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    
    res.json({
      code: 200,
      message: '解绑成功'
    });
  } catch (error) {
    console.error('解绑设备错误:', error);
    res.status(500).json({
      code: 500,
      message: '解绑设备失败'
    });
  }
});

// 同步设备数据（模拟智能设备数据同步）
router.post('/:id/sync', authMiddleware, async (req, res) => {
  try {
    const [devices] = await pool.query(
      'SELECT * FROM user_devices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    
    if (devices.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '设备不存在'
      });
    }
    
    const device = devices[0];
    
    // 模拟从设备获取数据
    const mockData = generateMockDeviceData(device.device_type);
    
    // 保存数据
    for (const item of mockData) {
      await pool.query(
        `INSERT INTO health_data 
         (member_id, data_type, value, unit, record_date, source, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [device.member_id, item.data_type, JSON.stringify(item.value), item.unit, item.record_date, 'device']
      );
    }
    
    // 更新设备最后同步时间
    await pool.query(
      'UPDATE user_devices SET last_sync = NOW() WHERE id = ?',
      [req.params.id]
    );
    
    res.json({
      code: 200,
      message: '同步成功',
      data: { count: mockData.length }
    });
  } catch (error) {
    console.error('同步设备数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '同步失败'
    });
  }
});

// 模拟生成设备数据
function generateMockDeviceData(deviceType) {
  const today = new Date().toISOString().split('T')[0];
  const data = [];
  
  switch (deviceType) {
    case 'smart_band':
      data.push({
        data_type: 'heart_rate',
        value: { value: Math.floor(Math.random() * 30) + 60 },
        unit: 'bpm',
        record_date: today
      });
      data.push({
        data_type: 'steps',
        value: { value: Math.floor(Math.random() * 5000) + 3000 },
        unit: '步',
        record_date: today
      });
      data.push({
        data_type: 'sleep',
        value: { 
          duration: Math.floor(Math.random() * 3) + 6,
          deep: Math.floor(Math.random() * 2) + 1,
          light: Math.floor(Math.random() * 3) + 3
        },
        unit: '小时',
        record_date: today
      });
      break;
    case 'blood_pressure':
      data.push({
        data_type: 'blood_pressure',
        value: { 
          systolic: Math.floor(Math.random() * 30) + 110,
          diastolic: Math.floor(Math.random() * 20) + 70
        },
        unit: 'mmHg',
        record_date: today
      });
      break;
    case 'blood_sugar':
      data.push({
        data_type: 'blood_sugar',
        value: { value: parseFloat((Math.random() * 3 + 4).toFixed(1)) },
        unit: 'mmol/L',
        record_date: today
      });
      break;
    case 'scale':
      data.push({
        data_type: 'weight',
        value: { value: parseFloat((Math.random() * 20 + 55).toFixed(1)) },
        unit: 'kg',
        record_date: today
      });
      break;
    case 'thermometer':
      data.push({
        data_type: 'temperature',
        value: { value: parseFloat((Math.random() * 1 + 36).toFixed(1)) },
        unit: '°C',
        record_date: today
      });
      break;
  }
  
  return data;
}

module.exports = router;
