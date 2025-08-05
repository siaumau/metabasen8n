<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ref, watch, computed } from 'vue'
import type { ColumnInfo } from '../../services/mockDataService'

const props = defineProps({
  id: String,
  data: Object,
})

const emit = defineEmits(['update:data'])

const selectedColumn = ref(props.data?.column || '')
const selectedOperator = ref(props.data?.operator || 'equals')
const filterValue = ref(props.data?.value || '')

const availableColumns = computed<ColumnInfo[]>(() => {
  return props.data?.columns || []
})

const operators = [
  { value: 'equals', label: '等於' },
  { value: 'contains', label: '包含' },
  { value: 'greater_than', label: '大於' },
  { value: 'less_than', label: '小於' },
]

watch([selectedColumn, selectedOperator, filterValue], () => {
  emit('update:data', {
    ...props.data,
    column: selectedColumn.value,
    operator: selectedOperator.value,
    value: filterValue.value,
  })
})
</script>

<template>
  <div class="p-4 border border-gray-200 rounded-xl shadow-md bg-white w-72 hover:shadow-lg transition-shadow">
    <div class="flex items-center space-x-3 mb-4">
       <div class="p-2 bg-teal-100 rounded-full">
        <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z"></path></svg>
      </div>
      <div class="font-bold text-lg text-gray-800">篩選器</div>
    </div>
    <div class="space-y-3">
      <div>
        <label for="column-select" class="block text-sm font-medium text-gray-700">欄位：</label>
        <select
          id="column-select"
          v-model="selectedColumn"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>-- 請選擇欄位 --</option>
          <option v-for="col in availableColumns" :key="col.name" :value="col.name">{{ col.name }}</option>
        </select>
      </div>
      <div>
        <label for="operator-select" class="block text-sm font-medium text-gray-700">條件：</label>
        <select
          id="operator-select"
          v-model="selectedOperator"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option v-for="op in operators" :key="op.value" :value="op.value">{{ op.label }}</option>
        </select>
      </div>
      <div>
        <label for="filter-value" class="block text-sm font-medium text-gray-700">數值：</label>
        <input
          type="text"
          id="filter-value"
          v-model="filterValue"
          class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>
    </div>
    <Handle type="target" :position="Position.Left" class="!bg-teal-500" />
    <Handle type="source" :position="Position.Right" class="!bg-teal-500" />
  </div>
</template>
