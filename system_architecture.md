# 2. 系統架構設計

### 2.1 整體架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vue3)   │◄──►│  API Gateway    │◄──►│   後端 (PHP)    │
│  + Vue Flow     │    │   + Swagger     │    │   + Laravel     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   通知服務      │◄────────────┤
                       │ Email/SMS API   │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │   MySQL 數據庫  │◄────────────┘
                       │   + 追蹤數據    │
                       └─────────────────┘
```

### 2.2 模組化設計 (SOLID 原則)

#### 單一職責原則 (SRP)
- **DataFilterService**: 專責數據篩選邏輯
- **NotificationService**: 專責通知發送
- **TrackingService**: 專責開啟率追蹤
- **ReportService**: 專責報表生成
- **GoalService**: 專責目標管理

#### 開放封閉原則 (OCP)
- 使用 Strategy Pattern 實現不同篩選節點類型
- 使用 Factory Pattern 創建不同通知渠道

#### 里氏替換原則 (LSP)
- 抽象 NotificationChannel 介面
- 具體實現 EmailChannel, SmsChannel

#### 介面隔離原則 (ISP)
- 分離讀寫介面 (CQRS 模式)
- 細分權限介面

#### 依賴反轉原則 (DIP)
- 使用依賴注入容器
- 基於介面編程
