const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const https = require('https');

const parseValue = (val) => typeof val === 'string' ? JSON.parse(val) : val;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

function callDeepSeek(messages) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const urlObj = new URL(`${DEEPSEEK_BASE_URL}/v1/chat/completions`);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices?.[0]?.message?.content) {
            resolve(parsed.choices[0].message.content);
          } else {
            reject(new Error(parsed.error?.message || 'AI返回异常'));
          }
        } catch (e) { reject(e); }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('AI请求超时')); });
    req.write(postData);
    req.end();
  });
}

// 获取健康知识列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, keyword, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM health_knowledge WHERE status = 1';
    const params = [];
    const countParams = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }
    
    if (keyword) {
      sql += ' AND (title LIKE ? OR summary LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [articles] = await pool.query(sql, params);
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM health_knowledge WHERE status = 1';
    if (category) {
      countSql += ' AND category = ?';
    }
    if (keyword) {
      countSql += ' AND (title LIKE ? OR summary LIKE ?)';
    }
    const [countResult] = await pool.query(countSql, countParams);
    
    res.json({
      code: 200,
      data: {
        list: articles,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取健康知识错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取健康知识失败'
    });
  }
});

// 获取个性化推荐
router.get('/recommend/:memberId', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.memberId;
    
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
    const age = new Date().getFullYear() - new Date(member.birth_date).getFullYear();
    
    // 获取最近的健康数据，判断健康状况
    const [healthData] = await pool.query(`
      SELECT data_type, value FROM health_data 
      WHERE member_id = ?
      ORDER BY record_date DESC LIMIT 10
    `, [memberId]);
    
    // 根据年龄和健康状况确定推荐类别及理由
    const categories = [];
    const reasons = {};
    
    // 根据年龄推荐
    if (age < 18) {
      categories.push('youth_health', 'growth');
      reasons['youth_health'] = '青少年成长关注';
      reasons['growth'] = '青少年成长关注';
    } else if (age < 40) {
      categories.push('fitness', 'nutrition', 'mental_health');
      reasons['fitness'] = '适龄运动建议';
      reasons['nutrition'] = '营养均衡推荐';
      reasons['mental_health'] = '心理健康关注';
    } else if (age < 60) {
      categories.push('chronic_disease', 'nutrition', 'exercise');
      reasons['chronic_disease'] = '中年健康管理';
      reasons['nutrition'] = '营养均衡推荐';
      reasons['exercise'] = '适龄运动建议';
    } else {
      categories.push('elderly_care', 'chronic_disease', 'nutrition');
      reasons['elderly_care'] = '老年保健关注';
      reasons['chronic_disease'] = '慢病预防管理';
      reasons['nutrition'] = '营养均衡推荐';
    }
    
    // 根据健康数据推荐
    healthData.forEach(item => {
      try {
        const value = parseValue(item.value);
        if (item.data_type === 'blood_pressure') {
          if (value.systolic > 130 || value.diastolic > 85) {
            categories.push('hypertension');
            reasons['hypertension'] = '基于您的血压数据';
          }
        }
        if (item.data_type === 'blood_sugar') {
          if (value.value > 6.1) {
            categories.push('diabetes');
            reasons['diabetes'] = '基于您的血糖数据';
          }
        }
        if (item.data_type === 'weight') {
          categories.push('fitness', 'nutrition');
          reasons['fitness'] = '基于您的体重数据';
          reasons['nutrition'] = '基于您的体重数据';
        }
        if (item.data_type === 'heart_rate') {
          const hr = value.value;
          if (hr > 90 || hr < 60) {
            categories.push('chronic_disease');
            reasons['chronic_disease'] = '基于您的心率数据';
          }
        }
      } catch (e) {
        // 跳过解析异常的数据
      }
    });
    
    // 始终包含通用分类确保有结果
    categories.push('general');
    reasons['general'] = '健康知识推荐';
    
    // 去重
    const uniqueCategories = [...new Set(categories)];
    
    // 获取推荐文章
    const [articles] = await pool.query(`
      SELECT * FROM health_knowledge 
      WHERE status = 1 AND category IN (?)
      ORDER BY RAND() LIMIT 10
    `, [uniqueCategories]);
    
    // 如果仍然没有结果，获取所有文章
    let finalArticles = articles;
    if (finalArticles.length === 0) {
      const [allArticles] = await pool.query(`
        SELECT * FROM health_knowledge WHERE status = 1
        ORDER BY RAND() LIMIT 10
      `);
      finalArticles = allArticles;
    }
    
    // 为每篇文章附加推荐理由
    const articlesWithReason = finalArticles.map(article => ({
      ...article,
      recommend_reason: reasons[article.category] || '健康知识推荐'
    }));
    
    res.json({
      code: 200,
      data: articlesWithReason
    });
  } catch (error) {
    console.error('获取推荐内容错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取推荐内容失败'
    });
  }
});

// 获取分类列表
router.get('/categories/list', authMiddleware, async (req, res) => {
  try {
    const categories = [
      { key: 'general', name: '健康常识' },
      { key: 'nutrition', name: '营养饮食' },
      { key: 'fitness', name: '运动健身' },
      { key: 'mental_health', name: '心理健康' },
      { key: 'chronic_disease', name: '慢病管理' },
      { key: 'hypertension', name: '高血压' },
      { key: 'diabetes', name: '糖尿病' },
      { key: 'elderly_care', name: '老年保健' },
      { key: 'youth_health', name: '青少年健康' },
      { key: 'growth', name: '生长发育' },
      { key: 'exercise', name: '运动方案' }
    ];
    
    res.json({
      code: 200,
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取分类列表失败'
    });
  }
});

// 获取收藏列表
router.get('/favorites/list', authMiddleware, async (req, res) => {
  try {
    const [favorites] = await pool.query(`
      SELECT hk.* FROM health_knowledge hk
      JOIN knowledge_favorites kf ON hk.id = kf.knowledge_id
      WHERE kf.user_id = ?
      ORDER BY kf.created_at DESC
    `, [req.user.userId]);
    
    res.json({
      code: 200,
      data: favorites
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取收藏列表失败'
    });
  }
});

// 获取文章详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [articles] = await pool.query(
      'SELECT * FROM health_knowledge WHERE id = ?',
      [req.params.id]
    );
    
    if (articles.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '文章不存在'
      });
    }
    
    // 增加阅读量
    await pool.query(
      'UPDATE health_knowledge SET view_count = view_count + 1 WHERE id = ?',
      [req.params.id]
    );
    
    res.json({
      code: 200,
      data: articles[0]
    });
  } catch (error) {
    console.error('获取文章详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取文章详情失败'
    });
  }
});

// 收藏文章
router.post('/favorite/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO knowledge_favorites (user_id, knowledge_id, created_at) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE created_at = NOW()`,
      [req.user.userId, req.params.id]
    );
    
    res.json({
      code: 200,
      message: '收藏成功'
    });
  } catch (error) {
    console.error('收藏文章错误:', error);
    res.status(500).json({
      code: 500,
      message: '收藏失败'
    });
  }
});

// 取消收藏
router.delete('/favorite/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM knowledge_favorites WHERE user_id = ? AND knowledge_id = ?',
      [req.user.userId, req.params.id]
    );
    
    res.json({
      code: 200,
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error('取消收藏错误:', error);
    res.status(500).json({
      code: 500,
      message: '取消收藏失败'
    });
  }
});

// AI大模型个性化健康建议
router.get('/ai/advice/:memberId', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.memberId;
    
    const [members] = await pool.query('SELECT * FROM health_members WHERE id = ?', [memberId]);
    if (members.length === 0) {
      return res.status(404).json({ code: 404, message: '成员不存在' });
    }
    const member = members[0];
    const age = new Date().getFullYear() - new Date(member.birth_date).getFullYear();
    
    const [healthData] = await pool.query(`
      SELECT data_type, value, unit, record_date FROM health_data
      WHERE member_id = ? ORDER BY record_date DESC LIMIT 20
    `, [memberId]);
    
    const [alerts] = await pool.query(`
      SELECT alert_type, message, data_type FROM health_alerts
      WHERE member_id = ? ORDER BY created_at DESC LIMIT 5
    `, [memberId]);
    
    let healthSummary = '';
    const dataByType = {};
    healthData.forEach(item => {
      const val = parseValue(item.value);
      if (!dataByType[item.data_type]) dataByType[item.data_type] = [];
      dataByType[item.data_type].push(val);
    });
    
    if (dataByType.blood_pressure) {
      const latest = dataByType.blood_pressure[0];
      healthSummary += `血压：${latest.systolic}/${latest.diastolic} mmHg；`;
    }
    if (dataByType.blood_sugar) {
      healthSummary += `血糖：${dataByType.blood_sugar[0].value} mmol/L；`;
    }
    if (dataByType.weight) {
      healthSummary += `体重：${dataByType.weight[0].value} kg；`;
    }
    if (dataByType.heart_rate) {
      healthSummary += `心率：${dataByType.heart_rate[0].value} bpm；`;
    }
    if (dataByType.steps) {
      const avgSteps = Math.round(dataByType.steps.reduce((s, v) => s + v.value, 0) / dataByType.steps.length);
      healthSummary += `日均步数：${avgSteps}；`;
    }
    if (dataByType.sleep) {
      healthSummary += `睡眠：${dataByType.sleep[0].duration}小时；`;
    }
    
    const alertSummary = alerts.length > 0
      ? `近期预警：${alerts.map(a => a.message).join('、')}`
      : '近期无健康预警';
    
    const prompt = `你是一个专业的家庭健康管理AI助手。请根据以下用户健康数据，给出个性化的健康建议。

用户信息：
- 姓名：${member.name}
- 性别：${member.gender === 'male' ? '男' : '女'}
- 年龄：${age}岁
- 关系：${member.relation}

健康数据：
${healthSummary || '暂无健康数据记录'}

${alertSummary}

请从以下4个维度给出具体、个性化、可执行的建议（每条50字以内），以JSON格式返回：
{
  "overall": "总体健康评估（一句话）",
  "diet": ["饮食建议1", "饮食建议2", "饮食建议3"],
  "exercise": ["运动建议1", "运动建议2", "运动建议3"],
  "lifestyle": ["生活习惯建议1", "生活习惯建议2"],
  "medical": ["医疗建议1（如有需要）"]
}

只返回JSON，不要其他文字。`;

    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'sk-placeholder') {
      const fallback = generateLocalAdvice(member, age, dataByType, alerts);
      return res.json({
        code: 200,
        data: { ...fallback, source: 'local', memberName: member.name }
      });
    }

    try {
      const aiResponse = await callDeepSeek([
        { role: 'system', content: '你是专业的家庭健康管理AI助手，擅长根据用户健康数据提供个性化建议。请严格按照要求的JSON格式返回。' },
        { role: 'user', content: prompt }
      ]);
      
      let advice;
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        advice = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI返回格式异常');
      }
      
      res.json({
        code: 200,
        data: { ...advice, source: 'ai', memberName: member.name }
      });
    } catch (aiError) {
      console.error('AI调用失败，使用本地算法:', aiError.message);
      const fallback = generateLocalAdvice(member, age, dataByType, alerts);
      res.json({
        code: 200,
        data: { ...fallback, source: 'local', memberName: member.name }
      });
    }
  } catch (error) {
    console.error('AI健康建议错误:', error);
    res.status(500).json({ code: 500, message: '获取AI健康建议失败' });
  }
});

function generateLocalAdvice(member, age, dataByType, alerts) {
  const advice = {
    overall: '根据您的健康数据分析，整体状况良好，建议继续保持健康的生活方式',
    diet: [],
    exercise: [],
    lifestyle: [],
    medical: []
  };
  
  if (age < 18) {
    advice.diet = ['保证每天一杯牛奶和一个鸡蛋，补充蛋白质和钙质', '多吃新鲜蔬果，少吃零食和含糖饮料', '三餐定时定量，保证早餐营养充足'];
    advice.exercise = ['每天至少60分钟中高强度运动，如跑步、游泳', '参加球类运动促进骨骼发育和团队协作', '课间多活动，避免长时间久坐'];
  } else if (age < 40) {
    advice.diet = ['三餐规律，每天摄入300g蔬菜和200g水果', '适量摄入优质蛋白（鱼肉蛋奶），控制油盐糖', '多喝水，避免含糖饮料和过度饮酒'];
    advice.exercise = ['每周至少150分钟中等强度有氧运动（快走、骑车）', '每周2-3次力量训练，增强肌肉力量', '工作间隙每小时起身活动5分钟'];
  } else if (age < 60) {
    advice.diet = ['减少高脂肪食物，增加膳食纤维摄入', '适量补充钙和维生素D，预防骨质疏松', '控制热量摄入，维持健康体重'];
    advice.exercise = ['每天30分钟中等强度运动（快走、太极拳）', '注意运动前充分热身，避免关节受伤', '选择低冲击运动如游泳、骑车'];
  } else {
    advice.diet = ['少食多餐，清淡饮食，选择易消化食物', '保证优质蛋白摄入防止肌肉流失', '多吃富含钙的食物和适量补钙'];
    advice.exercise = ['每天20-30分钟散步或太极拳', '做简单的平衡训练，预防摔倒', '避免剧烈运动，运动后注意补水'];
  }
  
  advice.lifestyle = ['保证每天7-8小时睡眠，规律作息', '保持良好心态，学会压力管理'];
  
  if (dataByType.blood_pressure) {
    const bp = dataByType.blood_pressure[0];
    if (bp.systolic > 130) {
      advice.overall = '您的血压偏高，建议重点关注心血管健康';
      advice.diet.unshift('严格限盐，每日食盐不超过5克，多吃含钾食物');
      advice.medical.push('建议每天固定时间测量血压，如持续偏高请就医');
    }
  }
  if (dataByType.blood_sugar) {
    const bs = dataByType.blood_sugar[0];
    if (bs.value > 6.1) {
      advice.overall = '您的血糖偏高，建议注意饮食控制和适量运动';
      advice.diet.unshift('控制主食量，选择全谷物替代精米白面，避免甜食');
      advice.medical.push('建议定期监测空腹和餐后血糖，必要时就医检查');
    }
  }
  
  if (alerts.length > 0) {
    advice.medical.push('近期有健康异常记录，建议及时就医咨询');
  }
  if (advice.medical.length === 0) {
    advice.medical.push('各项指标正常，建议每年至少做一次全面体检');
  }
  
  return advice;
}

module.exports = router;
