const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const https = require('https');
const http = require('http');

const AMAP_KEY = process.env.AMAP_KEY || '';

// 高德地图API请求封装
function amapRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `https://restapi.amap.com/v3${path}&key=${AMAP_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// 计算两点间距离(km)
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 获取医院列表（模拟数据）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { keyword, department, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM hospitals WHERE status = 1';
    const params = [];
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR address LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY distance ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [hospitals] = await pool.query(sql, params);
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM hospitals WHERE status = 1';
    if (keyword) {
      countSql += ' AND (name LIKE ? OR address LIKE ?)';
    }
    const [countResult] = await pool.query(countSql, keyword ? [`%${keyword}%`, `%${keyword}%`] : []);
    
    res.json({
      code: 200,
      data: {
        list: hospitals,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取医院列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取医院列表失败'
    });
  }
});

// 根据位置获取附近医院（结合高德API+模拟数据）
router.get('/nearby/list', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // 1. 获取数据库中的模拟医院，计算真实距离
    const [dbHospitals] = await pool.query('SELECT * FROM hospitals WHERE status = 1');
    const hospitalsWithDist = dbHospitals.map(h => ({
      ...h,
      distance: parseFloat(calcDistance(lat, lng, h.latitude, h.longitude).toFixed(1)),
      source: 'local'
    }));
    
    // 2. 通过高德API搜索附近真实医院
    let amapHospitals = [];
    if (AMAP_KEY) {
      try {
        const result = await amapRequest(
          `/place/around?location=${lng},${lat}&types=090100|090200&radius=${radius * 1000}&offset=10&page=1&extensions=all`
        );
        if (result.status === '1' && result.pois) {
          amapHospitals = result.pois.map((poi, idx) => ({
            id: 10000 + idx,
            name: poi.name,
            level: poi.type?.includes('三级') ? '三级甲等' : (poi.biz_ext?.rating ? '综合医院' : '医疗机构'),
            address: poi.address || poi.cityname + poi.adname,
            phone: poi.tel || '',
            latitude: parseFloat(poi.location.split(',')[1]),
            longitude: parseFloat(poi.location.split(',')[0]),
            distance: parseFloat((parseInt(poi.distance) / 1000).toFixed(1)),
            description: poi.biz_ext?.rating ? `评分: ${poi.biz_ext.rating}` : '',
            source: 'amap'
          }));
        }
      } catch (e) {
        console.error('高德API调用失败:', e.message);
      }
    }
    
    // 3. 合并并按距离排序
    const allHospitals = [...hospitalsWithDist, ...amapHospitals]
      .sort((a, b) => a.distance - b.distance);
    
    res.json({
      code: 200,
      data: allHospitals
    });
  } catch (error) {
    console.error('获取附近医院错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取附近医院失败'
    });
  }
});

// IP定位（根据用户IP获取大致位置，解决H5/开发环境定位不准问题）
router.get('/location/ip', authMiddleware, async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || '';
    const cleanIp = clientIp.replace('::ffff:', '');
    
    if (AMAP_KEY) {
      const ipParam = (cleanIp && cleanIp !== '127.0.0.1' && cleanIp !== '::1') ? `&ip=${cleanIp}` : '';
      const result = await amapRequest(`/ip?${ipParam}`);
      
      if (result.status === '1' && result.rectangle) {
        const rect = result.rectangle.split(';');
        const sw = rect[0].split(',');
        const ne = rect[1].split(',');
        const lng = (parseFloat(sw[0]) + parseFloat(ne[0])) / 2;
        const lat = (parseFloat(sw[1]) + parseFloat(ne[1])) / 2;
        
        return res.json({
          code: 200,
          data: {
            latitude: lat,
            longitude: lng,
            city: result.city || result.province || '',
            province: result.province || '',
            address: `${result.province || ''}${result.city || ''}`
          }
        });
      }
    }
    
    res.json({
      code: 200,
      data: { latitude: 0, longitude: 0, city: '', address: '' }
    });
  } catch (error) {
    console.error('IP定位错误:', error);
    res.json({
      code: 200,
      data: { latitude: 0, longitude: 0, city: '', address: '' }
    });
  }
});

// 高德逆地理编码（根据经纬度获取地址）
router.get('/geocode/reverse', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!lat || !lng) {
      return res.json({ code: 200, data: { address: '定位中...', city: '' } });
    }

    if (AMAP_KEY) {
      try {
        const result = await amapRequest(
          `/geocode/regeo?location=${lng},${lat}&extensions=base`
        );
        if (result.status === '1' && result.regeocode?.formatted_address) {
          return res.json({
            code: 200,
            data: {
              address: result.regeocode.formatted_address,
              city: result.regeocode.addressComponent?.city || result.regeocode.addressComponent?.province || ''
            }
          });
        }
      } catch (e) {
        console.error('高德逆地理编码失败:', e.message);
      }

      try {
        const ipResult = await amapRequest('/ip?');
        if (ipResult.status === '1' && (ipResult.city || ipResult.province)) {
          return res.json({
            code: 200,
            data: {
              address: `${ipResult.province || ''}${ipResult.city || ''}(IP定位)`,
              city: ipResult.city || ipResult.province || ''
            }
          });
        }
      } catch (e) {
        console.error('高德IP定位回退失败:', e.message);
      }
    }

    res.json({
      code: 200,
      data: { address: `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`, city: '' }
    });
  } catch (error) {
    console.error('逆地理编码错误:', error);
    res.json({ code: 200, data: { address: '当前位置', city: '' } });
  }
});

// 导入外部医院（高德搜索结果自动入库，生成默认科室、医生、排班）
router.post('/import', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { name, level, address, phone, latitude, longitude, distance } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '医院名称不能为空' });

    // 检查是否已导入过（按名称+地址去重）
    const [existing] = await conn.query(
      'SELECT id FROM hospitals WHERE name = ? AND address = ?', [name, address || '']
    );
    if (existing.length > 0) {
      return res.json({ code: 200, data: { id: existing[0].id }, message: '医院已存在' });
    }

    await conn.beginTransaction();

    // 1. 插入医院
    const [hospitalResult] = await conn.query(
      `INSERT INTO hospitals (name, level, address, phone, latitude, longitude, distance, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [name, level || '综合医院', address || '', phone || '', latitude || 0, longitude || 0, distance || 0, `${name}，提供专业医疗服务`]
    );
    const hospitalId = hospitalResult.insertId;

    // 2. 插入默认科室
    const defaultDepts = [
      ['内科', '内科常见疾病诊治', '门诊楼2层'],
      ['外科', '外科手术及诊治', '门诊楼3层'],
      ['儿科', '儿童疾病诊治', '门诊楼1层'],
      ['妇科', '妇科疾病诊治', '门诊楼2层'],
      ['急诊科', '24小时急诊服务', '1层'],
      ['中医科', '中医诊治调理', '门诊楼3层']
    ];
    const deptIds = [];
    for (const [dName, desc, loc] of defaultDepts) {
      const [r] = await conn.query(
        'INSERT INTO hospital_departments (hospital_id, name, description, location, status) VALUES (?, ?, ?, ?, 1)',
        [hospitalId, dName, desc, loc]
      );
      deptIds.push({ id: r.insertId, name: dName });
    }

    // 3. 插入默认医生（每个科室1-2名）
    const doctorTemplates = [
      { dept: '内科', doctors: [['张医生', '主任医师', '呼吸系统、消化系统疾病', '从医20年经验丰富'], ['王医生', '副主任医师', '心血管、高血压', '擅长慢性病管理']] },
      { dept: '外科', doctors: [['李医生', '主任医师', '普外科、微创手术', '外科专家']] },
      { dept: '儿科', doctors: [['陈医生', '主治医师', '儿童常见病、生长发育', '儿科专家']] },
      { dept: '妇科', doctors: [['周医生', '主任医师', '妇科炎症、妇科肿瘤', '妇科专家']] },
      { dept: '急诊科', doctors: [['韩医生', '副主任医师', '急危重症救治', '急诊医学专家']] },
      { dept: '中医科', doctors: [['刘医生', '副主任医师', '中医调理、养生保健', '中医经验丰富']] }
    ];
    const doctorIds = [];
    for (const tmpl of doctorTemplates) {
      const dept = deptIds.find(d => d.name === tmpl.dept);
      if (!dept) continue;
      for (const [dName, title, spec, intro] of tmpl.doctors) {
        const [r] = await conn.query(
          'INSERT INTO doctors (hospital_id, department_id, name, title, specialty, introduction, status) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [hospitalId, dept.id, dName, title, spec, intro]
        );
        doctorIds.push({ id: r.insertId, title });
      }
    }

    // 4. 为每个医生生成未来7天排班
    for (const doc of doctorIds) {
      const price = doc.title === '主任医师' ? 50 : doc.title === '副主任医师' ? 30 : 15;
      const values = [];
      const placeholders = [];
      for (let day = 0; day < 7; day++) {
        for (const slot of ['morning', 'afternoon']) {
          values.push(doc.id, day, slot, 20, 20, price);
          placeholders.push('(?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?, ?, ?)');
        }
      }
      await conn.query(
        `INSERT INTO doctor_schedules (doctor_id, schedule_date, time_slot, total, remaining, price) VALUES ${placeholders.join(',')}`,
        values
      );
    }

    await conn.commit();
    res.json({ code: 200, data: { id: hospitalId }, message: '医院导入成功' });
  } catch (error) {
    await conn.rollback();
    console.error('导入医院错误:', error);
    res.status(500).json({ code: 500, message: '导入医院失败' });
  } finally {
    conn.release();
  }
});

// 获取医生详情
router.get('/doctor/:id', authMiddleware, async (req, res) => {
  try {
    const [doctors] = await pool.query(`
      SELECT d.*, h.name as hospital_name, hd.name as department_name
      FROM doctors d
      JOIN hospitals h ON d.hospital_id = h.id
      JOIN hospital_departments hd ON d.department_id = hd.id
      WHERE d.id = ?
    `, [req.params.id]);
    
    if (doctors.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '医生不存在'
      });
    }
    
    res.json({
      code: 200,
      data: doctors[0]
    });
  } catch (error) {
    console.error('获取医生详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取医生详情失败'
    });
  }
});

// 获取医生排班
router.get('/doctor/:id/schedule', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    
    let sql = `
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = ? AND schedule_date >= CURDATE()
    `;
    const params = [req.params.id];
    
    if (date) {
      sql += ' AND schedule_date = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY schedule_date ASC, time_slot ASC LIMIT 14';
    
    const [schedules] = await pool.query(sql, params);
    
    res.json({
      code: 200,
      data: schedules
    });
  } catch (error) {
    console.error('获取医生排班错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取医生排班失败'
    });
  }
});

// 获取医院详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [hospitals] = await pool.query(
      'SELECT * FROM hospitals WHERE id = ?',
      [req.params.id]
    );
    
    if (hospitals.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '医院不存在'
      });
    }
    
    // 获取医院科室
    const [departments] = await pool.query(
      'SELECT * FROM hospital_departments WHERE hospital_id = ?',
      [req.params.id]
    );
    
    res.json({
      code: 200,
      data: {
        ...hospitals[0],
        departments
      }
    });
  } catch (error) {
    console.error('获取医院详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取医院详情失败'
    });
  }
});

// 获取科室列表
router.get('/:hospitalId/departments', authMiddleware, async (req, res) => {
  try {
    const [departments] = await pool.query(
      'SELECT * FROM hospital_departments WHERE hospital_id = ? AND status = 1',
      [req.params.hospitalId]
    );
    
    res.json({
      code: 200,
      data: departments
    });
  } catch (error) {
    console.error('获取科室列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取科室列表失败'
    });
  }
});

// 获取医生列表
router.get('/:hospitalId/doctors', authMiddleware, async (req, res) => {
  try {
    const { department_id } = req.query;
    
    let sql = 'SELECT * FROM doctors WHERE hospital_id = ? AND status = 1';
    const params = [req.params.hospitalId];
    
    if (department_id) {
      sql += ' AND department_id = ?';
      params.push(department_id);
    }
    
    sql += ' ORDER BY title DESC';
    
    const [doctors] = await pool.query(sql, params);
    
    res.json({
      code: 200,
      data: doctors
    });
  } catch (error) {
    console.error('获取医生列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取医生列表失败'
    });
  }
});

module.exports = router;
