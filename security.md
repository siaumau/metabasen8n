# 6. 安全性考量

### 6.1 認證與授權

#### 6.1.1 JWT 認證
```php
// JWT 配置
class JWTConfig {
    public const ALGORITHM = 'HS256';
    public const ACCESS_TOKEN_TTL = 3600; // 1小時
    public const REFRESH_TOKEN_TTL = 604800; // 7天
}

// 權限中間件
class AuthMiddleware {
    public function handle($request, $next, $role = null) {
        $token = $this->extractToken($request);
        $user = $this->validateToken($token);

        if ($role && !$this->hasRole($user, $role)) {
            throw new UnauthorizedException();
        }

        return $next($request);
    }
}
```

#### 6.1.2 角色權限系統
```sql
-- 權限表
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL
);

-- 角色權限關聯表
CREATE TABLE role_permissions (
    role ENUM('admin', 'analyst', 'viewer') NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role, permission_id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- 基本權限數據
INSERT INTO permissions (name, description, resource, action) VALUES
('filter_flows.create', '創建篩選流程', 'filter_flows', 'create'),
('filter_flows.read', '查看篩選流程', 'filter_flows', 'read'),
('filter_flows.update', '修改篩選流程', 'filter_flows', 'update'),
('filter_flows.delete', '删除篩選流程', 'filter_flows', 'delete'),
('notifications.send', '發送通知', 'notifications', 'send'),
('goals.manage', '管理目標', 'goals', 'manage');
```

### 6.2 數據安全

#### 6.2.1 SQL 注入防護
```php
class SecureQueryBuilder {
    private PDO $connection;

    public function buildFilterQuery(array $filters): string {
        $conditions = [];
        $params = [];

        foreach ($filters as $filter) {
            $this->validateFilter($filter);
            $conditions[] = $this->buildCondition($filter, $params);
        }

        return "SELECT * FROM table WHERE " . implode(' AND ', $conditions);
    }

    private function validateFilter(array $filter): void {
        $allowedOperators = ['=', '!=', '>', '<', 'LIKE', 'IN', 'BETWEEN'];
        if (!in_array($filter['operator'], $allowedOperators)) {
            throw new InvalidArgumentException('Invalid operator');
        }

        // 驗證欄位名稱
        if (!$this->isValidColumn($filter['column'])) {
            throw new InvalidArgumentException('Invalid column');
        }
    }
}
```

#### 6.2.2 輸入驗證
```php
class FilterFlowValidator {
    public function validate(array $data): array {
        $rules = [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'config' => 'required|array',
            'config.nodes' => 'required|array',
            'config.edges' => 'required|array'
        ];

        return $this->validateData($data, $rules);
    }

    public function validateNodeConfig(array $node): void {
        $allowedTypes = ['source', 'filter', 'aggregation', 'output'];
        if (!in_array($node['type'], $allowedTypes)) {
            throw new ValidationException('Invalid node type');
        }

        // 根據節點類型驗證配置
        switch ($node['type']) {
            case 'source':
                $this->validateSourceNode($node);
                break;
            case 'filter':
                $this->validateFilterNode($node);
                break;
            // ... 其他節點類型
        }
    }
}
```

### 6.3 通知安全

#### 6.3.1 追蹤 Token 安全
```php
class TrackingTokenService {
    public function generateToken(int $notificationId, string $recipient): string {
        $payload = [
            'notification_id' => $notificationId,
            'recipient' => hash('sha256', $recipient),
            'expires_at' => time() + (30 * 24 * 3600) // 30天過期
        ];

        return $this->encrypt(json_encode($payload));
    }

    public function validateToken(string $token): ?array {
        try {
            $payload = json_decode($this->decrypt($token), true);

            if ($payload['expires_at'] < time()) {
                return null;
            }

            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }
}
```

### 6.4 API 安全

#### 6.4.1 速率限制
```php
class RateLimitMiddleware {
    public function handle($request, $next, $maxAttempts = 60, $decayMinutes = 1) {
        $key = $this->resolveRequestSignature($request);

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            throw new TooManyRequestsException();
        }

        $this->limiter->hit($key, $decayMinutes * 60);

        return $next($request);
    }
}
```

#### 6.4.2 CORS 配置
```php
class CorsMiddleware {
    public function handle($request, $next) {
        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin', $this->getAllowedOrigins());
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        $response->headers->set('Access-Control-Max-Age', '86400');

        return $response;
    }
}
```
