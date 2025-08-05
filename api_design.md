# 5. API 設計規範

### 5.1 RESTful API 端點

#### 5.1.1 篩選流程 API
```yaml
/api/v1/filter-flows:
  get:
    summary: 獲取篩選流程列表
    parameters:
      - name: page
        in: query
        type: integer
      - name: per_page
        in: query
        type: integer
      - name: search
        in: query
        type: string
  post:
    summary: 創建篩選流程
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/FilterFlowCreate'

/api/v1/filter-flows/{id}:
  get:
    summary: 獲取特定篩選流程
  put:
    summary: 更新篩選流程
  delete:
    summary: 删除篩選流程

/api/v1/filter-flows/{id}/execute:
  post:
    summary: 執行篩選流程
    responses:
      200:
        description: 執行結果
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExecutionResult'

# 資料表篩選器管理 API
/api/v1/tables:
  get:
    summary: 獲取可用資料表列表
    responses:
      200:
        description: 資料表列表
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/TableInfo'

/api/v1/tables/{tableName}/columns:
  get:
    summary: 獲取資料表欄位信息
    parameters:
      - name: tableName
        in: path
        required: true
        schema:
          type: string
      - name: analyze
        in: query
        schema:
          type: boolean
        description: 是否重新分析欄位統計
    responses:
      200:
        description: 欄位信息列表
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/ColumnInfo'

/api/v1/tables/{tableName}/filter-config:
  get:
    summary: 獲取資料表篩選器配置
  put:
    summary: 更新資料表篩選器配置
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/TableFilterConfig'

/api/v1/tables/{tableName}/presets:
  get:
    summary: 獲取資料表篩選器預設方案
  post:
    summary: 創建篩選器預設方案
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/FilterPreset'

/api/v1/tables/{tableName}/sample-data:
  get:
    summary: 獲取資料表樣本數據
    parameters:
      - name: columns
        in: query
        schema:
          type: array
          items:
            type: string
        description: 指定欄位列表
      - name: limit
        in: query
        schema:
          type: integer
          default: 100
    responses:
      200:
        description: 樣本數據
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    type: object
                total:
                  type: integer
                columns:
                  type: array
                  items:
                    type: string

/api/v1/filter-combinations:
  get:
    summary: 獲取常用篩選組合
    parameters:
      - name: table_name
        in: query
        schema:
          type: string
  post:
    summary: 保存篩選組合
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/FilterCombination'
```

#### 5.1.2 通知 API
```yaml
/api/v1/notifications:
  get:
    summary: 獲取通知列表
  post:
    summary: 創建通知

/api/v1/notifications/{id}/send:
  post:
    summary: 發送通知

/api/v1/notifications/tracking/{token}:
  get:
    summary: 追蹤通知開啟 (用於郵件/SMS 點擊)
```

### 5.2 Swagger 配置

#### 5.2.1 基本配置
```yaml
openapi: 3.0.0
info:
  title: 數據分析與通知系統 API
  description: 提供數據篩選、通知發送、目標追蹤等功能的 API
  version: 1.0.0
servers:
  - url: http://localhost:8000/api/v1
    description: 開發環境
  - url: https://api.example.com/v1
    description: 生產環境

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    TableFilterConfig:
      type: object
      required:
        - tableName
        - displayName
        - columns
      properties:
        tableName:
          type: string
        displayName:
          type: string
        description:
          type: string
        columns:
          type: array
          items:
            $ref: '#/components/schemas/ColumnFilterConfig'
        autoHideRules:
          type: array
          items:
            $ref: '#/components/schemas/AutoHideRule'

    ColumnFilterConfig:
      type: object
      required:
        - column
        - displayName
        - dataType
      properties:
        column:
          type: string
        displayName:
          type: string
        dataType:
          type: string
          enum: [string, number, date, boolean, enum, text]
        isVisible:
          type: boolean
          default: true
        isFilterable:
          type: boolean
          default: true
        sortOrder:
          type: integer
          default: 0
        defaultOperator:
          type: string
        allowedOperators:
          type: array
          items:
            type: string
        enumValues:
          type: array
          items:
            type: string
        placeholder:
          type: string
        helpText:
          type: string
        validation:
          type: object
          properties:
            required:
              type: boolean
            min:
              type: number
            max:
              type: number
            pattern:
              type: string

    TableInfo:
      type: object
      properties:
        name:
          type: string
        displayName:
          type: string
        description:
          type: string
        rowCount:
          type: integer
        columnCount:
          type: integer
        lastAnalyzed:
          type: string
          format: date-time
        hasFilterConfig:
          type: boolean

    ColumnInfo:
      type: object
      properties:
        name:
          type: string
        displayName:
          type: string
        dataType:
          type: string
        nullable:
          type: boolean
        defaultValue:
          type: string
        maxLength:
          type: integer
          nullable: true
        uniqueValues:
          type: integer
        sampleValues:
          type: array
          items: {}
        isIndexed:
          type: boolean
        cardinality:
          type: number
          description: 唯一值比例

    FilterPreset:
      type: object
      required:
        - name
        - filters
      properties:
        name:
          type: string
        description:
          type: string
        isDefault:
          type: boolean
        filters:
          type: array
          items:
            type: string
        commonCombinations:
          type: array
          items:
            $ref: '#/components/schemas/FilterCombination'

    FilterCombination:
      type: object
      required:
        - name
        - filters
      properties:
        name:
          type: string
        description:
          type: string
        filters:
          type: array
          items:
            type: object
            properties:
              column:
                type: string
              operator:
                type: string
              value: {}

    AutoHideRule:
      type: object
      required:
        - condition
        - value
      properties:
        condition:
          type: string
          enum: [column_count_over, data_type, column_name_pattern, low_cardinality]
        value: {}
        hideColumns:
          type: array
          items:
            type: string
        showColumns:
          type: array
          items:
            type: string
```
