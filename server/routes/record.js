const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// 获取成员的就医记录
router.get('/medical/:memberId', authMiddleware, async (req, res) => {
  try {
    const [records] = await pool.query(`
      SELECT * FROM medical_records 
      WHERE member_id = ?
      ORDER BY visit_date DESC
    `, [req.params.memberId]);
    
    res.json({
      code: 200,
      data: records
    });
  } catch (error) {
    console.error('获取就医记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取就医记录失败'
    });
  }
});

// 添加就医记录
router.post('/medical', authMiddleware, async (req, res) => {
  try {
    const { member_id, hospital_name, department, doctor_name, diagnosis, prescription, visit_date, remark } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO medical_records 
       (member_id, hospital_name, department, doctor_name, diagnosis, prescription, visit_date, remark, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [member_id, hospital_name, department, doctor_name, diagnosis, prescription, visit_date, remark]
    );
    
    res.json({
      code: 200,
      message: '添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加就医记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '添加就医记录失败'
    });
  }
});

// 更新就医记录
router.put('/medical/:id', authMiddleware, async (req, res) => {
  try {
    const { hospital_name, department, doctor_name, diagnosis, prescription, visit_date, remark } = req.body;
    
    await pool.query(
      `UPDATE medical_records 
       SET hospital_name = ?, department = ?, doctor_name = ?, diagnosis = ?, prescription = ?, visit_date = ?, remark = ?
       WHERE id = ?`,
      [hospital_name, department, doctor_name, diagnosis, prescription, visit_date, remark, req.params.id]
    );
    
    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新就医记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新就医记录失败'
    });
  }
});

// 删除就医记录
router.delete('/medical/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM medical_records WHERE id = ?', [req.params.id]);
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除就医记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除就医记录失败'
    });
  }
});

// 获取体检报告列表
router.get('/checkup/:memberId', authMiddleware, async (req, res) => {
  try {
    const [reports] = await pool.query(`
      SELECT * FROM checkup_reports 
      WHERE member_id = ?
      ORDER BY checkup_date DESC
    `, [req.params.memberId]);
    
    res.json({
      code: 200,
      data: reports
    });
  } catch (error) {
    console.error('获取体检报告错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取体检报告失败'
    });
  }
});

// 上传体检报告
router.post('/checkup', authMiddleware, (req, res, next) => {
  req.uploadSubDir = 'checkup';
  next();
}, upload.single('file'), async (req, res) => {
  try {
    const { member_id, title, checkup_date, hospital_name, summary } = req.body;
    
    const fileUrl = req.file ? `/uploads/checkup/${req.file.filename}` : null;
    
    const [result] = await pool.query(
      `INSERT INTO checkup_reports 
       (member_id, title, checkup_date, hospital_name, summary, file_url, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [member_id, title, checkup_date, hospital_name, summary, fileUrl]
    );
    
    res.json({
      code: 200,
      message: '上传成功',
      data: { id: result.insertId, fileUrl }
    });
  } catch (error) {
    console.error('上传体检报告错误:', error);
    res.status(500).json({
      code: 500,
      message: '上传体检报告失败'
    });
  }
});

// 删除体检报告
router.delete('/checkup/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM checkup_reports WHERE id = ?', [req.params.id]);
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除体检报告错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除体检报告失败'
    });
  }
});

module.exports = router;
