import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import StatCard from '@/components/StatCard'
import SectionHeader from '@/components/SectionHeader'
import VoyageSelector from '@/components/VoyageSelector'
import { formatNumber, getVoyageStatusText } from '@/utils/format'

const HomePage: React.FC = () => {
  const {
    voyages,
    currentVoyageId,
    dailyRecords,
    ships,
    getVoyageStatistics
  } = useFuelStore()

  const [showSelector, setShowSelector] = useState(false)
  const [selectorMode, setSelectorMode] = useState<'ship' | 'voyage' | 'all'>('all')
  const [refreshVersion, setRefreshVersion] = useState(0)

  useDidShow(() => {
    console.log('[HomePage] onShow, bumping refresh version')
    setRefreshVersion(v => v + 1)
  })

  const currentVoyage = useMemo(() => {
    return voyages.find(v => v.id === currentVoyageId) || voyages[0]
  }, [voyages, currentVoyageId])

  const currentShip = useMemo(() => {
    return ships.find(s => s.name === currentVoyage?.shipName) || ships[0]
  }, [ships, currentVoyage])

  const voyageDailyRecords = useMemo(() => {
    return dailyRecords.filter(d => d.voyageId === currentVoyageId)
  }, [dailyRecords, currentVoyageId])

  const voyageStats = useMemo(() => {
    return getVoyageStatistics(currentVoyageId)
  }, [getVoyageStatistics, currentVoyageId, dailyRecords.length, refreshVersion])

  const missingDates = useMemo(() => {
    if (!currentVoyage) return []
    const start = new Date(currentVoyage.departureDate)
    const today = new Date('2026-06-09')
    const filledDates = new Set(voyageDailyRecords.map(d => d.date))
    const missing: string[] = []
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!filledDates.has(dateStr) && dateStr !== today.toISOString().split('T')[0]) {
        missing.push(dateStr)
      }
    }
    return missing.slice(0, 3)
  }, [currentVoyage, voyageDailyRecords])

  const progressPercent = useMemo(() => {
    if (!currentVoyage || !voyageStats) return 40
    const totalDistance = currentVoyage.distance
    const sailedDistance = voyageStats.totalConsumption / Math.max(voyageStats.consumptionPerMile, 0.001)
    return Math.min(Math.round((sailedDistance / totalDistance) * 100), 95)
  }, [currentVoyage, voyageStats])

  const handleSelectShip = () => {
    setSelectorMode('ship')
    setShowSelector(true)
  }

  const handleSelectVoyage = () => {
    setSelectorMode('all')
    setShowSelector(true)
  }

  const handleQuickAction = (action: string) => {
    console.log('[HomePage] Quick action clicked:', action)
    const tabMap: Record<string, number> = {
      fueling: 1,
      daily: 2,
      exception: 3,
      report: 4
    }
    if (tabMap[action] !== undefined) {
      Taro.switchTab({
        url: [
          '/pages/home/index',
          '/pages/fueling/index',
          '/pages/daily/index',
          '/pages/exception/index',
          '/pages/report/index'
        ][tabMap[action]]
      }).catch(err => console.error('[HomePage] switchTab error:', err))
    }
  }

  const handleGoFillDaily = () => {
    Taro.switchTab({ url: '/pages/daily/index' })
      .catch(err => console.error('[HomePage] go fill daily error:', err))
  }

  if (!currentVoyage) {
    return (
      <View className={styles.homePage}>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView className={styles.homePage} scrollY refresherEnabled>
      <View className={styles.header}>
        <View className={styles.headerTop} onClick={handleSelectShip}>
          <View className={styles.shipInfo}>
            <View className={styles.shipAvatar}>
              <Text className={styles.shipAvatarText}>🚢</Text>
            </View>
            <View className={styles.shipDetails}>
              <Text className={styles.shipName}>{currentShip?.name || '远洋号'}</Text>
              <Text className={styles.shipCode}>{currentShip?.code || 'YY-001'} · {currentShip?.type || '散货船'}</Text>
            </View>
          </View>
          <Text className={styles.statusBadge}>{getVoyageStatusText(currentVoyage.status)}</Text>
        </View>
        <View className={styles.voyageSelector} onClick={handleSelectVoyage}>
          <View className={styles.voyageInfo}>
            <Text className={styles.voyageSegment}>
              {currentVoyage.departurePort} → {currentVoyage.arrivalPort}
            </Text>
            <Text className={styles.voyageDate}>{currentVoyage.departureDate} ~ {currentVoyage.estimatedArrivalDate}</Text>
          </View>
          <Text className={styles.selectorArrow}>▼</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.voyageCard}>
          <View className={styles.voyageRoute}>
            <View className={styles.routePort}>
              <Text className={styles.portName}>{currentVoyage.departurePort}</Text>
              <Text className={styles.portLabel}>出发港</Text>
            </View>
            <View className={styles.routeCenter}>
              <View className={styles.routeLine}>
                <View className={styles.routeLineDot} />
              </View>
              <Text className={styles.routeDistance}>{currentVoyage.distance} 海里</Text>
            </View>
            <View className={`${styles.routePort} ${styles.routePortRight}`}>
              <Text className={styles.portName}>{currentVoyage.arrivalPort}</Text>
              <Text className={styles.portLabel}>目的港</Text>
            </View>
          </View>
          <View className={styles.progressSection}>
            <View className={styles.progressLabel}>
              <Text className={styles.progressText}>航行进度</Text>
              <Text className={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View className={styles.progressBar}>
              <View className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </View>
          </View>
        </View>

        <SectionHeader title="燃油概览" />
        <View className={styles.statsGrid}>
          <StatCard
            title="累计加油"
            value={formatNumber(voyageStats?.totalFueling || 0)}
            unit="吨"
            highlight
          />
          <StatCard
            title="已消耗"
            value={formatNumber(voyageStats?.totalConsumption || 0)}
            unit="吨"
          />
          <StatCard
            title="剩余油量"
            value={formatNumber(voyageStats?.remainingFuel || 0)}
            unit="吨"
          />
          <StatCard
            title="单位里程耗油"
            value={formatNumber(voyageStats?.consumptionPerMile || 0, 3)}
            unit="吨/海里"
            trend={voyageStats?.deviationPercent && voyageStats.deviationPercent < 0 ? 'down' : 'up'}
            trendValue={voyageStats?.deviationPercent ? `${voyageStats.deviationPercent > 0 ? '+' : ''}${voyageStats.deviationPercent.toFixed(1)}%` : ''}
          />
        </View>

        {missingDates.length > 0 && (
          <View className={styles.alertCard}>
            <View className={styles.alertHeader}>
              <Text className={styles.alertIcon}>⚠️</Text>
              <Text className={styles.alertTitle}>日耗填报提醒</Text>
            </View>
            <Text className={styles.alertContent}>
              您有 {missingDates.length} 天的日耗数据未填报：{missingDates.join('、')}
            </Text>
            <Text className={styles.alertAction} onClick={handleGoFillDaily}>立即填报</Text>
          </View>
        )}

        <SectionHeader title="快捷操作" />
        <View className={styles.quickActions}>
          <View className={styles.actionGrid}>
            <View className={styles.actionItem} onClick={() => handleQuickAction('fueling')}>
              <View className={`${styles.actionIcon} ${styles.iconBlue}`}>
                <Text>⛽</Text>
              </View>
              <Text className={styles.actionText}>加油记录</Text>
            </View>
            <View className={styles.actionItem} onClick={() => handleQuickAction('daily')}>
              <View className={`${styles.actionIcon} ${styles.iconGreen}`}>
                <Text>📝</Text>
              </View>
              <Text className={styles.actionText}>日耗填报</Text>
            </View>
            <View className={styles.actionItem} onClick={() => handleQuickAction('exception')}>
              <View className={`${styles.actionIcon} ${styles.iconOrange}`}>
                <Text>❗</Text>
              </View>
              <Text className={styles.actionText}>异常说明</Text>
            </View>
            <View className={styles.actionItem} onClick={() => handleQuickAction('report')}>
              <View className={`${styles.actionIcon} ${styles.iconPurple}`}>
                <Text>📊</Text>
              </View>
              <Text className={styles.actionText}>统计报表</Text>
            </View>
          </View>
        </View>
      </View>

      <VoyageSelector
        visible={showSelector}
        onClose={() => setShowSelector(false)}
        mode={selectorMode}
      />
    </ScrollView>
  )
}

export default HomePage
