<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { Node, Connection } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import SourceNode from '../../components/flow/SourceNode.vue'
import FilterNode from '../../components/flow/FilterNode.vue'
import { getTableData } from '../../services/mockDataService'
import type { DataRow, ColumnInfo } from '../../services/mockDataService'

interface NodeData {
  table: string
  columns: ColumnInfo[]
  column: string
  operator: string
  value: string
}

const { onPaneReady, onConnect, addEdges } = useVueFlow()

const nodes = ref<Node<Partial<NodeData>>[]>([
  {
    id: '1',
    type: 'source',
    label: '資料來源',
    position: { x: 20, y: 100 },
    data: { table: '', columns: [] },
  },
  {
    id: '2',
    type: 'filter',
    label: '篩選器',
    position: { x: 320, y: 100 },
    data: { column: '', operator: '', value: '', columns: [] },
  },
  {
    id: '3',
    type: 'output',
    label: '結果輸出',
    position: { x: 620, y: 100 },
    data: {},
  },
])

const edges = ref([
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
])

const isLoading = ref(false)
const filteredData = ref<DataRow[]>([])

const handleNodeDataUpdate = ({ id, data }: { id: string; data: Partial<NodeData> }) => {
  const node = nodes.value.find((n) => n.id === id)
  if (node) {
    node.data = { ...node.data, ...data }
  }
}

onConnect((params: Connection) => {
  addEdges(params)
})

const hasFilter = computed(() => {
  const filterNode = nodes.value.find(n => n.type === 'filter')
  return filterNode && filterNode.data?.column && filterNode.data?.operator
})

async function applyFilter() {
  isLoading.value = true
  const sourceNode = nodes.value.find(n => n.type === 'source')

  if (!sourceNode || !sourceNode.data?.table) {
    filteredData.value = []
    isLoading.value = false
    return
  }

  // Propagate columns from source to filter
  if (sourceNode.data.columns) {
    const connectedEdge = edges.value.find(e => e.source === sourceNode.id);
    if (connectedEdge) {
      const targetNode = nodes.value.find(n => n.id === connectedEdge.target);
      if (targetNode && targetNode.type === 'filter' && targetNode.data) {
        targetNode.data.columns = sourceNode.data.columns;
      }
    }
  }

  const data = await getTableData(sourceNode.data.table)

  if (hasFilter.value) {
    const filterNode = nodes.value.find(n => n.type === 'filter')!
    const { column, operator, value } = filterNode.data
    filteredData.value = data.filter((row: DataRow) => {
      const cellValue = row[column!]
      switch (operator) {
        case 'equals':
          return String(cellValue) === String(value)
        case 'contains':
          return String(cellValue).includes(String(value))
        case 'greater_than':
          return Number(cellValue) > Number(value)
        case 'less_than':
          return Number(cellValue) < Number(value)
        default:
          return true
      }
    })
  } else {
    filteredData.value = data
  }
  isLoading.value = false
}

watch(nodes, applyFilter, { deep: true })
watch(edges, applyFilter, { deep: true })

onPaneReady(applyFilter)

</script>

<template>
  <div class="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 overflow-hidden">
    <header class="flex-shrink-0 bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div class="w-full py-4 px-6 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur opacity-75"></div>
            <svg class="relative h-12 w-12 text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">視覺化數據篩選工具</h1>
            <p class="text-slate-300 mt-1">拖拉節點建立數據流程，即時篩選與分析</p>
          </div>
        </div>
        <button
          @click="applyFilter"
          class="group relative inline-flex items-center px-8 py-4 text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 border border-white/10"
        >
          <svg class="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          執行篩選
        </button>
      </div>
    </header>

    <main class="flex-1 flex overflow-hidden">
      <div class="flex-1 grid grid-cols-4 gap-1 h-full">
        <div class="col-span-3 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
          <div class="h-full bg-gradient-to-br from-slate-900/50 to-slate-800/50">
            <VueFlow v-model:nodes="nodes" v-model:edges="edges" fit-view-on-init class="h-full">
              <template #node-source="{ data, id }">
                <SourceNode :id="id" :data="data" @update:data="handleNodeDataUpdate({ id, data: $event })" />
              </template>
              <template #node-filter="{ data, id }">
                <FilterNode :id="id" :data="data" @update:data="handleNodeDataUpdate({ id, data: $event })" />
              </template>
              <template #node-output="{ label }">
                <div class="relative p-6 border-2 border-dashed border-cyan-400/50 rounded-2xl bg-gradient-to-br from-cyan-900/30 to-blue-900/30 w-56 text-center shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl"></div>
                  <div class="relative">
                    <svg class="w-8 h-8 mx-auto mb-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div class="font-bold text-lg text-cyan-300">{{ label }}</div>
                  </div>
                </div>
              </template>
              <Background pattern="dots" :gap="25" :strength="0.3" class="opacity-20" />
            </VueFlow>
          </div>
        </div>

        <div class="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 overflow-hidden flex flex-col">
          <div class="flex-shrink-0 p-4 border-b border-slate-700/50 bg-slate-900/30">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <svg class="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span class="font-semibold text-slate-200">篩選結果</span>
              </div>
              <div class="text-sm text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full border border-slate-600/50">
                {{ filteredData.length }} 筆資料
              </div>
            </div>
          </div>
          <div class="flex-1 p-4 overflow-auto">
            <div v-if="isLoading" class="flex flex-col items-center justify-center h-full space-y-4">
              <div class="relative">
                <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin"></div>
                <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animate-reverse" style="animation-duration: 1.5s;"></div>
              </div>
              <div class="text-slate-200 font-medium">載入中...</div>
              <div class="text-sm text-slate-400">正在處理數據篩選</div>
            </div>
            <div v-else-if="filteredData.length > 0" class="space-y-4 h-full">
              <div class="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl p-4 border border-cyan-700/30">
                <div class="text-sm text-cyan-300 font-medium mb-2">篩選統計</div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div class="text-slate-300">資料筆數: <span class="font-semibold text-cyan-400">{{ filteredData.length }}</span></div>
                  <div class="text-slate-300">欄位數量: <span class="font-semibold text-cyan-400">{{ filteredData.length > 0 ? Object.keys(filteredData[0]).length : 0 }}</span></div>
                </div>
              </div>
              <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden flex-1">
                <div class="overflow-auto h-full">
                  <table class="min-w-full">
                    <thead class="bg-slate-900/50 sticky top-0">
                      <tr>
                        <th v-for="key in Object.keys(filteredData[0])" :key="key" class="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700/50">
                          {{ key }}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/30">
                      <tr v-for="(row, index) in filteredData" :key="index" class="hover:bg-slate-700/30 transition-colors duration-150">
                        <td v-for="key in Object.keys(row)" :key="key" class="px-4 py-3 whitespace-nowrap text-sm">
                          <span class="inline-block px-2 py-1 bg-slate-700/50 rounded-md text-slate-200 font-medium border border-slate-600/30">{{ row[key] }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center h-full space-y-6">
              <div class="relative">
                <div class="w-24 h-24 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <div class="text-center space-y-2">
                <p class="font-semibold text-slate-200 text-lg">沒有資料</p>
                <p class="text-sm text-slate-400 max-w-xs">請選擇資料來源或調整篩選條件以查看結果</p>
              </div>
              <div class="flex space-x-2">
                <div class="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                <div class="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.vue-flow__node-output {
  border-color: #10b981;
  color: #10b981;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.5), 0 0 40px rgba(147, 51, 234, 0.3); }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-reverse {
  animation-direction: reverse;
}

.hover\:shadow-3xl:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.backdrop-blur-md {
  backdrop-filter: blur(12px);
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

.vue-flow__background {
  opacity: 0.2;
}

.vue-flow__edge-path {
  stroke: #06b6d4;
  stroke-width: 2;
  filter: drop-shadow(0 2px 4px rgba(6, 182, 212, 0.3));
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #0ea5e9;
  stroke-width: 3;
  filter: drop-shadow(0 4px 8px rgba(14, 165, 233, 0.4));
}

.vue-flow__node {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
  transition: all 0.2s ease;
}

.vue-flow__node:hover {
  filter: drop-shadow(0 8px 15px rgba(0, 0, 0, 0.4));
  transform: translateY(-2px);
}

.vue-flow__node.selected {
  filter: drop-shadow(0 10px 25px rgba(6, 182, 212, 0.4));
}

.vue-flow__pane {
  background: transparent;
}

.vue-flow__controls {
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.vue-flow__controls button {
  background: rgba(71, 85, 105, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #e2e8f0;
}

.vue-flow__controls button:hover {
  background: rgba(6, 182, 212, 0.6);
  border-color: rgba(6, 182, 212, 0.5);
  color: white;
}
</style>