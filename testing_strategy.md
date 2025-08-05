# 9. 測試策略

### 9.1 測試金字塔

#### 9.1.1 單元測試 (70%)
```php
// tests/Unit/Domain/FilterFlow/Service/FilterFlowExecutionServiceTest.php
class FilterFlowExecutionServiceTest extends TestCase {
    private FilterFlowExecutionService $service;
    private MockObject $queryBuilderFactory;
    private MockObject $connection;
    private MockObject $cache;

    protected function setUp(): void {
        $this->queryBuilderFactory = $this->createMock(QueryBuilderFactory::class);
        $this->connection = $this->createMock(DatabaseConnection::class);
        $this->cache = $this->createMock(CacheService::class);

        $this->service = new FilterFlowExecutionService(
            $this->queryBuilderFactory,
            $this->connection,
            $this->cache
        );
    }

    public function testExecuteWithCachedResult(): void {
        $config = new FilterFlowConfig([/* ... */]);
        $expectedResult = new ExecutionResult([/* ... */]);

        $this->cache
            ->expects($this->once())
            ->method('get')
            ->willReturn($expectedResult);

        $result = $this->service->execute($config);

        $this->assertEquals($expectedResult, $result);
    }
}
```

#### 9.1.2 整合測試 (20%)
```php
// tests/Integration/Api/FilterFlowControllerTest.php
class FilterFlowControllerTest extends TestCase {
    use RefreshDatabase;

    public function testCreateFilterFlow(): void {
        $user = User::factory()->create(['role' => 'analyst']);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/filter-flows', [
                'name' => 'Test Flow',
                'description' => 'Test Description',
                'config' => [
                    'nodes' => [/* ... */],
                    'edges' => [/* ... */]
                ]
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'config',
                    'created_at'
                ]
            ]);

        $this->assertDatabaseHas('filter_flows', [
            'name' => 'Test Flow',
            'description' => 'Test Description',
            'created_by' => $user->id
        ]);
    }

    public function testExecuteFilterFlow(): void {
        $user = User::factory()->create(['role' => 'analyst']);
        $filterFlow = FilterFlow::factory()->create(['created_by' => $user->id]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/filter-flows/{$filterFlow->id}/execute");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'columns',
                    'rows',
                    'total_count',
                    'execution_time'
                ]
            ]);
    }
}
```

#### 9.1.3 端到端測試 (10%)
```typescript
// tests/e2e/filter-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Filter Flow Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new filter flow', async ({ page }) => {
    await page.goto('/filter-flows');
    await page.click('[data-testid="create-flow-button"]');

    // 填寫基本資訊
    await page.fill('[data-testid="flow-name"]', 'E2E Test Flow');
    await page.fill('[data-testid="flow-description"]', 'Created by E2E test');

    // 添加數據源節點
    await page.click('[data-testid="add-source-node"]');
    await page.selectOption('[data-testid="source-table"]', 'users');

    // 添加篩選節點
    await page.click('[data-testid="add-filter-node"]');
    await page.selectOption('[data-testid="filter-column"]', 'created_at');
    await page.selectOption('[data-testid="filter-operator"]', 'greater_than');
    await page.fill('[data-testid="filter-value"]', '2024-01-01');

    // 連接節點
    await page.dragAndDrop(
      '[data-testid="source-node-output"]',
      '[data-testid="filter-node-input"]'
    );

    // 保存流程
    await page.click('[data-testid="save-flow-button"]');

    // 驗證創建成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=E2E Test Flow')).toBeVisible();
  });

  test('should execute filter flow and display results', async ({ page }) => {
    await page.goto('/filter-flows/1');
    await page.click('[data-testid="execute-flow-button"]');

    // 等待執行完成
    await page.waitForSelector('[data-testid="execution-results"]');

    // 驗證結果顯示
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="row-count"]')).toContainText(/\d+ rows/);
  });
});
```

### 9.2 測試資料管理

#### 9.2.1 Factory 類別
```php
// database/factories/FilterFlowFactory.php
class FilterFlowFactory extends Factory {
    protected $model = FilterFlow::class;

    public function definition(): array {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'config' => [
                'nodes' => [
                    [
                        'id' => 'source-1',
                        'type' => 'source',
                        'position' => ['x' => 100, 'y' => 100],
                        'data' => [
                            'table' => 'users',
                            'columns' => ['id', 'name', 'email', 'created_at']
                        ]
                    ],
                    [
                        'id' => 'output-1',
                        'type' => 'output',
                        'position' => ['x' => 400, 'y' => 100],
                        'data' => []
                    ]
                ],
                'edges' => [
                    [
                        'id' => 'edge-1',
                        'source' => 'source-1',
                        'target' => 'output-1'
                    ]
                ]
            ],
            'created_by' => User::factory(),
            'created_at' => now(),
            'updated_at' => now()
        ];
    }

    public function withFilters(): static {
        return $this->state(function (array $attributes) {
            $config = $attributes['config'];
            $config['nodes'][] = [
                'id' => 'filter-1',
                'type' => 'filter',
                'position' => ['x' => 250, 'y' => 100],
                'data' => [
                    'column' => 'created_at',
                    'operator' => 'greater_than',
                    'value' => '2024-01-01'
                ]
            ];

            return ['config' => $config];
        });
    }
}
```
