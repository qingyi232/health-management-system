const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/member');
const healthRoutes = require('./routes/health');
const recordRoutes = require('./routes/record');
const analysisRoutes = require('./routes/analysis');
const knowledgeRoutes = require('./routes/knowledge');
const hospitalRoutes = require('./routes/hospital');
const appointmentRoutes = require('./routes/appointment');
const familyRoutes = require('./routes/family');
const deviceRoutes = require('./routes/device');

app.use('/api/auth', authRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/record', recordRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/device', deviceRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
