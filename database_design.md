# 4. 數據庫設計

### 4.1 核心表結構

```sql
-- 篩選流程表
CREATE TABLE filter_flows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSON NOT NULL, -- Vue Flow 配置
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_created_by (created_by)
);

-- 通知配置表
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type ENUM('email', 'sms', 'system') NOT NULL,
    template_id BIGINT,
    recipients JSON NOT NULL, -- 收件人列表
    filter_flow_id BIGINT, -- 關聯篩選流程
    schedule_config JSON, -- 排程配置
    status ENUM('active', 'paused', 'draft') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (filter_flow_id) REFERENCES filter_flows(id),
    INDEX idx_status (status),
    INDEX idx_type (type)
);

-- 目標表
CREATE TABLE goals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('numeric', 'percentage', 'boolean') NOT NULL,
    target_value DECIMAL(15,4) NOT NULL,
    current_value DECIMAL(15,4) DEFAULT 0,
    period ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
    filter_flow_id BIGINT NOT NULL,
    status ENUM('active', 'paused', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (filter_flow_id) REFERENCES filter_flows(id),
    INDEX idx_status (status),
    INDEX idx_period (period)
);

-- 用戶表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'analyst', 'viewer') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- 資料表篩選器配置
CREATE TABLE table_filter_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSON NOT NULL, -- 欄位配置和規則
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_table_name (table_name),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_table_name (table_name),
    INDEX idx_is_active (is_active)
);

-- 欄位篩選器設定
CREATE TABLE column_filter_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    data_type ENUM('string', 'number', 'date', 'boolean', 'enum', 'text') NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    is_filterable BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    default_operator VARCHAR(50),
    allowed_operators JSON,
    enum_values JSON, -- 枚舉值列表
    validation_rules JSON, -- 驗證規則
    placeholder_text VARCHAR(255),
    help_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_table_column (table_name, column_name),
    INDEX idx_table_name (table_name),
    INDEX idx_is_visible (is_visible),
    INDEX idx_sort_order (sort_order)
);

-- 篩選器預設方案
CREATE TABLE filter_presets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    config JSON NOT NULL, -- 預設篩選器配置
    usage_count INT DEFAULT 0, -- 使用次數統計
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_table_name (table_name),
    INDEX idx_is_default (is_default),
    INDEX idx_usage_count (usage_count)
);

-- 常用篩選組合
CREATE TABLE common_filter_combinations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filters JSON NOT NULL, -- 篩選條件組合
    usage_count INT DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_table_name (table_name),
    INDEX idx_usage_count (usage_count)
);

-- 資料表元數據快取
CREATE TABLE table_metadata_cache (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(255) NOT NULL,
    schema_info JSON NOT NULL, -- 表結構信息
    statistics JSON, -- 統計信息（行數、唯一值等）
    last_analyzed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_table_name (table_name),
    INDEX idx_last_analyzed (last_analyzed)
);

-- 儀表板表
CREATE TABLE dashboards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSON NOT NULL, -- 儀表板配置
    is_public BOOLEAN DEFAULT FALSE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_created_by (created_by),
    INDEX idx_is_public (is_public)
);
```
