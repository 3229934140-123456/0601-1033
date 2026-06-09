import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import SectionHeader from '@/components/SectionHeader'
import { formatNumber, formatCurrency } from '@/utils/format'
import dayjs from 'dayjs'

const ReportPage: React.FC = () => {
  const { dailyRecords, currentVoyageId, getVoyageStatistics, getMonthlyReport, ships, voyages, fuelingRecords } = useFuelStore()
  const [, forceUpdate] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportContent, setReportContent] = useState('')

  useDidShow(() => {
    forceUpdate(n => n + 1)
  })

  const voyageStats = useMemo(() => {
    return getVoyageStatistics(currentVoyageId)
  }, [getVoyageStatistics, currentVoyageId, dailyRecords.length, fuelingRecords.length, forceUpdate()])

  const currentVoyage = useMemo(() => {
    return voyages.find(v => v.id === currentVoyageId)
  }, [voyages, currentVoyageId])

  const currentShip = useMemo(() => {
    return ships.find(s => s.name === currentVoyage?.shipName)
  }, [ships, currentVoyage])

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

  const monthlyReports = useMemo(() => {
    const reports = []
    const months = ['2026-04', '2026-05', '2026-06']
    for (const month of months) {
      const report = getMonthlyReport(month, currentShip?.name || '远洋号')
      if (report) reports.push(report)
    }
    return reports
  }, [getMonthlyReport, currentShip, dailyRecords, fuelingRecords, forceUpdate()])

  const generateReportText = (month: string): string => {
    const report = getMonthlyReport(month, currentShip?.name || '远洋号')
    if (!report) return ''

    const monthDailyRecords = dailyRecords.filter(
      r => voyages.some(v => v.shipName === report.shipName && v.id === r.voyageId)
        && r.date.startsWith(month)
    ).sort((a, b) => a.date.localeCompare(b.date))

    const monthFuelingRecords = fuelingRecords.filter(
      r => voyages.some(v => v.shipName === report.shipName && v.id === r.voyageId)
        && r.date.startsWith(month)
    ).sort((a, b) => a.date.localeCompare(b.date))

    const monthName = month.replace('-', '年') + '月'
    let text = `═══════════════════════════════\n`
    text += `  ${report.shipName} ${monthName} 燃油统计报表\n`
    text += `  生成时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n`
    text += `═══════════════════════════════\n\n`
    text += `【一、月度汇总】\n`
    text += `  航次数：${report.voyageCount}\n`
    text += `  总航程：${formatNumber(report.totalDistance)} 海里\n`
    text += `  累计加油：${formatNumber(report.totalFueling)} 吨\n`
    text += `  总油耗：${formatNumber(report.totalConsumption)} 吨\n`
    text += `  平均单位耗油：${formatNumber(report.averageConsumptionPerMile, 3)} 吨/海里\n`
    text += `  异常记录：${report.exceptionCount} 条\n\n`

    text += `【二、加油明细】\n`
    if (monthFuelingRecords.length === 0) {
      text += `  （本月无加油记录）\n`
    } else {
      monthFuelingRecords.forEach((r, i) => {
        text += `  ${i + 1}. ${r.date}  ${r.fuelType}  ${formatNumber(r.quantity)}吨  ${formatCurrency(r.unitPrice)}/吨\n`
        text += `     供应港：${r.supplyPort}  金额：${formatCurrency(r.totalAmount)}\n`
        if (r.remark) text += `     备注：${r.remark}\n`
      })
    }
    text += `\n`

    text += `【三、日耗明细】\n`
    if (monthDailyRecords.length === 0) {
      text += `  （本月无日耗记录）\n`
    } else {
      text += `  日期        天气    主机(吨)  辅机(吨)  当日合计(吨)  航行(h)  等待(h)  距离(海里)\n`
      text += `  ─────────────────────────────────────────────────────────────────────────\n`
      monthDailyRecords.forEach(r => {
        const abnormalFlag = r.isAbnormal ? ' [异常]' : ''
        text += `  ${r.date}  ${r.weather.padEnd(4)}  ${formatNumber(r.mainEngineConsumption, 1).padStart(6)}  ${formatNumber(r.auxiliaryEngineConsumption, 1).padStart(6)}  ${formatNumber(r.totalConsumption, 1).padStart(8)}  ${String(r.sailingHours).padStart(5)}  ${String(r.waitingHours).padStart(5)}  ${formatNumber(r.distance, 0).padStart(6)}${abnormalFlag}\n`
      })
    }
    text += `\n═══════════════════════════════\n`
    text += `  报表完成，共 ${monthDailyRecords.length} 条日耗记录\n`
    text += `═══════════════════════════════\n`

    return text
  }

  const handleExport = (month: string) => {
    console.log('[ReportPage] Export report for month:', month)
    const content = generateReportText(month)
    setReportContent(content)
    setShowReportModal(true)
  }

  const handleCopyReport = () => {
    Taro.setClipboardData({
      data: reportContent,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
          .catch(() => {})
      }
    }).catch(err => {
      console.error('[ReportPage] Copy failed:', err)
      Taro.showToast({ title: '复制失败', icon: 'none' })
        .catch(() => {})
    })
  }

  const actualPercent = useMemo(() => {
    if (!voyageStats) return 60
    const actual = voyageStats.consumptionPerMile
    const planned = voyageStats.plannedConsumptionPerMile
    if (planned === 0) return 50
    return Math.min(Math.round((actual / (planned * 1.2)) * 100), 100)
  }, [voyageStats])

  const plannedPercent = useMemo(() => {
    if (!voyageStats) return 80
    const planned = voyageStats.plannedConsumptionPerMile
    if (planned === 0) return 80
    return Math.min(Math.round((planned / (planned * 1.2)) * 100), 100)
  }, [voyageStats])

  const totalActualPercent = useMemo(() => {
    if (!voyageStats) return 40
    const actual = voyageStats.totalConsumption
    const planned = voyageStats.totalFueling
    if (planned === 0) return 40
    return Math.min(Math.round((actual / planned) * 100), 100)
  }, [voyageStats])

  return (
    <ScrollView className={styles.reportPage} scrollY refresherEnabled>
      <View className={styles.statsOverview}>
        <Text className={styles.overviewTitle}>本航次统计概览</Text>
        <View className={styles.overviewStats}>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{formatNumber(voyageStats?.totalConsumption || 0)}</Text>
            <Text className={styles.overviewUnit}>累计油耗 (吨)</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{formatNumber(voyageStats?.consumptionPerMile || 0, 3)}</Text>
            <Text className={styles.overviewUnit}>单位里程耗油 (吨/海里)</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{formatNumber(voyageStats?.remainingFuel || 0)}</Text>
            <Text className={styles.overviewUnit}>剩余油量 (吨)</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>
              {voyageStats?.deviationPercent ? `${voyageStats.deviationPercent > 0 ? '+' : ''}${voyageStats.deviationPercent.toFixed(1)}` : '0'}%
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
                <Text className={styles.rowActual}>实际 {formatNumber(voyageStats?.consumptionPerMile || 0, 3)}</Text>
                <Text className={styles.rowPlanned}>计划 {formatNumber(voyageStats?.plannedConsumptionPerMile || 0, 3)}</Text>
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
                <Text className={styles.rowActual}>实际 {formatNumber(voyageStats?.totalConsumption || 0)}吨</Text>
                <Text className={styles.rowPlanned}>加油 {formatNumber(voyageStats?.totalFueling || 0)}吨</Text>
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

      {showReportModal && (
        <View className={styles.modalMask} onClick={() => setShowReportModal(false)}>
          <View className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>月度报表预览</Text>
              <Text className={styles.modalClose} onClick={() => setShowReportModal(false)}>关闭</Text>
            </View>
            <ScrollView scrollY className={styles.modalContent}>
              <Text className={styles.reportText}>{reportContent}</Text>
            </ScrollView>
            <View className={styles.modalActions}>
              <View className={styles.modalBtnSecondary} onClick={() => setShowReportModal(false)}>
                <Text>关闭</Text>
              </View>
              <View className={styles.modalBtnPrimary} onClick={handleCopyReport}>
                <Text>复制到剪贴板</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default ReportPage
