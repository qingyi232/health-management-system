-- 健康管理系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS health_management DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE health_management;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(100),
  avatar VARCHAR(255),
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 家庭表
CREATE TABLE IF NOT EXISTS families (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  creator_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 家庭成员关联表
CREATE TABLE IF NOT EXISTS family_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  family_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_family_user (family_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 家庭邀请表
CREATE TABLE IF NOT EXISTS family_invitations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  family_id INT NOT NULL,
  inviter_id INT NOT NULL,
  invitee_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (inviter_id) REFERENCES users(id),
  FOREIGN KEY (invitee_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 健康成员表（家庭成员的健康档案）
CREATE TABLE IF NOT EXISTS health_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  relation VARCHAR(20),
  gender ENUM('male', 'female') NOT NULL,
  birth_date DATE NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 健康数据表
CREATE TABLE IF NOT EXISTS health_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  value JSON NOT NULL,
  unit VARCHAR(20),
  record_date DATE NOT NULL,
  source ENUM('manual', 'device') DEFAULT 'manual',
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES health_members(id) ON DELETE CASCADE,
  INDEX idx_member_type (member_id, data_type),
  INDEX idx_record_date (record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 健康预警表
CREATE TABLE IF NOT EXISTS health_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  alert_type ENUM('warning', 'danger', 'info') DEFAULT 'warning',
  message VARCHAR(255) NOT NULL,
  data_type VARCHAR(50),
  data_value JSON,
  status ENUM('unread', 'read') DEFAULT 'unread',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES health_members(id) ON DELETE CASCADE,
  INDEX idx_member_status (member_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 就医记录表
CREATE TABLE IF NOT EXISTS medical_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  hospital_name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  doctor_name VARCHAR(50),
  diagnosis TEXT,
  prescription TEXT,
  visit_date DATE NOT NULL,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES health_members(id) ON DELETE CASCADE,
  INDEX idx_member_id (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 体检报告表
CREATE TABLE IF NOT EXISTS checkup_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  checkup_date DATE NOT NULL,
  hospital_name VARCHAR(100),
  summary TEXT,
  file_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES health_members(id) ON DELETE CASCADE,
  INDEX idx_member_id (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 医院表
CREATE TABLE IF NOT EXISTS hospitals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(20),
  address VARCHAR(255),
  phone VARCHAR(50),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  distance DECIMAL(5, 2),
  image VARCHAR(255),
  description TEXT,
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 医院科室表
CREATE TABLE IF NOT EXISTS hospital_departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  status TINYINT DEFAULT 1,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 医生表
CREATE TABLE IF NOT EXISTS doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  department_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  title VARCHAR(50),
  avatar VARCHAR(255),
  specialty TEXT,
  introduction TEXT,
  status TINYINT DEFAULT 1,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (department_id) REFERENCES hospital_departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 医生排班表
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT NOT NULL,
  schedule_date DATE NOT NULL,
  time_slot ENUM('morning', 'afternoon', 'evening') NOT NULL,
  total INT DEFAULT 20,
  remaining INT DEFAULT 20,
  price DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  UNIQUE KEY uk_doctor_date_slot (doctor_id, schedule_date, time_slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 挂号记录表
CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) NOT NULL UNIQUE,
  member_id INT NOT NULL,
  hospital_id INT NOT NULL,
  department_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot ENUM('morning', 'afternoon', 'evening') NOT NULL,
  symptoms TEXT,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  cancel_time DATETIME,
  complete_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES health_members(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (department_id) REFERENCES hospital_departments(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  INDEX idx_member_id (member_id),
  INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 健康知识表
CREATE TABLE IF NOT EXISTS health_knowledge (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  summary VARCHAR(500),
  cover_image VARCHAR(255),
  author VARCHAR(50),
  view_count INT DEFAULT 0,
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 知识收藏表
CREATE TABLE IF NOT EXISTS knowledge_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  knowledge_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (knowledge_id) REFERENCES health_knowledge(id),
  UNIQUE KEY uk_user_knowledge (user_id, knowledge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户设备表
CREATE TABLE IF NOT EXISTS user_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  member_id INT NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  device_id VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  last_sync DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (member_id) REFERENCES health_members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入模拟医院数据
INSERT INTO hospitals (name, level, address, phone, latitude, longitude, distance, description, status) VALUES
('市第一人民医院', '三级甲等', '健康路100号', '010-12345678', 39.9042, 116.4074, 1.2, '综合性三甲医院，科室齐全，医疗设备先进', 1),
('市中医院', '三级甲等', '中医街50号', '010-23456789', 39.9142, 116.4174, 2.5, '中医特色医院，擅长中西医结合治疗', 1),
('市妇幼保健院', '三级甲等', '妇幼路88号', '010-34567890', 39.9242, 116.4274, 3.0, '专业妇幼保健医院', 1),
('社区卫生服务中心', '一级', '社区路10号', '010-45678901', 39.9342, 116.4374, 0.5, '提供基础医疗和预防保健服务', 1),
('市第二人民医院', '三级乙等', '人民路200号', '010-56789012', 39.9442, 116.4474, 4.2, '综合性医院，急诊24小时服务', 1);

-- 插入科室数据
INSERT INTO hospital_departments (hospital_id, name, description, location, status) VALUES
(1, '内科', '内科疾病诊治', '门诊楼2层', 1),
(1, '外科', '外科手术及诊治', '门诊楼3层', 1),
(1, '心血管内科', '心血管疾病专科', '门诊楼4层', 1),
(1, '内分泌科', '糖尿病等内分泌疾病', '门诊楼4层', 1),
(1, '神经内科', '神经系统疾病', '门诊楼5层', 1),
(1, '儿科', '儿童疾病诊治', '门诊楼1层', 1),
(2, '中医内科', '中医内科诊治', '门诊楼1层', 1),
(2, '针灸推拿科', '针灸推拿治疗', '门诊楼2层', 1),
(2, '中医骨伤科', '骨伤中医治疗', '门诊楼2层', 1),
(3, '妇科', '妇科疾病诊治', '门诊楼2层', 1),
(3, '产科', '产前检查及分娩', '住院楼3层', 1),
(3, '儿童保健科', '儿童保健服务', '门诊楼1层', 1);

-- 插入医生数据
INSERT INTO doctors (hospital_id, department_id, name, title, specialty, introduction, status) VALUES
(1, 1, '张医生', '主任医师', '呼吸系统疾病、消化系统疾病', '从医30年，经验丰富', 1),
(1, 1, '李医生', '副主任医师', '心血管疾病、高血压', '擅长慢性病管理', 1),
(1, 3, '王医生', '主任医师', '冠心病、心律失常', '心血管领域专家', 1),
(1, 4, '赵医生', '副主任医师', '糖尿病、甲状腺疾病', '内分泌专家', 1),
(1, 6, '陈医生', '主治医师', '儿童常见病、生长发育', '儿科专家', 1),
(2, 7, '刘医生', '主任医师', '中医调理、慢性病', '名老中医', 1),
(2, 8, '孙医生', '副主任医师', '颈椎病、腰椎病', '针灸推拿专家', 1),
(3, 10, '周医生', '主任医师', '妇科炎症、妇科肿瘤', '妇科专家', 1),
(3, 11, '吴医生', '副主任医师', '高危妊娠、产前诊断', '产科专家', 1);

-- 插入医生排班数据（未来7天）
INSERT INTO doctor_schedules (doctor_id, schedule_date, time_slot, total, remaining, price)
SELECT 
  d.id,
  DATE_ADD(CURDATE(), INTERVAL n.n DAY),
  t.slot,
  20,
  20,
  CASE d.title 
    WHEN '主任医师' THEN 50.00 
    WHEN '副主任医师' THEN 30.00 
    ELSE 15.00 
  END
FROM doctors d
CROSS JOIN (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) n
CROSS JOIN (SELECT 'morning' slot UNION SELECT 'afternoon') t
WHERE d.status = 1;

-- 插入健康知识数据
INSERT INTO health_knowledge (title, category, content, summary, author, status) VALUES
('高血压患者的日常饮食指南', 'hypertension', '高血压患者应该注意低盐饮食，每日盐摄入量不超过6克。多吃新鲜蔬菜水果，少吃油腻食物。适量运动，保持良好心态。定期监测血压，按时服药。', '高血压患者饮食注意事项和日常管理建议', '健康专家', 1),
('糖尿病患者如何科学控糖', 'diabetes', '糖尿病患者需要控制碳水化合物摄入，选择低GI食物。定时定量进餐，避免暴饮暴食。适量运动有助于控制血糖。定期监测血糖，遵医嘱用药。', '糖尿病患者血糖管理和饮食建议', '内分泌专家', 1),
('老年人秋冬季节保健要点', 'elderly_care', '秋冬季节老年人要注意保暖，预防感冒。适当进行室内运动，增强体质。饮食要营养均衡，多喝温水。保持良好的作息习惯，充足睡眠。', '老年人秋冬季节健康保健指南', '老年医学专家', 1),
('青少年健康成长的营养需求', 'youth_health', '青少年正处于生长发育关键期，需要充足的蛋白质、钙、铁等营养素。保证每天喝牛奶，多吃鱼肉蛋类。适量运动促进骨骼发育。保证充足睡眠。', '青少年营养需求和健康成长建议', '营养专家', 1),
('每天30分钟运动的好处', 'fitness', '每天坚持30分钟中等强度运动，可以增强心肺功能，提高免疫力。有助于控制体重，预防慢性病。改善睡眠质量，缓解压力。建议选择适合自己的运动方式。', '运动对健康的益处和运动建议', '运动医学专家', 1),
('如何保持心理健康', 'mental_health', '保持积极乐观的心态，学会调节情绪。与家人朋友保持良好沟通。培养兴趣爱好，丰富生活。遇到困难及时寻求帮助。保证充足睡眠，适量运动。', '心理健康维护和情绪管理建议', '心理咨询师', 1),
('健康饮食的基本原则', 'nutrition', '饮食要多样化，保证营养均衡。多吃蔬菜水果，适量摄入蛋白质。控制油盐糖摄入，少吃加工食品。定时定量进餐，细嚼慢咽。多喝水，少喝含糖饮料。', '健康饮食的基本原则和建议', '营养师', 1),
('慢性病的预防与管理', 'chronic_disease', '慢性病重在预防，保持健康生活方式。定期体检，早发现早治疗。遵医嘱规范用药，不随意停药。定期复查，监测病情变化。保持良好心态，积极面对。', '慢性病预防和管理的综合建议', '全科医生', 1),
('睡眠质量与健康的关系', 'general', '良好的睡眠对健康至关重要。成年人每天需要7-8小时睡眠。保持规律作息，创造良好睡眠环境。睡前避免使用电子设备。如有睡眠问题及时就医。', '睡眠与健康的关系及改善建议', '睡眠医学专家', 1),
('家庭常备药品指南', 'general', '家庭应常备感冒药、退烧药、止痛药、创可贴等基础药品。注意药品有效期，定期检查更换。儿童用药需特别注意剂量。如症状严重应及时就医。', '家庭常备药品清单和使用注意事项', '药剂师', 1);
