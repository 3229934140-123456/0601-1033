import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import SectionHeader from '@/components/SectionHeader'
import StatusTag from '@/components/StatusTag'
import { formatNumber, formatCurrency, getExceptionStatusText, getExceptionTypeText } from '@/utils/format'
import dayjs from 'dayjs'
import classnames from 'classnames'

const MONTH_OPTIONS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']

const ReportPage: React.FC = () => {
  const {
    dailyRecords,
    currentVoyageId,
    getVoyageStatistics,
    getMonthlyReport,
    getFuelPrediction,
    ships,
    voyages,
    fuelingRecords,
    exceptionRecords
  } = useFuelStore()

  const [refreshVersion, setRefreshVersion] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportContent, setReportContent] = useState('')
  const [selectedShip, setSelectedShip] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06')
  const [showShipPicker, setShowShipPicker] = useState(false)

  useDidShow(() => {
    setRefreshVersion(v => v + 1)
  })

  const currentVoyage = useMemo(() => {
    return voyages.find(v => v.id === currentVoyageId)
  }, [voyages, currentVoyageId])

  const currentShip = useMemo(() => {
    const fromVoyage = ships.find(s => s.name === currentVoyage?.shipName)
    if (selectedShip) {
      return ships.find(s => s.name === selectedShip) || fromVoyage || ships[0]
    }
    return fromVoyage || ships[0]
  }, [ships, currentVoyage, selectedShip])

  const voyageStats = useMemo(() => {
    return getVoyageStatistics(currentVoyageId)
  }, [getVoyageStatistics, currentVoyageId, dailyRecords.length, fuelingRecords.length, refreshVersion])

  const fuelPrediction = useMemo(() => {
    return getFuelPrediction(currentVoyageId)
  }, [getFuelPrediction, currentVoyageId, dailyRecords.length, fuelingRecords.length, refreshVersion])

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

  const currentMonthlyReport = useMemo(() => {
    return getMonthlyReport(selectedMonth, currentShip?.name || '远洋号')
  }, [getMonthlyReport, selectedMonth, currentShip, dailyRecords, fuelingRecords, exceptionRecords, refreshVersion])

  const monthExceptions = useMemo(() => {
    const shipVoyageIds = voyages.filter(v => v.shipName === currentShip?.name).map(v => v.id)
    return exceptionRecords.filter(
      r => shipVoyageIds.includes(r.voyageId) && r.date.startsWith(selectedMonth)
    ).sort((a, b) => a.date.localeCompare(b.date))
  }, [exceptionRecords, voyages, currentShip, selectedMonth])

  const riskLabel = useMemo(() => {
    if (!fuelPrediction) return { text: '暂无数据', color: 'default' }
    switch (fuelPrediction.riskLevel) {
      case 'safe': return { text: '燃油充足', color: 'success' }
      case 'warning': return { text: '油量偏低', color: 'warning' }
      case 'danger': return { text: '燃油告急', color: 'error' }
      case 'insufficient': return { text: '数据不足', color: 'primary' }
      default: return { text: '未知', color: 'default' }
    }
  }, [fuelPrediction])

  const generateReportText = (month: string, shipName: string): string => {
    const report = getMonthlyReport(month, shipName)
    const shipVoyageIds = voyages.filter(v => v.shipName === shipName).map(v => v.id)

    const monthFuelingRecords = fuelingRecords.filter(
      r => shipVoyageIds.includes(r.voyageId) && r.date.startsWith(month)
    ).sort((a, b) => a.date.localeCompare(b.date))

    const monthDailyRecords = dailyRecords.filter(
      r => shipVoyageIds.includes(r.voyageId) && r.date.startsWith(month)
    ).sort((a, b) => a.date.localeCompare(b.date))

    const monthExceptionRecords = exceptionRecords.filter(
      r => shipVoyageIds.includes(r.voyageId) && r.date.startsWith(month)
    ).sort((a, b) => a.date.localeCompare(b.date))

    const monthName = month.replace('-', '年') + '月'
    let text = `═══════════════════════════════════\n`
    text += `  ${shipName} ${monthName} 燃油统计报表\n`
    text += `  船舶编号：${currentShip?.code || '-'}\n`
    text += `  船舶类型：${currentShip?.type || '-'}\n`
    text += `  生成时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n`
    text += `═══════════════════════════════════\n\n`

    text += `【一、月度汇总】\n`
    if (report) {
      text += `  航次数：${report.voyageCount}\n`
      text += `  总航程：${formatNumber(report.totalDistance)} 海里\n`
      text += `  累计加油：${formatNumber(report.totalFueling)} 吨\n`
      text += `  总油耗：${formatNumber(report.totalConsumption)} 吨\n`
      text += `  平均单位耗油：${formatNumber(report.averageConsumptionPerMile, 3)} 吨/海里\n`
      text += `  异常记录：${report.exceptionCount} 条\n`
    } else {
      text += `  暂无数据\n`
    }
    text += `\n`

    text += `【二、航次汇总】\n`
    const monthVoyages = voyages.filter(
      v => v.shipName === shipName && (v.departureDate.startsWith(month) || v.estimatedArrivalDate.startsWith(month))
    )
    if (monthVoyages.length === 0) {
      text += `  本月无相关航次\n`
    } else {
      monthVoyages.forEach((v, i) => {
        const vFueling = fuelingRecords.filter(r => r.voyageId === v.id).reduce((s, r) => s + r.quantity, 0)
        const vDaily = dailyRecords.filter(r => r.voyageId === v.id)
        const vConsumption = vDaily.reduce((s, r) => s + r.totalConsumption, 0)
        const vDistance = vDaily.reduce((s, r) => s + r.distance, 0)
        text += `  ${i + 1}. ${v.departurePort} → ${v.arrivalPort}\n`
        text += `     出港：${v.departureDate}  预计到港：${v.estimatedArrivalDate}  总里程：${v.distance}海里\n`
        text += `     本航次加油：${formatNumber(vFueling)}吨  已消耗：${formatNumber(vConsumption)}吨  已航行：${formatNumber(vDistance)}海里\n`
      })
    }
    text += `\n`

    text += `【三、加油明细】\n`
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

    text += `【四、日耗明细】\n`
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
    text += `\n`

    text += `【五、异常记录及审核结果】\n`
    if (monthExceptionRecords.length === 0) {
      text += `  （本月无异常记录）\n`
    } else {
      monthExceptionRecords.forEach((r, i) => {
        text += `  ${i + 1}. ${r.date}  ${getExceptionTypeText(r.type)}\n`
        text += `     描述：${r.description}\n`
        text += `     原因：${r.reason}\n`
        text += `     状态：${getExceptionStatusText(r.status)}`
        if (r.reviewComment) {
          text += `\n     审核人：${r.reviewer}（${r.reviewDate}）\n`
          text += `     审核意见：${r.reviewComment}`
        }
        text += `\n`
      })
    }
    text += `\n═══════════════════════════════════\n`
    text += `  报表完成\n`
    text += `    - 加油记录：${monthFuelingRecords.length} 条\n`
    text += `    - 日耗记录：${monthDailyRecords.length} 条\n`
    text += `    - 异常记录：${monthExceptionRecords.length} 条\n`
    text += `═══════════════════════════════════\n`

    return text
  }

  const handleExport = () => {
    const content = generateReportText(selectedMonth, currentShip?.name || '远洋号')
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
    }).catch(() => {
      Taro.showToast({ title: '复制失败', icon: 'none' })
        .catch(() => {})
    })
  }

  const handleSelectShip = (shipName: string) => {
    setSelectedShip(shipName)
    setShowShipPicker(false)
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
        <SectionHeader title="燃油风险评估" />
        <View className={styles.riskCard}>
          <View className={styles.riskHeader}>
            <Text className={styles.riskLabel}>到港风险等级</Text>
            <StatusTag text={riskLabel.text} type={riskLabel.color as any} />
          </View>
          {fuelPrediction && fuelPrediction.riskLevel !== 'insufficient' ? (
            <View>
              <View className={styles.riskStats}>
                <View className={styles.riskStat}>
                  <Text className={styles.riskStatValue}>{formatNumber(fuelPrediction.remainingDistance)}</Text>
                  <Text className={styles.riskStatLabel}>剩余航程(海里)</Text>
                </View>
                <View className={styles.riskStat}>
                  <Text className={styles.riskStatValue}>{formatNumber(fuelPrediction.dailyAvgConsumption)}</Text>
                  <Text className={styles.riskStatLabel}>日均耗油(吨)</Text>
                </View>
                <View className={styles.riskStat}>
                  <Text className={styles.riskStatValue}>{formatNumber(fuelPrediction.estimatedArrivalFuel)}</Text>
                  <Text className={styles.riskStatLabel}>预计到港剩油(吨)</Text>
                </View>
              </View>
              <Text className={styles.riskTip}>
                {fuelPrediction.riskLevel === 'safe'
                  ? '燃油充足，可正常抵达目的港。'
                  : fuelPrediction.riskLevel === 'danger'
                    ? '⚠️ 燃油不足以到达目的港，请尽快安排中途加油！'
                    : '⚠️ 剩余油量偏低，建议关注耗油情况，必要时安排加油。'}
              </Text>
            </View>
          ) : (
            <Text className={styles.riskTip}>
              暂无足够数据进行风险评估，请先添加加油记录和至少2天的日耗数据。
            </Text>
          )}
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

        <View className={styles.filterBar}>
          <View className={styles.filterItem} onClick={() => setShowShipPicker(true)}>
            <Text className={styles.filterLabel}>船舶</Text>
            <Text className={styles.filterValue}>{currentShip?.name || '全部'}</Text>
            <Text className={styles.filterArrow}>▼</Text>
          </View>
          <Picker
            mode="selector"
            range={MONTH_OPTIONS}
            value={MONTH_OPTIONS.indexOf(selectedMonth)}
            onChange={(e) => setSelectedMonth(MONTH_OPTIONS[e.detail.value])}
          >
            <View className={styles.filterItem}>
              <Text className={styles.filterLabel}>月份</Text>
              <Text className={styles.filterValue}>{selectedMonth.replace('-', '年')}月</Text>
              <Text className={styles.filterArrow}>▼</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.monthlyCard}>
          <View className={styles.monthlyHeader}>
            <Text className={styles.monthlyTitle}>
              {currentShip?.name || '远洋号'} · {selectedMonth.replace('-', '年')}月
            </Text>
            <Text className={styles.exportBtn} onClick={handleExport}>导出报表</Text>
          </View>
          {currentMonthlyReport ? (
            <View>
              <View className={styles.monthlyStats}>
                <View className={styles.monthlyStat}>
                  <Text className={styles.monthlyStatValue}>{formatNumber(currentMonthlyReport.totalConsumption)}</Text>
                  <Text className={styles.monthlyStatLabel}>总油耗(吨)</Text>
                </View>
                <View className={styles.monthlyStat}>
                  <Text className={styles.monthlyStatValue}>{formatNumber(currentMonthlyReport.averageConsumptionPerMile, 3)}</Text>
                  <Text className={styles.monthlyStatLabel}>平均单耗</Text>
                </View>
                <View className={styles.monthlyStat}>
                  <Text className={styles.monthlyStatValue}>{currentMonthlyReport.voyageCount}</Text>
                  <Text className={styles.monthlyStatLabel}>航次数</Text>
                </View>
                <View className={styles.monthlyStat}>
                  <Text className={styles.monthlyStatValue}>{currentMonthlyReport.exceptionCount}</Text>
                  <Text className={styles.monthlyStatLabel}>异常数</Text>
                </View>
              </View>

              {monthExceptions.length > 0 && (
                <View className={styles.exceptionList}>
                  <Text className={styles.exceptionListTitle}>本月异常记录</Text>
                  {monthExceptions.map(r => (
                    <View key={r.id} className={styles.exceptionItem}>
                      <View className={styles.exceptionItemHeader}>
                        <Text className={styles.exceptionDate}>{r.date}</Text>
                        <StatusTag
                          text={getExceptionStatusText(r.status)}
                          type={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : r.status === 'reviewing' ? 'warning' : 'primary'}
                        />
                      </View>
                      <Text className={styles.exceptionDesc}>
                        {getExceptionTypeText(r.type)}：{r.description}
                      </Text>
                      {r.reviewComment && (
                        <View className={styles.exceptionReview}>
                          <Text className={styles.exceptionReviewer}>{r.reviewer}（{r.reviewDate}）：</Text>
                          <Text className={styles.exceptionReviewText}>{r.reviewComment}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text className={styles.noData}>暂无该船舶该月的报表数据</Text>
          )}
        </View>
      </View>

      {showShipPicker && (
        <View className={styles.modalMask} onClick={() => setShowShipPicker(false)}>
          <View className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择船舶</Text>
              <Text className={styles.modalClose} onClick={() => setShowShipPicker(false)}>关闭</Text>
            </View>
            <ScrollView scrollY className={styles.shipPickerList}>
              {ships.map(ship => (
                <View
                  key={ship.id}
                  className={classnames(styles.shipPickerItem, {
                    [styles.shipPickerItemActive]: currentShip?.id === ship.id
                  })}
                  onClick={() => handleSelectShip(ship.name)}
                >
                  <Text className={styles.shipPickerName}>{ship.name}</Text>
                  <Text className={styles.shipPickerSub}>{ship.code} · {ship.type}</Text>
                  {currentShip?.id === ship.id && <Text className={styles.shipPickerCheck}>✓</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

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
