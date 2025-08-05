# 10. 部署與運維

### 10.1 Docker 容器化

#### 10.1.1 Docker Compose 配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.php
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=mysql
      - DB_DATABASE=analytics_system
      - DB_USERNAME=root
      - DB_PASSWORD=secret
      - REDIS_HOST=redis
    volumes:
      - ./backend:/var/www/html
    depends_on:
      - mysql
      - redis

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.node
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=secret
      - MYSQL_DATABASE=analytics_system
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
      - frontend

volumes:
  mysql_data:
  redis_data:
```

#### 10.1.2 PHP Dockerfile
```dockerfile
# Dockerfile.php
FROM php:8.2-fpm

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# 安裝 PHP 擴展
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# 安裝 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 設置工作目錄
WORKDIR /var/www/html

# 複製應用程式文件
COPY backend/ .

# 安裝 PHP 依賴
RUN composer install --no-dev --optimize-autoloader

# 設置權限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

#### 10.1.3 Node.js Dockerfile
```dockerfile
# Dockerfile.node
FROM node:18-alpine

WORKDIR /app

# 複製 package 文件
COPY frontend/package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY frontend/ .

# 構建應用
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

### 10.2 CI/CD 流程

#### 10.2.1 GitHub Actions 配置
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: secret
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
    - uses: actions/checkout@v3

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        extensions: mbstring, xml, ctype, iconv, intl, pdo_mysql
        coverage: xdebug

    - name: Install PHP dependencies
      run: composer install --prefer-dist --no-progress
      working-directory: ./backend

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install Node dependencies
      run: npm ci
      working-directory: ./frontend

    - name: Run PHP tests
      run: |
        cp .env.testing .env
        php artisan key:generate
        php artisan migrate
        php artisan test --coverage-clover coverage.xml
      working-directory: ./backend
      env:
        DB_HOST: 127.0.0.1
        DB_PORT: 3306
        DB_DATABASE: test_db
        DB_USERNAME: root
        DB_PASSWORD: secret

    - name: Run Frontend tests
      run: npm run test:unit
      working-directory: ./frontend

    - name: Run E2E tests
      run: |
        npm run build
        npm run test:e2e
      working-directory: ./frontend

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.PRIVATE_KEY }}
        script: |
          cd /var/www/analytics-system
          git pull origin main
          docker-compose down
          docker-compose up -d --build
          docker-compose exec -T app php artisan migrate --force
          docker-compose exec -T app php artisan config:cache
          docker-compose exec -T app php artisan route:cache
```

### 10.3 監控與日誌

#### 10.3.1 應用監控
```php
// app/Services/MonitoringService.php
class MonitoringService {
    public function logExecutionMetrics(string $flowId, float $executionTime, int $resultCount): void {
        Log::info('Filter flow executed', [
            'flow_id' => $flowId,
            'execution_time' => $executionTime,
            'result_count' => $resultCount,
            'memory_usage' => memory_get_peak_usage(true),
            'timestamp' => now()->toISOString()
        ]);

        // 發送指標到監控系統
        if ($executionTime > 30) { // 超過30秒的查詢
            $this->alertSlowQuery($flowId, $executionTime);
        }
    }

    public function logNotificationMetrics(string $notificationId, string $channel, bool $success): void {
        Log::info('Notification sent', [
            'notification_id' => $notificationId,
            'channel' => $channel,
            'success' => $success,
            'timestamp' => now()->toISOString()
        ]);
    }

    private function alertSlowQuery(string $flowId, float $executionTime): void {
        // 發送 Slack 警報或其他通知
    }
}
```

#### 10.3.2 系統健康檢查
```php
// routes/api.php
Route::get('/health', function () {
    $health = [
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'services' => []
    ];

    // 檢查數據庫連接
    try {
        DB::connection()->getPdo();
        $health['services']['database'] = 'ok';
    } catch (Exception $e) {
        $health['services']['database'] = 'error';
        $health['status'] = 'error';
    }

    // 檢查 Redis 連接
    try {
        Redis::ping();
        $health['services']['redis'] = 'ok';
    } catch (Exception $e) {
        $health['services']['redis'] = 'error';
        $health['status'] = 'error';
    }

    // 檢查磁碟空間
    $diskSpace = disk_free_space('/');
    $health['services']['disk_space'] = $diskSpace > 1000000000 ? 'ok' : 'warning'; // 1GB

    return response()->json($health, $health['status'] === 'ok' ? 200 : 503);
});
```