<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getStatisticsData } from '@/api/statistics'
import type { StatisticsData } from '@/types'
import * as echarts from 'echarts'

const loading = ref(false)
const data = ref<StatisticsData | null>(null)
const activePeriod = ref('7d')
const userTrendChartRef = ref<HTMLDivElement>()
const projectTrendChartRef = ref<HTMLDivElement>()
const viewTrendChartRef = ref<HTMLDivElement>()
const industryChartRef = ref<HTMLDivElement>()
let charts: echarts.ECharts[] = []

const periods = [
  { key: 'today', label: '今天' },
  { key: '7d', label: '最近7天' },
  { key: '30d', label: '最近30天' },
]

const apiError = ref(false)

async function loadData() {
  loading.value = true
  apiError.value = false
  try {
    const { data: res } = await getStatisticsData({ period: activePeriod.value })
    data.value = res.data
    await nextTick()
    renderCharts()
  } catch {
    apiError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

onBeforeUnmount(() => {
  charts.forEach(c => c.dispose())
  charts = []
})

function renderCharts() {
  charts.forEach(c => c.dispose())
  charts = []
  if (!data.value) return

  // 用户增长趋势
  if (userTrendChartRef.value) {
    const chart = echarts.init(userTrendChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.value.userTrend.map(d => d.date.substring(5)),
        axisLabel: { fontSize: 11, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [{
        name: '新增用户',
        type: 'line',
        smooth: true,
        data: data.value.userTrend.map(d => d.value),
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59,130,246,0.15)' },
          { offset: 1, color: 'rgba(59,130,246,0)' },
        ]) },
      }],
    })
    charts.push(chart)
  }

  // 项目增长趋势
  if (projectTrendChartRef.value) {
    const chart = echarts.init(projectTrendChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.value.projectTrend.map(d => d.date.substring(5)),
        axisLabel: { fontSize: 11, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [{
        name: '新增项目',
        type: 'bar',
        data: data.value.projectTrend.map(d => d.value),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      }],
    })
    charts.push(chart)
  }

  // 浏览量趋势
  if (viewTrendChartRef.value) {
    const chart = echarts.init(viewTrendChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.value.viewTrend.map(d => d.date.substring(5)),
        axisLabel: { fontSize: 11, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [{
        name: '浏览量',
        type: 'line',
        smooth: true,
        data: data.value.viewTrend.map(d => d.value),
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245,158,11,0.15)' },
          { offset: 1, color: 'rgba(245,158,11,0)' },
        ]) },
      }],
    })
    charts.push(chart)
  }

  // 行业分布饼图
  if (industryChartRef.value && data.value.industryDistribution.length > 0) {
    const chart = echarts.init(industryChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data.value.industryDistribution.map(d => ({ name: d.name, value: d.value })),
        label: { fontSize: 13 },
        itemStyle: { borderRadius: 6 },
      }],
    })
    charts.push(chart)
  }
}

function handlePeriodChange(key: string) {
  activePeriod.value = key
  loadData()
}
</script>

<template>
  <div class="statistics-page" v-loading="loading">
    <div class="page-header">
      <div>
        <h1>数据统计</h1>
        <p class="page-subtitle">查看平台运营数据和趋势统计</p>
      </div>
      <div class="period-buttons">
        <el-button
          v-for="p in periods"
          :key="p.key"
          :type="activePeriod === p.key ? 'primary' : 'default'"
          size="small"
          @click="handlePeriodChange(p.key)"
        >
          {{ p.label }}
        </el-button>
      </div>
    </div>

    <el-alert v-if="apiError" title="统计数据加载失败" type="error" show-icon :closable="false" style="margin-bottom: 24px" />

    <template v-if="data">
      <!-- 总览卡片 -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">总用户数</div>
          <div class="stat-value">{{ data.overview.totalUsers }}</div>
          <div class="stat-sub">本周新增 {{ data.overview.newUsersThisWeek }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总项目数</div>
          <div class="stat-value">{{ data.overview.totalProjects }}</div>
          <div class="stat-sub">今日新增 {{ data.overview.newProjectsToday }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Teaser数量</div>
          <div class="stat-value">{{ data.overview.totalTeasers }}</div>
          <div class="stat-sub">已发布 {{ data.overview.publishedTeasers }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总浏览量</div>
          <div class="stat-value">{{ data.overview.totalViews }}</div>
          <div class="stat-sub">收藏 {{ data.overview.totalFavorites }}</div>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">今日新增用户</div>
          <div class="stat-value">{{ data.overview.newUsersToday }}</div>
          <div class="stat-sub">本月 {{ data.overview.newUsersThisMonth }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总申请数</div>
          <div class="stat-value">{{ data.overview.totalApplications }}</div>
          <div class="stat-sub">待处理 {{ data.overview.pendingApplications }}</div>
        </div>
        <div class="stat-card" v-for="item in data.stageDistribution" :key="item.name">
          <div class="stat-label">{{ item.name }}</div>
          <div class="stat-value">{{ item.value }}</div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="chart-grid">
        <div class="chart-card">
          <div class="card-title">用户增长趋势</div>
          <div ref="userTrendChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <div class="card-title">项目增长趋势</div>
          <div ref="projectTrendChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <div class="card-title">浏览量趋势</div>
          <div ref="viewTrendChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <div class="card-title">行业分布</div>
          <div ref="industryChartRef" class="chart-container"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.statistics-page {
  padding: 32px 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 22px;
  color: #1e293b;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
}

.period-buttons {
  display: flex;
  gap: 8px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #94a3b8;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.chart-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.chart-container {
  height: 280px;
}
</style>
