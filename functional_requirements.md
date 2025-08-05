# 3. 功能需求規格

### 3.1 數據篩選系統

#### 3.1.1 節點類型定義
```typescript
interface FilterNode {
  id: string;
  type: 'source' | 'filter' | 'aggregation' | 'output';
  config: NodeConfig;
  position: { x: number, y: number };
}

interface NodeConfig {
  // 數據源節點
  source?: {
    table: string;
    columns: string[];
    availableFilters?: ColumnFilterConfig[]; // 可用篩選條件
  };

  // 篩選節點
  filter?: {
    column: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
    value: any;
  };

  // 聚合節點
  aggregation?: {
    type: 'count' | 'sum' | 'avg' | 'max' | 'min';
    column?: string;
    groupBy?: string[];
  };
}

// 欄位篩選配置
interface ColumnFilterConfig {
  column: string;
  displayName: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  isVisible: boolean; // 是否在篩選器中顯示
  isFilterable: boolean; // 是否可篩選
  defaultOperator?: string;
  allowedOperators: string[];
  enumValues?: string[]; // 枚舉值（用於下拉選擇）
  placeholder?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// 表格篩選預設配置
interface TableFilterPreset {
  tableName: string;
  displayName: string;
  description?: string;
  columns: ColumnFilterConfig[];
  hiddenColumns: string[]; // 預設隱藏的欄位
  commonFilters: string[]; // 常用篩選欄位
  autoHideRules: AutoHideRule[]; // 自動隱藏規則
}

// 自動隱藏規則
interface AutoHideRule {
  condition: 'column_count_over' | 'data_type' | 'column_name_pattern' | 'low_cardinality';
  value: any;
  hideColumns?: string[];
  showColumns?: string[];
}
```

#### 3.1.2 智能篩選條件管理

##### 自動欄位分析與預設
系統會自動分析數據表結構，並根據以下規則決定欄位的篩選器顯示狀態：

**預設顯示的欄位類型**:
1. **常用業務欄位**: `id`, `name`, `email`, `status`, `type`, `category`
2. **時間欄位**: `created_at`, `updated_at`, `date`, `time`
3. **數值欄位**: 金額、數量、評分等
4. **枚舉欄位**: 狀態、類型等有限選項欄位

**預設隱藏的欄位類型**:
1. **系統欄位**: `deleted_at`, `remember_token`, `email_verified_at`
2. **大文本欄位**: `description`, `content`, `notes` 等 TEXT 類型
3. **二進制欄位**: `password_hash`, `api_key`, `token`
4. **高基數欄位**: 唯一值過多的欄位（如 UUID、詳細地址）
5. **技術欄位**: `created_by`, `updated_by`, `version`

**智能隱藏規則**:
```typescript
const autoHideRules: AutoHideRule[] = [
  {
    condition: 'column_count_over',
    value: 20, // 超過20個欄位時啟用智能隱藏
    hideColumns: ['created_by', 'updated_by', 'deleted_at', 'remember_token']
  },
  {
    condition: 'data_type',
    value: 'text',
    hideColumns: ['description', 'content', 'notes', 'remarks']
  },
  {
    condition: 'column_name_pattern',
    value: /_(hash|token|key|secret)$/i,
    hideColumns: true // 隱藏匹配的欄位
  },
  {
    condition: 'low_cardinality',
    value: 0.1, // 唯一值比例低於10%的欄位優先顯示
    showColumns: true
  }
];
```

##### 欄位篩選器配置界面
```typescript
// 篩選器管理組件
interface FilterManagerConfig {
  tableName: string;
  availableColumns: ColumnInfo[];
  currentFilters: ColumnFilterConfig[];
  presets: FilterPreset[];
}

// 欄位信息
interface ColumnInfo {
  name: string;
  displayName: string;
  dataType: string;
  nullable: boolean;
  defaultValue: any;
  maxLength?: number;
  uniqueValues?: number; // 唯一值數量
  sampleValues?: any[]; // 樣本數據
  isIndexed: boolean; // 是否有索引（影響查詢性能）
}

// 預設篩選器方案
interface FilterPreset {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  filters: string[]; // 顯示的欄位列表
  commonCombinations: FilterCombination[]; // 常用組合
}

interface FilterCombination {
  name: string;
  filters: {
    column: string;
    operator: string;
    value?: any;
  }[];
}
```
1. **數據源節點**: 連接數據表
2. **篩選節點**: 條件篩選 (=, !=, >, <, LIKE, IN, BETWEEN)
3. **聚合節點**: 統計函數 (COUNT, SUM, AVG, MAX, MIN)
4. **排序節點**: 數據排序
5. **限制節點**: LIMIT/OFFSET
6. **輸出節點**: 結果輸出

### 3.2 通知系統

#### 3.2.1 通知類型
- **Email 通知**: HTML/純文字格式
- **SMS 通知**: 簡訊發送
- **系統內通知**: 站內訊息

#### 3.2.2 追蹤功能
```sql
-- 通知追蹤表
CREATE TABLE notification_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    notification_id BIGINT NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    type ENUM('email', 'sms', 'system') NOT NULL,
    status ENUM('sent', 'delivered', 'opened', 'clicked', 'failed') NOT NULL,
    tracking_token VARCHAR(64) UNIQUE,
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3.2.3 開啟率追蹤實現
- **Email**: 嵌入 1x1 像素圖片
- **SMS**: 短網址點擊追蹤
- **系統內**: 閱讀狀態記錄

### 3.3 目標管理系統

#### 3.3.1 目標類型
```typescript
interface Goal {
  id: string;
  name: string;
  description: string;
  type: 'numeric' | 'percentage' | 'boolean';
  target_value: number;
  current_value: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  data_source_config: FilterFlowConfig;
  status: 'active' | 'paused' | 'completed';
}
```

#### 3.3.2 達成率計算
- 實時計算當前值
- 歷史趨勢分析
- 預測分析 (可選)

### 3.4 CMS 通知管理

#### 3.4.1 功能特性
- 通知模板管理
- 收件人群組管理
- 排程發送
- 批量操作
- 發送歷史查詢
