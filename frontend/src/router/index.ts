import { createRouter, createWebHistory } from 'vue-router'
import FilterFlowView from '../views/FilterFlow/FilterFlowView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'filter-flow',
      component: FilterFlowView,
    },
  ],
})

export default router