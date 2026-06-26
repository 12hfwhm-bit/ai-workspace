# AI 企业数字化工作台（Lite版）— 设计文档

> 项目名称：AI Digital Workspace  
> 技术栈：Vue3 + TypeScript + Node.js + MySQL + DeepSeek  
> 开发模式：单人全栈开发

---

## 目录

1. [项目整体架构设计](#1-项目整体架构设计)
2. [前端目录结构](#2-前端目录结构)
3. [后端目录结构](#3-后端目录结构)
4. [数据库设计](#4-数据库设计)
5. [API 设计](#5-api-设计)
6. [分阶段开发计划](#6-分阶段开发计划)

---

## 1. 项目整体架构设计

### 1.1 架构图

\\\
┌──────────────────────────────────────────────────────────────────┐
│                        前端 (Vue3 SPA)                            │
│                                                                  │
│   Vue Router ─── Pages / Components ─── Pinia Store              │
│           Axios HTTP  ←→  API Module                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST API (JSON)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    后端 (Node.js + Express)                       │
│                                                                  │
│  Routes → Controllers → Services → Models + mysql2               │
│  Middleware: JWT Auth / Multer / Error Handler                    │
│  AI Layer: DeepSeek API Client                                   │
└────────────────────┬──────────────┬──────────────────────────────┘
                     │              │
                     ▼              ▼
                 MySQL DB      DeepSeek API
                (3306)        (api.deepseek.com)
\\\

### 1.2 架构原则

| 原则 | 说明 |
|------|------|
| **前后端分离** | Vue3 独立部署（Nginx），API 服务独立运行 |
| **三层后端** | Routes → Controllers → Services，避免过度抽象 |
| **AI 全部走服务端** | 前端不直连 DeepSeek，防止 API Key 泄漏 |
| **JWT 无状态认证** | 后端不维护 Session，Token 自带用户信息 |
| **个人友好** | 不引入微服务、MQ、Redis，单 Node 进程 + MySQL 足够 |

### 1.3 技术栈选型

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 前端框架 | Vue 3 + TypeScript | 组合式 API + 类型安全 |
| 构建工具 | Vite | 快速 HMR，开发体验好 |
| 状态管理 | Pinia | Vue 3 官方推荐，TS 友好 |
| UI 组件 | Element Plus | 企业级组件库，表单/表格/对话框开箱即用 |
| 图表 | ECharts | 成熟的数据可视化库 |
| HTTP | Axios | 拦截器机制适合统一处理 Token |
| 后端框架 | Express | Node.js 最成熟的 Web 框架 |
| 数据库驱动 | mysql2/promise | 轻量，无需 ORM 增加复杂度 |
| 认证 | jsonwebtoken + bcryptjs | JWT 签发 + 密码哈希 |
| 文件上传 | Multer | Express 生态的标准中间件 |

---

## 2. 前端目录结构

\\\
ai-digital-workspace-client/
│
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── index.html                  # HTML 入口
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.node.json          # Node 端 TS 配置
├── package.json
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── main.ts                 # 入口：挂载 App / Pinia / Router
    ├── App.vue                 # 根组件
    │
    ├── router/
    │   └── index.ts            # 路由表 + 路由守卫
    │
    ├── store/
    │   ├── index.ts            # Pinia 实例创建
    │   ├── user.ts             # 用户状态：Token / 角色 / 信息
    │   └── app.ts              # 全局状态：侧边栏折叠 / 主题
    │
    ├── api/
    │   ├── request.ts          # Axios 实例：baseURL / Token 拦截 / 错误处理
    │   ├── auth.ts             # POST login / GET profile / POST logout
    │   ├── customer.ts         # 客户 CRUD 接口
    │   ├── project.ts          # 项目 CRUD 接口
    │   ├── ai.ts               # AI 表单/分析/文档/历史接口
    │   └── dashboard.ts        # Dashboard 统计/图表接口
    │
    ├── layouts/
    │   ├── MainLayout.vue      # Header + Sidebar + RouterView
    │   ├── Sidebar.vue         # 侧边栏导航菜单
    │   ├── Header.vue          # 顶部栏：Logo / 面包屑 / 用户菜单
    │   └── Breadcrumb.vue      # 面包屑导航
    │
    ├── views/
    │   ├── login/
    │   │   └── LoginView.vue   # 登录页
    │   ├── dashboard/
    │   │   └── DashboardView.vue  # 数据看板
    │   ├── customer/
    │   │   ├── CustomerList.vue   # 客户列表（表格 + 搜索 + 分页）
    │   │   └── CustomerDetail.vue # 客户详情
    │   ├── project/
    │   │   ├── ProjectList.vue    # 项目列表
    │   │   └── ProjectDetail.vue  # 项目详情
    │   ├── ai/
    │   │   ├── AIFormGenerator.vue    # AI 动态表单生成
    │   │   ├── AIDataAnalysis.vue     # AI 数据分析
    │   │   ├── AIDocumentAssist.vue   # AI 文档助手
    │   │   └── AIHistory.vue          # AI 历史记录
    │   └── settings/
    │       └── SettingsView.vue   # 系统设置
    │
    ├── components/
    │   ├── StatCard.vue         # 统计卡片
    │   ├── DynamicForm.vue      # 根据 JSON Schema 动态渲染表单
    │   ├── ChartRenderer.vue    # ECharts 统一封装
    │   ├── FileUploader.vue     # 文件上传组件
    │   └── Pagination.vue       # 分页组件
    │
    ├── composables/
    │   ├── useAuth.ts           # 认证组合式函数：login / logout / token
    │   └── usePagination.ts     # 分页组合式函数：page / size / total
    │
    ├── utils/
    │   ├── format.ts            # 日期格式化、数字格式化
    │   ├── permission.ts        # 角色权限判断
    │   └── constants.ts         # 客户状态 / 项目状态枚举
    │
    └── styles/
        ├── variables.scss       # 颜色 / 圆角 / 间距变量
        └── global.scss          # 全局样式重置
\\\

### 2.1 路由表规划

| 路径 | 页面 | 权限 |
|------|------|------|
| \/login\ | LoginView | 公开 |
| \/\ | DashboardView | 登录 |
| \/customer\ | CustomerList | 登录 |
| \/customer/:id\ | CustomerDetail | 登录 |
| \/project\ | ProjectList | 登录 |
| \/project/:id\ | ProjectDetail | 登录 |
| \/ai/form\ | AIFormGenerator | 登录 |
| \/ai/analyze\ | AIDataAnalysis | 登录 |
| \/ai/document\ | AIDocumentAssist | 登录 |
| \/ai/history\ | AIHistory | 登录 |
| \/settings\ | SettingsView | 登录 + Admin |

---

## 3. 后端目录结构

\\\
ai-digital-workspace-server/
│
├── .env                        # 环境变量（不提交 Git）
├── .env.example                # 环境变量模板
├── package.json
├── app.js                      # 入口：Express 配置 + 中间件注册 + 路由挂载
│
├── config/
│   ├── index.js                # 统一配置：端口 / DB / JWT 密钥 / DeepSeek Key
│   └── db.js                   # MySQL 连接池（mysql2/promise）
│
├── middleware/
│   ├── auth.js                 # JWT 验证中间件
│   └── errorHandler.js         # 全局错误处理
│
├── routes/
│   ├── index.js                # 路由汇总，统一挂载 /api/*
│   ├── auth.js                 # POST /api/auth/*
│   ├── customer.js             # /api/customer/*
│   ├── project.js              # /api/project/*
│   ├── dashboard.js            # /api/dashboard/*
│   └── ai.js                   # /api/ai/*
│
├── controllers/
│   ├── authController.js       # 参数校验 -> 调用 Service -> 响应
│   ├── customerController.js
│   ├── projectController.js
│   ├── dashboardController.js
│   └── aiController.js
│
├── services/
│   ├── deepseek.js             # DeepSeek API 调用封装
│   ├── pdfParser.js            # PDF 文本提取
│   └── schemaHelper.js         # JSON Schema 生成/校验辅助
│
├── models/
│   ├── User.js                 # SQL 查询封装
│   ├── Customer.js
│   ├── Project.js
│   ├── AIHistory.js
│   └── Dashboard.js            # 聚合查询
│
├── utils/
│   ├── jwt.js                  # Token 签发/验证
│   └── response.js             # 统一响应 helper
│
├── migrations/
│   └── init.sql                # 建库建表 SQL
│
└── uploads/                    # Multer 文件上传目录
    └── .gitkeep
\\\

### 3.1 关键设计决策

- **不使用 ORM**：个人项目中 mysql2/promise 写 SQL 更可控，不会有 ORM 的学习成本和隐式查询
- **Service 层独立**：所有 DeepSeek 调用集中在 \services/deepseek.js\，换模型/换厂商只需改这一个文件
- **Utils 轻量化**：\jwt.js\ 封装 sign/verify，\esponse.js\ 统一 \{ code, data, message }\

---

## 4. 数据库设计

### 4.1 整体 ER 关系

\\\
user (1) ──────> (N) customer     用户拥有客户
user (1) ──────> (N) project      用户管理项目
user (1) ──────> (N) ai_history   用户调用 AI
\\\

### 4.2 表结构

#### \user\ — 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | NOT NULL UNIQUE | 用户名 |
| password | VARCHAR(255) | NOT NULL | bcrypt 哈希 |
| avatar | VARCHAR(255) | DEFAULT NULL | 头像 URL |
| role | ENUM('admin','user') | NOT NULL DEFAULT 'user' | 角色 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### \customer\ — 客户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK AUTO_INCREMENT | 客户ID |
| name | VARCHAR(100) | NOT NULL | 客户名称 |
| phone | VARCHAR(20) | DEFAULT NULL | 电话 |
| company | VARCHAR(200) | DEFAULT NULL | 公司 |
| status | ENUM('new','following','closed','lost') | NOT NULL DEFAULT 'new' | 状态 |
| owner | INT | NOT NULL | 负责人 ID（→ user.id） |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**：\idx_owner\ (\owner\)、\idx_status\ (\status\)

#### \project\ — 项目表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK AUTO_INCREMENT | 项目ID |
| name | VARCHAR(200) | NOT NULL | 项目名称 |
| manager | INT | NOT NULL | 负责人 ID（→ user.id） |
| progress | TINYINT | NOT NULL DEFAULT 0 | 进度 0-100 |
| status | ENUM('pending','in_progress','completed') | DEFAULT 'pending' | 状态 |
| start_time | DATE | DEFAULT NULL | 开始日期 |
| end_time | DATE | DEFAULT NULL | 结束日期 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**：\idx_manager\ (\manager\)、\idx_status\ (\status\)

#### \i_history\ — AI 操作记录表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK AUTO_INCREMENT | 记录ID |
| user_id | INT | NOT NULL | 操作用户 ID（→ user.id） |
| type | ENUM('form','analyze','document') | NOT NULL | AI 类型 |
| input | TEXT | NOT NULL | 用户输入（或文件路径） |
| result | JSON | DEFAULT NULL | AI 返回结果 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**：\idx_user\ (\user_id\)、\idx_type\ (\	ype\)

### 4.3 建库 SQL

\\\sql
CREATE DATABASE IF NOT EXISTS ai_workspace
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE ai_workspace;
\\\

完整建表语句见 \migrations/init.sql\。

---

## 5. API 设计

### 5.1 通用约定

- **基础路径**：\/api\
- **请求体格式**：\pplication/json\
- **认证方式**：\Authorization: Bearer <token>\
- **统一响应格式**：

\\\json
// 成功
{ "code": 0, "data": { ... }, "message": "success" }

// 失败
{ "code": 40001, "data": null, "message": "用户名或密码错误" }
\\\

### 5.2 错误码定义

| code | 含义 |
|------|------|
| 0 | 成功 |
| 40001 | 认证失败（Token 无效/过期） |
| 40002 | 参数校验失败 |
| 40003 | 资源不存在 |
| 40004 | 无权限（非 Admin） |
| 40005 | 账号或密码错误 |
| 50000 | 服务器内部错误 |
| 50001 | AI 服务调用失败 |

### 5.3 接口列表

#### 用户认证

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | \/api/auth/login\ | 登录，返回 Token | 公开 |
| GET | \/api/auth/profile\ | 获取当前用户信息 | 登录 |
| POST | \/api/auth/logout\ | 退出（前端清除 Token） | 登录 |
| POST | \/api/auth/register\ | 注册 | 公开（开发用） |

**POST /api/auth/login 请求/响应示例**：

\\\json
// Request
{ "username": "admin", "password": "123456" }

// Response
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "avatar": null
    }
  },
  "message": "success"
}
\\\

#### Dashboard

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | \/api/dashboard/stats\ | 统计卡片数据 | 登录 |
| GET | \/api/dashboard/charts\ | 图表数据 | 登录 |

**GET /api/dashboard/stats 响应**：

\\\json
{
  "code": 0,
  "data": {
    "totalCustomers": 128,
    "totalProjects": 35,
    "aiCalls": 256,
    "newCustomersThisMonth": 12,
    "customerGrowth": [
      { "month": "2026-01", "count": 10 },
      { "month": "2026-02", "count": 15 }
    ],
    "projectStatus": [
      { "status": "pending", "count": 5 },
      { "status": "in_progress", "count": 20 },
      { "status": "completed", "count": 10 }
    ],
    "recentAI": [
      { "id": 1, "type": "form", "input": "生成客户拜访审批单", "createTime": "..." }
    ]
  },
  "message": "success"
}
\\\

#### 客户管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | \/api/customer/list?page=1&size=10&keyword=\ | 分页查询 | 登录 |
| GET | \/api/customer/:id\ | 客户详情 | 登录 |
| POST | \/api/customer/create\ | 新增客户 | 登录 |
| PUT | \/api/customer/update\ | 编辑客户 | 登录 |
| DELETE | \/api/customer/delete?id=\ | 删除客户 | Admin |

**GET /api/customer/list 响应**：

\\\json
{
  "code": 0,
  "data": {
    "list": [
      { "id": 1, "name": "张三", "phone": "138xxxx", "company": "XX科技", "status": "following", "owner": "admin", "createTime": "2026-06-01" }
    ],
    "total": 128,
    "page": 1,
    "size": 10
  },
  "message": "success"
}
\\\

#### 项目管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | \/api/project/list?page=1&size=10&keyword=\ | 分页查询 | 登录 |
| GET | \/api/project/:id\ | 项目详情 | 登录 |
| POST | \/api/project/create\ | 新增项目 | 登录 |
| PUT | \/api/project/update\ | 编辑项目 | 登录 |
| DELETE | \/api/project/delete?id=\ | 删除项目 | Admin |

#### AI 功能

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | \/api/ai/form\ | 动态表单生成 | 登录 |
| POST | \/api/ai/analyze\ | 数据分析 | 登录 |
| POST | \/api/ai/document\ | 文档分析（multipart/form-data） | 登录 |
| GET | \/api/ai/history?page=1&size=10&type=\ | 历史记录列表 | 登录 |
| GET | \/api/ai/history/:id\ | 记录详情 | 登录 |
| DELETE | \/api/ai/history/:id\ | 删除记录 | 登录 |

**POST /api/ai/form 请求/响应**：

\\\json
// Request
{ "prompt": "生成客户拜访审批单" }

// Response
{
  "code": 0,
  "data": {
    "schema": {
      "type": "object",
      "title": "客户拜访审批单",
      "properties": {
        "customerName": { "type": "string", "title": "客户名称" },
        "visitDate": { "type": "string", "format": "date", "title": "拜访日期" },
        "purpose": { "type": "string", "title": "拜访目的", "component": "textarea" },
        "estimatedCost": { "type": "number", "title": "预计费用" }
      },
      "required": ["customerName", "visitDate"]
    }
  },
  "message": "success"
}
\\\

**POST /api/ai/document 请求**：\multipart/form-data\，字段 \ile\（PDF 文件）

---

## 6. 分阶段开发计划

### 6.1 总体时间线

\\\
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6 ──→ Phase 7
  4天          6天          4天          3天          3天          2天          3天
                                                                              总计约 25 天
\\\

### 6.2 Phase 1 — 项目骨架与用户认证（第1-4天）

**目标**：前后端项目跑通，完成登录流程。

**后端任务**：
- [ ] Express 项目初始化（app.js，中间件注册）
- [ ] MySQL 连接池配置（config/db.js）
- [ ] JWT 工具函数（签发 + 验证）
- [ ] 用户表建表（migrations/init.sql）
- [ ] POST \/api/auth/login\、\/api/auth/register\
- [ ] GET \/api/auth/profile\ + JWT 验证中间件

**前端任务**：
- [ ] Vite + Vue3 + TS 项目初始化
- [ ] Element Plus 引入 + 主题变量
- [ ] 登录页 UI（LoginView.vue）
- [ ] Axios 封装 + Token 拦截器
- [ ] 路由守卫 + Pinia 用户状态
- [ ] MainLayout 布局（Header + Sidebar）

**验收标准**：可登录/注册，进入带侧边栏的主页，退出后无法访问受保护路由。

### 6.3 Phase 2 — Dashboard + 客户管理 + 项目管理（第5-10天）

**目标**：核心业务功能可用。

**后端任务**：
- [ ] customer + project 表建表
- [ ] 客户 CRUD API
- [ ] 项目 CRUD API
- [ ] Dashboard 统计/图表聚合查询 API

**前端任务**：
- [ ] 客户列表页（表格 + 搜索 + 分页）
- [ ] 客户新增/编辑对话框
- [ ] 客户详情页
- [ ] 项目列表页
- [ ] 项目新增/编辑对话框
- [ ] 项目详情页
- [ ] Dashboard 统计卡片 + ECharts 折线图/饼图

**验收标准**：可增删改查客户和项目，Dashboard 显示统计数据和图表。

### 6.4 Phase 3 — AI 动态表单生成（第11-14天）

**目标**：用自然语言让 AI 生成业务表单。

**后端任务**：
- [ ] DeepSeek API 封装（services/deepseek.js）
- [ ] POST \/api/ai/form\ 接口
- [ ] JSON Schema 校验
- [ ] 保存记录到 ai_history 表

**前端任务**：
- [ ] AI 表单生成页面 UI
- [ ] 自然语言输入文本框 + 生成按钮
- [ ] DynamicForm 组件（根据 Schema 动态渲染 input/date/textarea/select）
- [ ] 表单预览 + 保存

**验收标准**：输入"生成客户拜访审批单"→ AI 返回 Schema → 页面渲染出表单。

### 6.5 Phase 4 — AI 数据分析（第15-17天）

**目标**：AI 对业务数据进行洞察分析。

**后端任务**：
- [ ] POST \/api/ai/analyze\ 接口
- [ ] 组装客户/项目统计数据发送 DeepSeek
- [ ] 解析 AI 返回的分析报告 + 推荐图表类型

**前端任务**：
- [ ] 数据分析页面 UI
- [ ] 选择数据源（客户/项目）
- [ ] 展示分析报告
- [ ] ChartRenderer 自动渲染推荐图表

**验收标准**：选择客户数据 → AI 返回分析结论 + 推荐图表 → 页面展示。

### 6.6 Phase 5 — AI 文档助手（第18-20天）

**目标**：上传 PDF，AI 自动总结。

**后端任务**：
- [ ] Multer 文件上传配置
- [ ] PDF 文本提取（pdf-parse）
- [ ] POST \/api/ai/document\ 接口（多段式 DeepSeek 调用）

**前端任务**：
- [ ] 文档上传组件（拖拽上传）
- [ ] 左右分栏布局（左：PDF 预览 iframe / 右：AI 结果）
- [ ] 文档摘要 + 关键词 + 风险提示展示

**验收标准**：上传 PDF → 右侧显示摘要、关键词、风险提示。

### 6.7 Phase 6 — AI 历史记录（第21-22天）

**目标**：回顾所有 AI 操作。

**后端任务**：
- [ ] GET \/api/ai/history\（分页 + 按 type 筛选）
- [ ] GET \/api/ai/history/:id\
- [ ] DELETE \/api/ai/history/:id\

**前端任务**：
- [ ] 历史记录列表页（按类型 Tab 切换）
- [ ] 查看详情弹窗
- [ ] 删除确认

**验收标准**：能看到所有 AI 操作记录，支持筛选、查看详情和删除。

### 6.8 Phase 7 — 优化与部署（第23-25天）

**后端任务**：
- [ ] 全局错误处理完善
- [ ] SQL 注入防护（参数化查询）
- [ ] CORS 配置
- [ ] 编写 \.env.example\

**前端任务**：
- [ ] 打包优化（CDN 提取 Element Plus / ECharts）
- [ ] 响应式布局微调
- [ ] 全局 loading 状态统一
- [ ] 404 页面

**部署**：
- [ ] 编写 Nginx 配置（前端静态资源 + API 反向代理）
- [ ] 编写 Dockerfile（可选）
- [ ] 编写 README.md（启动说明）

**验收标准**：项目可在云服务器上完整运行。

### 6.9 开发建议

1. **Mock 优先**：前期可 mock DeepSeek 接口，减少 API 调用费用，最后再接入真实模型。
2. **每阶段可交付**：每个 Phase 产出可运行的版本，中间暂停不会浪费进度。
3. **AI 功能可并行**：Phase 3-5 互不依赖，可以按兴趣顺序开发。
4. **Git 分支策略**：\main\ 保稳定，\phase-*\ 分支开发，合并后删除。
