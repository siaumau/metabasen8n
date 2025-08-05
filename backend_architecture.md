# 8. 後端架構設計

### 8.1 Domain-Driven Design (DDD) 結構

```
app/
├── Domain/              # 領域層
│   ├── FilterFlow/
│   │   ├── Entity/      # 實體
│   │   ├── Repository/  # 倉庫介面
│   │   ├── Service/     # 領域服務
│   │   └── ValueObject/ # 值對象
│   ├── Notification/
│   └── Goal/
├── Infrastructure/      # 基礎設施層
│   ├── Database/        # 數據庫實現
│   ├── Http/           # HTTP 相關
│   ├── Notification/   # 通知服務實現
│   └── Cache/          # 快取實現
├── Application/         # 應用層
│   ├── Services/       # 應用服務
│   ├── Commands/       # 命令
│   ├── Queries/        # 查詢
│   └── Handlers/       # 處理器
└── Interfaces/          # 介面層
    ├── Http/           # HTTP 控制器
    ├── Console/        # 命令行
    └── Jobs/           # 後台任務
```

### 8.2 核心服務實現

#### 8.2.1 篩選流程服務
```php
namespace App\Domain\FilterFlow\Service;

class FilterFlowExecutionService {
    public function __construct(
        private QueryBuilderFactory $queryBuilderFactory,
        private DatabaseConnection $connection,
        private CacheService $cache
    ) {}

    public function execute(FilterFlowConfig $config): ExecutionResult {
        $cacheKey = $this->generateCacheKey($config);

        if ($cachedResult = $this->cache->get($cacheKey)) {
            return $cachedResult;
        }

        $queryBuilder = $this->queryBuilderFactory->create();
        $query = $this->buildQuery($config, $queryBuilder);

        $result = $this->connection->query($query);
        $executionResult = new ExecutionResult($result);

        $this->cache->put($cacheKey, $executionResult, 300); // 5分鐘快取

        return $executionResult;
    }

    private function buildQuery(FilterFlowConfig $config, QueryBuilder $builder): string {
        $sourceNode = $config->getSourceNode();
        $builder->from($sourceNode->getTable());

        foreach ($config->getFilterNodes() as $filterNode) {
            $this->applyFilter($builder, $filterNode);
        }

        foreach ($config->getAggregationNodes() as $aggNode) {
            $this->applyAggregation($builder, $aggNode);
        }

        return $builder->toSql();
    }
}
```

#### 8.2.2 通知服務
```php
namespace App\Domain\Notification\Service;

class NotificationService {
    public function __construct(
        private NotificationChannelFactory $channelFactory,
        private TrackingService $trackingService,
        private TemplateEngine $templateEngine
    ) {}

    public function send(NotificationRequest $request): NotificationResult {
        $channel = $this->channelFactory->create($request->getType());
        $template = $this->templateEngine->render($request->getTemplate(), $request->getData());

        $trackingToken = $this->trackingService->createToken(
            $request->getId(),
            $request->getRecipient()
        );

        // 在內容中嵌入追蹤碼
        $content = $this->injectTrackingCode($template, $trackingToken);

        $result = $channel->send($request->getRecipient(), $content);

        $this->trackingService->recordSent($request->getId(), $result);

        return $result;
    }

    private function injectTrackingCode(string $content, string $token): string {
        if (strpos($content, '<html>') !== false) {
            // HTML 郵件，添加追蹤像素
            $trackingPixel = sprintf(
                '<img src="%s/api/v1/tracking/%s/open" width="1" height="1" style="display:none;">',
                config('app.url'),
                $token
            );

            return str_replace('</body>', $trackingPixel . '</body>', $content);
        }

        return $content;
    }
}
```
