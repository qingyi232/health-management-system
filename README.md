# 家庭健康管理系统

## 项目简介

家庭健康管理系统是一个面向家庭用户的健康数据管理平台，支持多端（H5、微信小程序、App）使用。系统提供健康数据记录、健康档案管理、数据分析与预警、健康知识推送、就医辅助、家庭共享等功能。

## 技术栈

### 后端
- **框架**: Node.js + Express
- **数据库**: MySQL
- **缓存**: Redis
- **认证**: JWT

### 前端
- **框架**: Vue 3 + UniApp
- **状态管理**: Pinia
- **图表**: ECharts
- **UI**: 自定义组件

## 功能模块

### 1. 健康数据记录
- 支持手动录入身高、体重、血压、血糖等基础健康指标
- 对接智能穿戴设备（智能手环、智能血压计等），自动同步数据

### 2. 健康档案管理
- 为每位家庭成员创建独立健康档案
- 支持添加体检报告、就医记录等文件

### 3. 数据分析与预警
- 对录入数据进行可视化分析，生成趋势图表
- 当数据异常时，及时推送预警信息

### 4. 健康知识推送
- 根据家庭成员的健康状况和年龄，推送个性化的健康知识
- 提供饮食建议和运动方案

### 5. 就医辅助
- 提供附近医院、科室、医生查询功能
- 支持在线挂号、就医记录查询

### 6. 家庭共享功能
- 家庭成员间可互相查看健康数据
- 实现健康信息共享与关怀

## 项目结构

```
健康管理系统/
├── server/                 # 后端服务
│   ├── app.js             # 入口文件
│   ├── config/            # 配置文件
│   │   ├── database.js    # 数据库配置
│   │   └── redis.js       # Redis配置
│   ├── middleware/        # 中间件
│   │   ├── auth.js        # 认证中间件
│   │   └── upload.js      # 文件上传中间件
│   ├── routes/            # 路由
│   │   ├── auth.js        # 用户认证
│   │   ├── member.js      # 成员管理
│   │   ├── health.js      # 健康数据
│   │   ├── record.js      # 就医/体检记录
│   │   ├── analysis.js    # 数据分析
│   │   ├── knowledge.js   # 健康知识
│   │   ├── hospital.js    # 医院查询
│   │   ├── appointment.js # 预约挂号
│   │   ├── family.js      # 家庭管理
│   │   └── device.js      # 设备管理
│   ├── database/          # 数据库脚本
│   │   └── init.sql       # 初始化脚本
│   ├── package.json
│   └── .env               # 环境变量
│
├── client/                 # 前端项目
│   ├── pages/             # 页面
│   │   ├── index/         # 首页
│   │   ├── login/         # 登录
│   │   ├── register/      # 注册
│   │   ├── member/        # 成员管理
│   │   ├── health/        # 健康数据
│   │   ├── record/        # 就医记录
│   │   ├── knowledge/     # 健康知识
│   │   ├── hospital/      # 医院查询
│   │   ├── appointment/   # 预约挂号
│   │   ├── family/        # 家庭管理
│   │   ├── device/        # 设备管理
│   │   └── mine/          # 个人中心
│   ├── api/               # API接口
│   ├── stores/            # 状态管理
│   ├── utils/             # 工具函数
│   ├── static/            # 静态资源
│   ├── App.vue
│   ├── main.js
│   ├── pages.json         # 页面配置
│   ├── manifest.json      # 应用配置
│   └── package.json
│
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 16
- MySQL >= 5.7
- Redis >= 6.0

### 后端启动

1. 进入后端目录
```bash
cd server
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
编辑 `.env` 文件，配置数据库连接信息

4. 初始化数据库
```bash
mysql -u root -p < database/init.sql
```

5. 启动服务
```bash
npm run dev
```

### 前端启动

1. 进入前端目录
```bash
cd client
```

2. 安装依赖
```bash
npm install
```

3. 启动H5开发服务
```bash
npm run dev:h5
```

4. 启动微信小程序开发
```bash
npm run dev:mp-weixin
```

## API接口

### 用户认证
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录
- GET `/api/auth/profile` - 获取用户信息
- PUT `/api/auth/profile` - 更新用户信息
- PUT `/api/auth/password` - 修改密码

### 成员管理
- GET `/api/member` - 获取成员列表
- POST `/api/member` - 添加成员
- GET `/api/member/:id` - 获取成员详情
- PUT `/api/member/:id` - 更新成员信息
- DELETE `/api/member/:id` - 删除成员

### 健康数据
- GET `/api/health/data/:memberId` - 获取健康数据
- POST `/api/health/data` - 添加健康数据
- GET `/api/health/latest/:memberId` - 获取最新健康指标

### 数据分析
- GET `/api/analysis/trend/:memberId` - 获取趋势数据
- GET `/api/analysis/statistics/:memberId` - 获取统计数据
- GET `/api/analysis/alerts/:memberId` - 获取健康预警

### 就医记录
- GET `/api/record/medical/:memberId` - 获取就医记录
- POST `/api/record/medical` - 添加就医记录
- GET `/api/record/checkup/:memberId` - 获取体检报告
- POST `/api/record/checkup` - 上传体检报告

### 健康知识
- GET `/api/knowledge` - 获取知识列表
- GET `/api/knowledge/:id` - 获取知识详情
- GET `/api/knowledge/recommend/:memberId` - 获取个性化推荐

### 医院查询
- GET `/api/hospital` - 获取医院列表
- GET `/api/hospital/:id` - 获取医院详情
- GET `/api/hospital/:id/departments` - 获取科室列表
- GET `/api/hospital/:id/doctors` - 获取医生列表

### 预约挂号
- GET `/api/appointment` - 获取挂号记录
- POST `/api/appointment` - 创建挂号
- PUT `/api/appointment/:id/cancel` - 取消挂号

### 家庭管理
- GET `/api/family` - 获取家庭列表
- POST `/api/family` - 创建家庭
- POST `/api/family/:id/invite` - 邀请成员
- GET `/api/family/:id/health/:memberId` - 获取共享健康数据

### 设备管理
- GET `/api/device` - 获取设备列表
- POST `/api/device/bind` - 绑定设备
- POST `/api/device/:id/sync` - 同步设备数据
- DELETE `/api/device/:id` - 解绑设备

## 数据库设计

### 主要数据表
- `users` - 用户表
- `families` - 家庭表
- `family_members` - 家庭成员关联表
- `health_members` - 健康档案成员表
- `health_data` - 健康数据表
- `health_alerts` - 健康预警表
- `medical_records` - 就医记录表
- `checkup_reports` - 体检报告表
- `hospitals` - 医院表
- `hospital_departments` - 科室表
- `doctors` - 医生表
- `appointments` - 挂号记录表
- `health_knowledge` - 健康知识表
- `user_devices` - 用户设备表

## 注意事项

1. 首次运行需要执行数据库初始化脚本
2. 医院数据为模拟数据，实际应用中需对接真实数据源
3. 设备同步功能为模拟实现，实际应用中需对接设备厂商API
4. 建议在生产环境中配置HTTPS

## License

MIT
