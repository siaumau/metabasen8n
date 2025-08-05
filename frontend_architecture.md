# 7. 前端架構設計

### 7.1 Vue 3 + Composition API 結構

#### 7.1.1 項目結構
```
src/
├── components/           # 共用組件
│   ├── ui/              # UI 基礎組件
│   ├── charts/          # 圖表組件
│   └── flow/            # Vue Flow 相關組件
├── views/               # 頁面組件
│   ├── Dashboard/       # 儀表板
│   ├── FilterFlow/      # 篩選流程
│   ├── Notifications/   # 通知管理
│   └── Goals/           # 目標管理
├── composables/         # Composition API 邏輯
├── stores/              # Pinia 狀態管理
├── services/            # API 服務
├── utils/               # 工具函數
└── types/               # TypeScript 類型定義
```

#### 7.1.2 Vue Flow 整合
```typescript
// composables/useFilterFlow.ts
import { ref, computed } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import type { Node, Edge } from '@vue-flow/core';

export function useFilterFlow() {
  const { nodes, edges, addNodes, addEdges, removeNodes, removeEdges } = useVueFlow();

  const nodeTypes = ref({
    source: 'SourceNode',
    filter: 'FilterNode',
    aggregation: 'AggregationNode',
    output: 'OutputNode'
  });

  const addFilterNode = (type: string, position: { x: number, y: number }) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: `${type} Node`,
        config: getDefaultConfig(type)
      }
    };

    addNodes([newNode]);
  };

  const executeFlow = async () => {
    const flowConfig = {
      nodes: nodes.value,
      edges: edges.value
    };

    return await filterFlowService.execute(flowConfig);
  };

  return {
    nodes,
    edges,
    nodeTypes,
    addFilterNode,
    executeFlow
  };
}
```

### 7.2 狀態管理 (Pinia)

```typescript
// stores/filterFlow.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FilterFlow, ExecutionResult } from '@/types';

export const useFilterFlowStore = defineStore('filterFlow', () => {
  const flows = ref<FilterFlow[]>([]);
  const currentFlow = ref<FilterFlow | null>(null);
  const executionResults = ref<ExecutionResult[]>([]);
  const isLoading = ref(false);

  const getFlowById = computed(() => {
    return (id: string) => flows.value.find(flow => flow.id === id);
  });

  const fetchFlows = async () => {
    isLoading.value = true;
    try {
      flows.value = await filterFlowService.getAll();
    } finally {
      isLoading.value = false;
    }
  };

  const createFlow = async (flowData: Partial<FilterFlow>) => {
    const newFlow = await filterFlowService.create(flowData);
    flows.value.push(newFlow);
    return newFlow;
  };

  const updateFlow = async (id: string, flowData: Partial<FilterFlow>) => {
    const updatedFlow = await filterFlowService.update(id, flowData);
    const index = flows.value.findIndex(flow => flow.id === id);
    if (index !== -1) {
      flows.value[index] = updatedFlow;
    }
    return updatedFlow;
  };

  return {
    flows,
    currentFlow,
    executionResults,
    isLoading,
    getFlowById,
    fetchFlows,
    createFlow,
    updateFlow
  };
});
```
