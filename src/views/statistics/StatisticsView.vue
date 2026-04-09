<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getStatisticsData } from '@/api/statistics'
import type { StatisticsData } from '@/types'
import * as echarts from 'echarts'

const loading = ref(false)
const data = ref<StatisticsData | null>(null)
const activePeriod = ref('7d')
const growthChartRef = ref<HTMLDivElement>()
const activityChartRef = ref<HTMLDivElement>()
let growthChart: echarts.ECharts | null = null
let activityChart: echarts.ECharts | null = null

const periods = [
  { key: 'today', label: '今天' },
  { key: '7d', label: '最近7天' },
  { key: '30d', label: '最近30天' },
  { key: 'custom', label: '自定义' },
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
  growthChart?.dispose()
  activityChart?.dispose()
})

function renderCharts() {
  if (!data.value) return

  // 用户增长趋势
  if (growthChartRef.value) {
    growthChart = echarts.init(growthChartRef.value)
    growthChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增投资人', '新增融资用户'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.value.userGrowthTrend.map(d => d.date.substring(5)),
        axisLabel: { fontSize: 11, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          name: '新增投资人',
          type: 'line',
          smooth: true,
          data: data.value.userGrowthTrend.map(d => d.value),
          lineStyle: { color: '#3b82f6', width: 2 },
          itemStyle: { color: '#3b82f6' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59,130,246,0.15)' },
            { offset: 1, color: 'rgba(59,130,246,0)' },
          ]) },
        },
        {
          name: '新增融资用户',
          type: 'line',
          smooth: true,
          data: data.value.userGrowthTrend.map(d => d.value2 || 0),
          lineStyle: { color: '#ec4899', width: 2 },
          itemStyle: { color: '#ec4899' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(236,72,153,0.15)' },
            { offset: 1, color: 'rgba(236,72,153,0)' },
          ]) },
        },
      ],
    })
  }

  // 平台活跃度
  if (activityChartRef.value) {
    activityChart = echarts.init(activityChartRef.value)
    activityChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['日活跃用户', '功能使用次数'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.value.platformActivity.map(d => d.date.substring(5)),
        axisLabel: { fontSize: 11, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          name: '日活跃用户',
          type: 'line',
          smooth: true,
          data: data.value.platformActivity.map(d => d.value),
          lineStyle: { color: '#667eea', width: 2 },
          itemStyle: { color: '#667eea' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102,126,234,0.15)' },
            { offset: 1, color: 'rgba(102,126,234,0)' },
          ]) },
        },
        {
          name: '功能使用次数',
          type: 'line',
          smooth: true,
          data: data.value.platformActivity.map(d => d.value2 || 0),
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16,185,129,0.15)' },
            { offset: 1, color: 'rgba(16,185,129,0)' },
          ]) },
        },
      ],
    })
  }
}

function handlePeriodChange(key: string) {
  activePeriod.value = key
  loadData()
}

function formatTrend(trend: number) {
  const isUp = trend >= 0
  return {
    text: `${isUp ? '↑' : '↓'} ${Math.abs(trend)}%`,
    class: isUp ? 'trend-up' : 'trend-down',
  }
}
</script>

<template>
  <div class="statistics-page" v-loading="loading">
    <div class="page-header">
      <div>
        <h1>数据统计</h1>
        <p class="page-subtitle">查看平台运营数据和用户活跃度统计</p>
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

    <el-alert v-if="apiError" title="统计数据接口暂未开放" description="后端统计接口 (/admin/statistics) 尚未实现，该功能将在后端接口就绪后自动生效。" type="info" show-icon :closable="false" style="margin-bottom: 24px" />

    <!-- 用户统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">总用户数</div>
        <div class="stat-value">{{ data?.totalUsers ?? 0 }}</div>
        <div class="stat-trend" :class="formatTrend(data?.totalUsersTrend ?? 0).class">
          {{ formatTrend(data?.totalUsersTrend ?? 0).text }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">活跃用户</div>
        <div class="stat-value">{{ data?.activeUsers ?? 0 }}</div>
        <div class="stat-trend" :class="formatTrend(data?.activeUsersTrend ?? 0).class">
          {{ formatTrend(data?.activeUsersTrend ?? 0).text }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">新增用户</div>
        <div class="stat-value">{{ data?.newUsers ?? 0 }}</div>
        <div class="stat-trend" :class="formatTrend(data?.newUsersTrend ?? 0).class">
          {{ formatTrend(data?.newUsersTrend ?? 0).text }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">实名认证率</div>
        <div class="stat-value">{{ data?.verifyRate ?? 0 }}%</div>
        <div class="stat-trend" :class="formatTrend(data?.verifyRateTrend ?? 0).class">
          {{ formatTrend(data?.verifyRateTrend ?? 0).text }}
        </div>
      </div>
    </div>

    <!-- 业务统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Teaser数量</div>
        <div class="stat-value">{{ data?.teaserCount ?? 0 }}</div>
        <div class="stat-trend" :class="formatTrend(data?.teaserTrend ?? 0).class">
          {{ formatTrend(data?.teaserTrend ?? 0).text }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">BP申请数</div>
        <div class="stat-value">{{ data?.bpRequestCount ?? 0 }}</div>
        <div class="stat-trend" :class="formatTrend(data?.bpRequestTrend ?? 0).class">
          {{ formatTrend(data?.bpRequestTrend ?? 0).text }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">问答互动</div>
        <div class="stat-value">{{ data?.qaCount ?? 0 }}</div>
        <div class="stat-trend" :class="formatTrend(data?.qaTrend ?? 0).class">
          {{ formatTrend(data?.qaTrend ?? 0).text }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">联系申请</div>
        <div class="stat-value">{{ data?.contactRequestCount ?? 0 }}</div>
        <div class="stat-trend" :class="formatTrend(data?.contactTrend ?? 0).class">
          {{ formatTrend(data?.contactTrend ?? 0).text }}
        </div>
      </div>
    </div>

    <!-- 图表和数据网格 -->
    <div class="data-grid">
      <!-- 用户增长趋势 -->
      <div class="chart-card">
        <div class="card-title">用户增长趋势</div>
        <div ref="growthChartRef" class="chart-container"></div>
      </div>

      <!-- 功能使用统计 -->
      <div class="info-card">
        <div class="card-title">功能使用统计</div>
        <div class="usage-list">
          <div v-for="item in data?.featureUsage ?? []" :key="item.name" class="usage-item">
            <span class="usage-name">{{ item.name }}</span>
            <span class="usage-value">{{ item.value.toLocaleString() }}</span>
            <span class="usage-trend" :class="formatTrend(item.trend).class">
              {{ formatTrend(item.trend).text }}
            </span>
          </div>
        </div>

        <div class="card-title" style="margin-top: 24px">用户类型分布</div>
        <div class="distribution-list">
          <div v-for="item in data?.userTypeDistribution ?? []" :key="item.type" class="dist-item">
            <div class="dist-header">
              <span class="dist-type">{{ item.type }}</span>
              <span class="dist-count">{{ item.count }} ({{ item.percentage }}%)</span>
            </div>
            <el-progress :percentage="item.percentage" :show-text="false" :stroke-width="8" />
          </div>
        </div>
      </div>

      <!-- 平台活跃度 -->
      <div class="chart-card">
        <div class="card-title">平台活跃度</div>
        <div ref="activityChartRef" class="chart-container"></div>
      </div>

      <!-- 审核效率 -->
      <div class="info-card">
        <div class="card-title">审核处理效率</div>
        <div class="efficiency-list">
          <div class="eff-item">
            <span class="eff-label">平均审核时长</span>
            <span class="eff-value">{{ data?.avgReviewTime ?? 0 }}小时</span>
            <span class="eff-trend" :class="formatTrend(data?.avgReviewTimeTrend ?? 0).class">
              {{ formatTrend(data?.avgReviewTimeTrend ?? 0).text }}
            </span>
          </div>
          <div class="eff-item">
            <span class="eff-label">实名认证通过率</span>
            <span class="eff-value">{{ data?.reviewPassRate ?? 0 }}%</span>
            <span class="eff-trend" :class="formatTrend(data?.reviewPassRateTrend ?? 0).class">
              {{ formatTrend(data?.reviewPassRateTrend ?? 0).text }}
            </span>
          </div>
          <div class="eff-item">
            <span class="eff-label">待审核数量</span>
            <span class="eff-value">{{ data?.pendingCount ?? 0 }}</span>
            <span class="eff-status">正常</span>
          </div>
          <div class="eff-item">
            <span class="eff-label">今日已处理</span>
            <span class="eff-value">{{ data?.todayProcessed ?? 0 }}</span>
            <span class="eff-trend" :class="formatTrend(data?.todayProcessedTrend ?? 0).class">
              {{ formatTrend(data?.todayProcessedTrend ?? 0).text }}
            </span>
          </div>
        </div>
      </div>
    </div>
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

.stat-trend {
  font-size: 13px;
  font-weight: 500;
}

.trend-up {
  color: #10b981;
}

.trend-down {
  color: #ef4444;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.chart-card, .info-card {
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

.usage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.usage-name {
  font-size: 14px;
  color: #475569;
}

.usage-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.usage-trend {
  font-size: 13px;
  font-weight: 500;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dist-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.dist-type {
  font-size: 14px;
  color: #475569;
}

.dist-count {
  font-size: 13px;
  color: #64748b;
}

.efficiency-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.eff-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.eff-label {
  font-size: 14px;
  color: #64748b;
  width: 120px;
}

.eff-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.eff-trend {
  font-size: 13px;
  font-weight: 500;
}

.eff-status {
  font-size: 13px;
  color: #10b981;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
