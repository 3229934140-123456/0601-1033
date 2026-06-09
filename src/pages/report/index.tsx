import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import SectionHeader from '@/components/SectionHeader'
import { formatNumber } from '@/utils/format'

const ReportPage: React.FC = () => {
  const { voyageStatistics, dailyRecords, monthlyReports, currentVoyageId } = useFuelStore()

  const voyageDailyRecords = useMemo(() => {
    return dailyRecords
      .filter(r => r.voyageId === currentVoyageId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
  }, [dailyRecords, currentVoyageId])

  const maxDailyConsumption = useMemo(() => {
    if (voyageDailyRecords.length === 0) return 50
    return Math.max(...voyageDailyRecords.map(r => r.totalConsumption), 50)
  }, [voyageDailyRecords])

  const handleExport = (month: string) => {
    console.log('[ReportPage] Export report for month:', month)
    Taro.showToast({
      title: '报表导出中...',
      icon: 'loading',
      duration: 1500
    }).then(() => {
      setTimeout(() => {
        Taro.showToast({
          title: '导出成功',
          icon: 'success'
        }).catch(err => console.error('[ReportPage] toast error:', err))
      }, 1500)
    }).catch(err => console.error('[ReportPage] export toast error:', err))
  }

  const actualPercent = useMemo(() => {
    if (!voyageStatistics) return 60
    const actual = voyageStatistics.consumptionPerMile
    const planned = voyageStatistics.plannedConsumptionPerMile
    if (planned === 0) return 50
    return Math.min(Math.round((actual / (planned * 1.2)) * 100), 100)
  }, [voyageStatistics])

  const plannedPercent = useMemo(() => {
    if (!voyageStatistics) return 80
    const planned = voyageStatistics.plannedConsumptionPerMile
    if (planned === 0) return 80
    return Math.min(Math.round((planned / (planned * 1.2)) * 100), 100)
  }, [voyageStatistics])

  const totalActualPercent = useMemo(() => {
    if (!voyageStatistics) return 40
    const actual = voyageStatistics.totalConsumption
    const planned = voyageStatistics.totalFueling
    if (planned === 0) return 40
    return Math.min(Math.round((actual / planned) * 100), 100)
  }, [voyageStatistics])

  return (
    <ScrollView className={styles.reportPage} scrollY refresherEnabled>
      <View className={styles.statsOverview}>
        <Text className={styles.overviewTitle}>本航次统计概览</Text>
        <View className={styles.overviewStats}>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{formatNumber(voyageStatistics?.totalConsumption || 0)}</Text>
            <Text className={styles.overviewUnit}>累计油耗 (吨)</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{formatNumber(voyageStatistics?.consumptionPerMile || 0, 3)}</Text>
            <Text className={styles.overviewUnit}>单位里程耗油 (吨/海里)</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{formatNumber(voyageStatistics?.remainingFuel || 0)}</Text>
            <Text className={styles.overviewUnit}>剩余油量 (吨)</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>
              {voyageStatistics?.deviationPercent ? `${voyageStatistics.deviationPercent > 0 ? '+' : ''}${voyageStatistics.deviationPercent.toFixed(1)}` : '0'}%
            </Text>
            <Text className={styles.overviewUnit}>较计划偏差</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <SectionHeader title="计划 vs 实际对比" />
        <View className={styles.comparisonCard}>
          <View className={styles.comparisonRows}>
            <View className={styles.comparisonRow}>
              <Text className={styles.rowLabel}>单位里程耗油</Text>
              <View className={styles.rowBars}>
                <View className={styles.barContainer}>
                  <View className={`${styles.barFill} ${styles.planned}`} style={{ width: `${plannedPercent}%` }} />
                </View>
                <View className={styles.barContainer}>
                  <View className={`${styles.barFill} ${styles.actual}`} style={{ width: `${actualPercent}%` }} />
                </View>
              </View>
              <View className={styles.rowValues}>
                <Text className={styles.rowActual}>实际 {formatNumber(voyageStatistics?.consumptionPerMile || 0, 3)}</Text>
                <Text className={styles.rowPlanned}>计划 {formatNumber(voyageStatistics?.plannedConsumptionPerMile || 0, 3)}</Text>
              </View>
            </View>
            <View className={styles.comparisonRow}>
              <Text className={styles.rowLabel}>燃油消耗</Text>
              <View className={styles.rowBars}>
                <View className={styles.barContainer}>
                  <View className={`${styles.barFill} ${styles.planned}`} style={{ width: '100%' }} />
                </View>
                <View className={styles.barContainer}>
                  <View className={`${styles.barFill} ${styles.actual}`} style={{ width: `${totalActualPercent}%` }} />
                </View>
              </View>
              <View className={styles.rowValues}>
                <Text className={styles.rowActual}>实际 {formatNumber(voyageStatistics?.totalConsumption || 0)}吨</Text>
                <Text className={styles.rowPlanned}>加油 {formatNumber(voyageStatistics?.totalFueling || 0)}吨</Text>
              </View>
            </View>
          </View>
          <View className={styles.legend}>
            <View className={styles.legendItem}>
              <View className={`${styles.legendBar} ${styles.actual}`} />
              <Text>实际值</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={`${styles.legendBar} ${styles.planned}`} />
              <Text>计划/基准值</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <SectionHeader title="近7日日耗趋势" />
        <View className={styles.dailyTrendCard}>
          <View className={styles.trendChart}>
            <View className={styles.trendBars}>
              {voyageDailyRecords.length === 0 ? (
                <Text style={{ color: '#86909C', fontSize: '24rpx', width: '100%', textAlign: 'center' }}>暂无数据</Text>
              ) : (
                voyageDailyRecords.map(record => {
                  const heightPercent = Math.round((record.totalConsumption / maxDailyConsumption) * 100)
                  const dayLabel = record.date.split('-')[2]
                  return (
                    <View key={record.id} className={styles.trendBarItem}>
                      <Text className={styles.trendBarValue}>{formatNumber(record.totalConsumption, 1)}</Text>
                      <View
                        className={`${styles.trendBar} ${record.isAbnormal ? styles.abnormal : ''}`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <Text className={styles.trendBarLabel}>{dayLabel}日</Text>
                    </View>
                  )
                })
              )}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <SectionHeader title="月度报表" />
        <View className={styles.monthlyReports}>
          {monthlyReports.map(report => (
            <View key={report.month} className={styles.monthlyCard}>
              <View className={styles.monthlyHeader}>
                <Text className={styles.monthlyTitle}>{report.month.replace('-', '年')}月</Text>
                <Text className={styles.exportBtn} onClick={() => handleExport(report.month)}>导出报表</Text>
              </View>
              <View className={styles.monthlyStats}>
                <View className={styles.monthlyStat}>
                  <Text className={styles.monthlyStatValue}>{formatNumber(report.totalConsumption)}</Text>
                  <Text className={styles.monthlyStatLabel}>总油耗(吨)</Text>
                </View>
                <View className={styles.monthlyStat}>
                  <Text className={styles.monthlyStatValue}>{formatNumber(report.averageConsumptionPerMile, 3)}</Text>
                  <Text className={styles.monthlyStatLabel}>平均单耗</Text>
                </View>
                <View className={styles.monthlyStat}>
                  <Text className={styles.monthlyStatValue}>{report.voyageCount}</Text>
                  <Text className={styles.monthlyStatLabel}>航次数</Text>
                </View>
                <View className={styles.monthlyStat}>
                  <Text className={styles.monthlyStatValue}>{report.exceptionCount}</Text>
                  <Text className={styles.monthlyStatLabel}>异常数</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

export default ReportPage
