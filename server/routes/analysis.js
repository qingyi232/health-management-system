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

// 获取健康数据趋势分析
router.get('/trend/:memberId', authMiddleware, async (req, res) => {
  try {
    const { type, period = '30' } = req.query;
    const hasPermission = await ensureOwnMember(req.params.memberId, req.user.userId);
    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该成员数据'
      });
    }
    
    const [data] = await pool.query(`
      SELECT 
        DATE(record_date) as date,
        data_type,
        value,
        unit
      FROM health_data 
      WHERE member_id = ? 
        AND data_type = ?
        AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY record_date ASC
    `, [req.params.memberId, type, parseInt(period)]);
    
    const processedData = data.map(item => ({
      ...item,
      value: parseValue(item.value)
    }));
    
    res.json({
      code: 200,
      data: processedData
    });
  } catch (error) {
    console.error('获取趋势数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取趋势数据失败'
    });
  }
});

// 获取健康统计数据
router.get('/statistics/:memberId', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const hasPermission = await ensureOwnMember(memberId, req.user.userId);
    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该成员数据'
      });
    }
    
    // 获取各类数据的统计
    const statistics = {};
    
    // 体重变化
    const [weightData] = await pool.query(`
      SELECT value, record_date FROM health_data 
      WHERE member_id = ? AND data_type = 'weight'
      ORDER BY record_date DESC LIMIT 2
    `, [memberId]);
    
    if (weightData.length >= 2) {
      const current = parseValue(weightData[0].value).value;
      const previous = parseValue(weightData[1].value).value;
      statistics.weight = {
        current,
        change: (current - previous).toFixed(1),
        trend: current > previous ? 'up' : current < previous ? 'down' : 'stable'
      };
    }
    
    // 血压平均值（最近7天）
    const [bpData] = await pool.query(`
      SELECT value FROM health_data 
      WHERE member_id = ? AND data_type = 'blood_pressure'
        AND record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `, [memberId]);
    
    if (bpData.length > 0) {
      let totalSystolic = 0, totalDiastolic = 0;
      bpData.forEach(item => {
        const val = parseValue(item.value);
        totalSystolic += val.systolic;
        totalDiastolic += val.diastolic;
      });
      statistics.blood_pressure = {
        avgSystolic: Math.round(totalSystolic / bpData.length),
        avgDiastolic: Math.round(totalDiastolic / bpData.length),
        count: bpData.length
      };
    }
    
    // 血糖平均值（最近7天）
    const [sugarData] = await pool.query(`
      SELECT value FROM health_data 
      WHERE member_id = ? AND data_type = 'blood_sugar'
        AND record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `, [memberId]);
    
    if (sugarData.length > 0) {
      let total = 0;
      sugarData.forEach(item => {
        const val = parseValue(item.value);
        total += val.value;
      });
      statistics.blood_sugar = {
        average: (total / sugarData.length).toFixed(1),
        count: sugarData.length
      };
    }
    
    // 步数统计（最近7天）
    const [stepsData] = await pool.query(`
      SELECT value, record_date FROM health_data 
      WHERE member_id = ? AND data_type = 'steps'
        AND record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `, [memberId]);
    
    if (stepsData.length > 0) {
      let total = 0;
      stepsData.forEach(item => {
        const val = parseValue(item.value);
        total += val.value;
      });
      statistics.steps = {
        total,
        average: Math.round(total / stepsData.length),
        days: stepsData.length
      };
    }
    
    res.json({
      code: 200,
      data: statistics
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取统计数据失败'
    });
  }
});

// 获取用户所有未读预警数量
router.get('/alerts/unread/count', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT COUNT(*) as count FROM health_alerts ha
      JOIN health_members hm ON ha.member_id = hm.id
      WHERE hm.user_id = ? AND ha.status = 'unread'
    `, [req.user.userId]);
    
    res.json({
      code: 200,
      data: { count: result[0].count }
    });
  } catch (error) {
    console.error('获取未读预警数量错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取未读预警数量失败'
    });
  }
});

// 获取健康预警列表
router.get('/alerts/:memberId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const hasPermission = await ensureOwnMember(req.params.memberId, req.user.userId);
    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该成员数据'
      });
    }
    
    let sql = 'SELECT * FROM health_alerts WHERE member_id = ?';
    const params = [req.params.memberId];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT 50';
    
    const [alerts] = await pool.query(sql, params);
    
    res.json({
      code: 200,
      data: alerts
    });
  } catch (error) {
    console.error('获取预警列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取预警列表失败'
    });
  }
});

// 标记预警为已读
router.put('/alerts/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE health_alerts SET status = ? WHERE id = ?',
      ['read', req.params.id]
    );
    
    res.json({
      code: 200,
      message: '标记成功'
    });
  } catch (error) {
    console.error('标记预警错误:', error);
    res.status(500).json({
      code: 500,
      message: '标记失败'
    });
  }
});

// 生成健康报告
router.get('/report/:memberId', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const { period = '30' } = req.query;
    const hasPermission = await ensureOwnMember(memberId, req.user.userId);
    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该成员数据'
      });
    }
    
    // 获取成员信息
    const [members] = await pool.query(
      'SELECT * FROM health_members WHERE id = ?',
      [memberId]
    );
    
    if (members.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '成员不存在'
      });
    }
    
    const member = members[0];
    
    // 获取各项健康数据
    const [healthData] = await pool.query(`
      SELECT data_type, value, record_date FROM health_data 
      WHERE member_id = ? AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY record_date DESC
    `, [memberId, parseInt(period)]);
    
    // 获取预警记录
    const [alerts] = await pool.query(`
      SELECT * FROM health_alerts 
      WHERE member_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [memberId, parseInt(period)]);
    
    // 生成报告
    const report = {
      member: {
        name: member.name,
        age: new Date().getFullYear() - new Date(member.birth_date).getFullYear(),
        gender: member.gender
      },
      period: `最近${period}天`,
      summary: {
        totalRecords: healthData.length,
        alertCount: alerts.length
      },
      healthData: {},
      alerts: alerts,
      suggestions: []
    };
    
    // 按类型分组健康数据
    healthData.forEach(item => {
      if (!report.healthData[item.data_type]) {
        report.healthData[item.data_type] = [];
      }
      report.healthData[item.data_type].push({
        value: parseValue(item.value),
        date: item.record_date
      });
    });
    
    // 基于数据分析生成个性化建议
    if (alerts.length > 0) {
      report.suggestions.push('您近期有健康异常记录，建议定期监测并咨询医生');
    }
    
    if (report.healthData['blood_pressure']) {
      const bpRecords = report.healthData['blood_pressure'];
      const avgSys = bpRecords.reduce((s, r) => s + (r.value.systolic || 0), 0) / bpRecords.length;
      if (avgSys > 130) {
        report.suggestions.push('您的血压偏高，建议低盐饮食、适量运动，必要时遵医嘱服药');
      } else if (avgSys < 100) {
        report.suggestions.push('您的血压偏低，注意补充营养、避免久站，如有头晕症状请及时就医');
      }
    }
    
    if (report.healthData['blood_sugar']) {
      const bsRecords = report.healthData['blood_sugar'];
      const avgBs = bsRecords.reduce((s, r) => s + (r.value.value || 0), 0) / bsRecords.length;
      if (avgBs > 6.1) {
        report.suggestions.push('您的血糖偏高，建议控制碳水摄入，选择低GI食物，定期复查');
      } else if (avgBs < 3.9) {
        report.suggestions.push('您的血糖偏低，注意规律进餐，随身携带糖果以备低血糖');
      }
    }
    
    if (report.healthData['weight'] && report.healthData['weight'].length >= 2) {
      const weights = report.healthData['weight'].sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = weights[0].value.value;
      const last = weights[weights.length - 1].value.value;
      const change = last - first;
      if (change > 3) {
        report.suggestions.push('您近期体重增长较快，建议控制饮食、增加有氧运动');
      } else if (change < -3) {
        report.suggestions.push('您近期体重下降较多，请注意营养均衡，如非刻意减重请咨询医生');
      }
    }
    
    if (report.healthData['heart_rate']) {
      const hrRecords = report.healthData['heart_rate'];
      const avgHr = hrRecords.reduce((s, r) => s + (r.value.value || 0), 0) / hrRecords.length;
      if (avgHr > 100) {
        report.suggestions.push('您的心率偏快，建议注意休息、避免过度紧张，持续偏快请就医检查');
      } else if (avgHr < 55) {
        report.suggestions.push('您的心率偏慢，如伴有头晕乏力症状，建议及时就医');
      }
    }
    
    if (healthData.length === 0) {
      report.suggestions.push('暂无健康数据记录，建议定期录入血压、血糖、体重等数据以便分析');
    }
    
    // 基于年龄的个性化饮食和运动建议
    const age = report.member.age;
    if (age < 18) {
      report.dietPlan = '青少年饮食建议：保证每天摄入足够的蛋白质（鱼肉蛋奶），多吃蔬菜水果，每天一杯牛奶补钙，少吃零食和含糖饮料';
      report.exercisePlan = '青少年运动建议：每天至少60分钟中高强度运动，如跑步、游泳、球类运动，有助于骨骼发育和体能提升';
    } else if (age < 40) {
      report.dietPlan = '成年人饮食建议：三餐规律，营养均衡，每天摄入300g蔬菜和200g水果，适量摄入优质蛋白，控制油盐糖';
      report.exercisePlan = '成年人运动建议：每周至少150分钟中等强度有氧运动（如快走、骑车），每周2-3次力量训练';
    } else if (age < 60) {
      report.dietPlan = '中年人饮食建议：减少高脂肪食物，增加膳食纤维摄入，适量补充钙和维生素D，控制热量防止肥胖';
      report.exercisePlan = '中年人运动建议：每天30分钟中等强度运动（快走、太极拳），注意运动前热身，避免剧烈运动';
    } else {
      report.dietPlan = '老年人饮食建议：少食多餐，清淡饮食，多吃易消化食物，保证蛋白质摄入防止肌肉流失，适量补钙';
      report.exercisePlan = '老年人运动建议：每天20-30分钟散步或太极拳，避免剧烈运动和摔倒风险，注意运动后补水';
    }
    
    // 根据健康数据调整饮食运动建议
    if (report.healthData['blood_pressure']) {
      const bpRecords = report.healthData['blood_pressure'];
      const avgSys = bpRecords.reduce((s, r) => s + (r.value.systolic || 0), 0) / bpRecords.length;
      if (avgSys > 130) {
        report.dietPlan += '；血压偏高特别提醒：严格限盐（每日<5g），多吃含钾食物（香蕉、土豆），戒烟限酒';
        report.exercisePlan += '；血压偏高特别提醒：选择低强度有氧运动如散步、游泳，避免憋气用力的运动';
      }
    }
    
    if (report.healthData['blood_sugar']) {
      const bsRecords = report.healthData['blood_sugar'];
      const avgBs = bsRecords.reduce((s, r) => s + (r.value.value || 0), 0) / bsRecords.length;
      if (avgBs > 6.1) {
        report.dietPlan += '；血糖偏高特别提醒：控制主食量，选择全谷物替代精米白面，避免含糖饮料和甜食';
        report.exercisePlan += '；血糖偏高特别提醒：餐后30分钟进行15-20分钟快走，有助于降低餐后血糖';
      }
    }
    
    if (report.suggestions.length === 0) {
      report.suggestions.push('您的各项健康指标正常，请继续保持良好的生活习惯');
    }
    
    res.json({
      code: 200,
      data: report
    });
  } catch (error) {
    console.error('生成健康报告错误:', error);
    res.status(500).json({
      code: 500,
      message: '生成健康报告失败'
    });
  }
});

module.exports = router;
