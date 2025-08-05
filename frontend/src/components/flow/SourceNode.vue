<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ref, watch } from 'vue'
import { getTables } from '../../services/mockDataService'
import type { TableInfo } from '../../services/mockDataService'

const props = defineProps({
  id: String,
  data: Object,
})

const emit = defineEmits(['update:data'])

const selectedTable = ref(props.data?.table || '')
const tables = ref<TableInfo[]>([])

getTables().then((t) => {
  tables.value = t
})

watch(selectedTable, (newVal) => {
  emit('update:data', {
    ...props.data,
    table: newVal,
    columns: tables.value.find(t => t.name === newVal)?.columns || [],
  })
})
</script>

<template>
  <div class="p-4 border border-gray-200 rounded-xl shadow-md bg-white w-64 hover:shadow-lg transition-shadow">
    <div class="flex items-center space-x-3 mb-4">
      <div class="p-2 bg-indigo-100 rounded-full">
        <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10m16-10v10M4 12h16"></path></svg>
      </div>
      <div class="font-bold text-lg text-gray-800">資料來源</div>
    </div>
    <div>
      <label for="table-select" class="block text-sm font-medium text-gray-700 mb-1">選擇資料表：</label>
      <select
        id="table-select"
        v-model="selectedTable"
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="" disabled>-- 請選擇一個資料表 --</option>
        <template v-for="table in tables" :key="table.name">
          <option :value="table.name">{{ table.name }}</option>
        </template>
      </select>
    </div>
    <Handle type="source" :position="Position.Right" class="!bg-indigo-500" />
  </div>
</template>
