-- AI 企业数字化工作台 — 初始化建表

CREATE DATABASE IF NOT EXISTS ai_workspace
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE ai_workspace;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('admin','user') NOT NULL DEFAULT 'user',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1:启用 0:禁用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 客户表
CREATE TABLE IF NOT EXISTS `customer` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '客户名称',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '电话',
  `company` VARCHAR(200) DEFAULT NULL COMMENT '公司',
  `status` ENUM('new','following','closed','lost') NOT NULL DEFAULT 'new' COMMENT '状态：新客户/跟进中/已成交/已流失',
  `owner_id` INT NOT NULL COMMENT '负责人 ID',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_owner` (`owner_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 项目表（支持企业级项目管理）
DROP TABLE IF EXISTS `project_log`;
DROP TABLE IF EXISTS `project`;
CREATE TABLE IF NOT EXISTS `project` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT '项目名称',
  `description` TEXT DEFAULT NULL COMMENT '项目描述',
  `customer_id` INT DEFAULT NULL COMMENT '关联客户 ID',
  `manager_id` INT NOT NULL COMMENT '负责人 ID',
  `priority` ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium' COMMENT '优先级：低/中/高/紧急',
  `progress` INT DEFAULT 0 COMMENT '进度百分比 0-100',
  `status` ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending' COMMENT '状态：未开始/进行中/已完成',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_manager` (`manager_id`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 项目动态表
CREATE TABLE IF NOT EXISTS `project_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL COMMENT '项目 ID',
  `action` VARCHAR(50) NOT NULL COMMENT '动作',
  `content` VARCHAR(500) NOT NULL COMMENT '日志内容',
  `operator_id` INT NOT NULL COMMENT '操作人 ID',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试用户（密码均为 123456）
-- AI 历史记录表
CREATE TABLE IF NOT EXISTS `ai_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户 ID',
  `type` VARCHAR(50) NOT NULL DEFAULT 'form' COMMENT '类型: form/analyze/document',
  `input` TEXT NOT NULL COMMENT '用户输入',
  `result` LONGTEXT DEFAULT NULL COMMENT 'AI 返回结果',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_user` (`user_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `user` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
(2, 'user', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user');

-- 插入测试客户数据
INSERT IGNORE INTO `customer` (`id`, `name`, `phone`, `company`, `status`, `owner_id`) VALUES
(1, '张三', '13800138001', '深圳前海科技有限公司', 'new', 1),
(2, '李四', '13800138002', '北京易联信息技术有限公司', 'following', 1),
(3, '王五', '13800138003', '上海数据智能中心', 'closed', 1),
(4, '赵六', '13800138004', '广州云创网络技术有限公司', 'following', 2),
(5, '陈七', '13800138005', '杭州星辰软件有限公司', 'new', 2),
(6, '刘八', '13800138006', '成都天府科技有限公司', 'lost', 1),
(7, '孙九', '13800138007', '武汉光谷信息技术有限公司', 'following', 1),
(8, '周十', '13800138008', '南京智慧数据有限公司', 'closed', 2),
(9, '吴明', '13800138009', '西安丝绸之路科技', 'new', 1),
(10, '郑华', '13800138010', '重庆山城数据有限公司', 'following', 1);

-- 插入测试项目数据
INSERT IGNORE INTO `project` (`id`, `name`, `description`, `customer_id`, `manager_id`, `priority`, `progress`, `status`, `start_time`, `end_time`) VALUES
(1, 'AI 客服系统', '基于大模型的智能客服系统，支持多轮对话、工单自动分配、知识库检索。', 1, 1, 'urgent', 65, 'in_progress', '2026-01-15', '2026-06-30'),
(2, '数据分析平台', '企业级 BI 数据分析平台，支持多数据源接入、可视化报表、数据大屏。', 3, 1, 'high', 100, 'completed', '2025-11-01', '2026-03-20'),
(3, '客户关系管理系统', '全流程客户关系管理，包含线索、商机、合同、售后模块。', 2, 2, 'high', 30, 'in_progress', '2026-03-01', '2026-09-30'),
(4, '智能文档生成工具', 'AI 驱动的文档自动生成工具，支持模板配置、批量生成、格式转换。', 5, 1, 'medium', 0, 'pending', '2026-07-01', '2026-12-31'),
(5, '数据中台建设', '统一数据采集、清洗、存储、服务的数据中台基础设施。', 4, 2, 'urgent', 85, 'in_progress', '2025-12-01', '2026-05-30'),
(6, '移动端报表系统', '面向管理者的移动端数据报表应用，支持实时推送和离线查看。', 2, 1, 'medium', 0, 'pending', '2026-08-01', '2026-11-30'),
(7, '自动化运维平台', '服务器巡检、告警、自动扩缩容的一体化运维平台。', 1, 2, 'low', 100, 'completed', '2025-06-01', '2026-01-15'),
(8, '企业知识图谱', '基于知识图谱的企业文档智能检索与推荐系统。', 3, 1, 'high', 45, 'in_progress', '2026-02-01', '2026-08-31');

-- 插入项目动态种子数据
INSERT IGNORE INTO `project_log` (`id`, `project_id`, `action`, `content`, `operator_id`, `create_time`) VALUES
(1, 1, 'create', 'admin 创建了项目「AI 客服系统」', 1, '2026-01-15 09:00:00'),
(2, 1, 'update_status', 'admin 变更状态为「进行中」', 1, '2026-01-20 10:00:00'),
(3, 1, 'update_progress', 'admin 更新进度至 65%', 1, '2026-06-01 14:00:00'),
(4, 2, 'create', 'admin 创建了项目「数据分析平台」', 1, '2025-11-01 09:00:00'),
(5, 2, 'update_progress', 'admin 更新进度至 100%', 1, '2026-03-20 16:00:00'),
(6, 2, 'update_status', 'admin 变更状态为「已完成」', 1, '2026-03-20 16:30:00'),
(7, 3, 'create', 'user 创建了项目「客户关系管理系统」', 2, '2026-03-01 10:00:00'),
(8, 3, 'update_progress', 'user 更新进度至 30%', 2, '2026-05-15 11:00:00');


-- 系统配置表
CREATE TABLE IF NOT EXISTS `system_config` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 登录日志表
CREATE TABLE IF NOT EXISTS `login_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户 ID',
  `username` VARCHAR(50) NOT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 默认系统配置

-- 表单申请表
CREATE TABLE IF NOT EXISTS `form_request` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '提交人 ID',
  `form_type` VARCHAR(100) NOT NULL COMMENT '表单类型',
  `form_schema` LONGTEXT NOT NULL COMMENT '生成时的 Schema',
  `form_data` LONGTEXT NOT NULL COMMENT '用户填写的表单数据',
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `reason` TEXT DEFAULT NULL COMMENT '审批意见',
  `project_id` INT DEFAULT NULL COMMENT '关联项目 ID',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `system_config` (`key`, `value`) VALUES
('system_name', 'AI 企业数字化工作台'),
('primary_color', '#1677FF'),
('ai_api_key', ''),
('ai_model', 'deepseek-chat');

-- 种子数据中的密码哈希说明：123456 的 bcrypt hash
-- 如果登录失效，请手动 INSERT 或保留 Mock 认证逻辑
