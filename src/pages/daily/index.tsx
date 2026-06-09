import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import EmptyState from '@/components/EmptyState'
import SectionHeader from '@/components/SectionHeader'
import StatusTag from '@/components/StatusTag'
import { formatNumber } from '@/utils/format'
import dayjs from 'dayjs'

interface DayInfo {
  day: number
  status: 'empty' | 'filled' | 'missing' | 'abnormal'
  isToday: boolean
  dateStr: string
}

const DailyPage: React.FC = () => {
  const { dailyRecords, currentVoyageId } = useFuelStore()
  const [currentMonth, setCurrentMonth] = useState(dayjs('2026-06-09'))

  const voyageRecords = useMemo(() => {
    return dailyRecords
      .filter(r => r.voyageId === currentVoyageId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [dailyRecords, currentVoyageId])

  const filledDates = useMemo(() => {
    return new Set(voyageRecords.map(r => r.date))
  }, [voyageRecords])

  const abnormalDates = useMemo(() => {
    return new Set(voyageRecords.filter(r => r.isAbnormal).map(r => r.date))
  }, [voyageRecords])

  const calendarDays = useMemo((): DayInfo[] => {
    const year = currentMonth.year()
    const month = currentMonth.month()
    const firstDay = dayjs(new Date(year, month, 1))
    const daysInMonth = currentMonth.daysInMonth()
    const startWeekday = firstDay.day()

    const days: DayInfo[] = []

    for (let i = 0; i < startWeekday; i++) {
      days.push({ day: 0, status: 'empty', isToday: false, dateStr: '' })
    }

    const today = dayjs('2026-06-09')

    for (let d = 1; d <= daysInMonth; d++) {
      const date = dayjs(new Date(year, month, d))
      const dateStr = date.format('YYYY-MM-DD')
      const isToday = date.isSame(today, 'day')
      let status: DayInfo['status'] = 'missing'

      if (date.isAfter(today)) {
        status = 'empty'
      } else if (abnormalDates.has(dateStr)) {
        status = 'abnormal'
      } else if (filledDates.has(dateStr)) {
        status = 'filled'
      }

      days.push({ day: d, status, isToday, dateStr })
    }

    return days
  }, [currentMonth, filledDates, abnormalDates])

  const monthStats = useMemo(() => {
    let filled = 0
    let missing = 0
    calendarDays.forEach(d => {
      if (d.status === 'filled' || d.status === 'abnormal') filled++
      if (d.status === 'missing') missing++
    })
    return { filled, missing }
  }, [calendarDays])

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    const today = dayjs('2026-06-09')
    if (currentMonth.isBefore(today, 'month')) {
      setCurrentMonth(currentMonth.add(1, 'month'))
    }
  }

  const handleDayClick = (day: DayInfo) => {
    if (day.status === 'empty') return
    console.log('[DailyPage] Day clicked:', day.dateStr)
    Taro.navigateTo({ url: `/pages/daily-detail/index?date=${day.dateStr}` })
      .catch(err => console.error('[DailyPage] navigateTo error:', err))
  }

  const handleAddToday = () => {
    const today = dayjs('2026-06-09').format('YYYY-MM-DD')
    console.log('[DailyPage] Add today record:', today)
    Taro.navigateTo({ url: `/pages/daily-detail/index?date=${today}` })
      .catch(err => console.error('[DailyPage] navigateTo error:', err))
  }

  const handleRecordClick = (date: string) => {
    Taro.navigateTo({ url: `/pages/daily-detail/index?date=${date}` })
      .catch(err => console.error('[DailyPage] navigateTo error:', err))
  }

  return (
    <ScrollView className={styles.dailyPage} scrollY refresherEnabled>
      <View className={styles.monthHeader}>
        <View className={styles.monthNav}>
          <View className={styles.monthNavBtn} onClick={handlePrevMonth}>‹</View>
          <Text className={styles.monthText}>{currentMonth.format('YYYY年MM月')}</Text>
          <View className={styles.monthNavBtn} onClick={handleNextMonth}>›</View>
        </View>
        <View className={styles.statsBar}>
          <Text className={`${styles.statsTag} ${styles.filled}`}>已填 {monthStats.filled}</Text>
          <Text className={`${styles.statsTag} ${styles.missing}`}>漏填 {monthStats.missing}</Text>
        </View>
      </View>

      <View className={styles.calendarCard}>
        <View className={styles.weekdayRow}>
          {['日', '一', '二', '三', '四', '五', '六'].map(w => (
            <Text key={w} className={styles.weekday}>{w}</Text>
          ))}
        </View>
        <View className={styles.daysGrid}>
          {calendarDays.map((day, idx) => (
            <View
              key={idx}
              className={`${styles.dayCell} ${styles[day.status]} ${day.isToday ? styles.today : ''}`}
              onClick={() => handleDayClick(day)}
            >
              {day.status !== 'empty' && (
                <>
                  <Text className={styles.dayNumber}>{day.day}</Text>
                  {day.status !== 'missing' && (
                    <View className={`${styles.dayStatus} ${styles[day.status]}`} />
                  )}
                </>
              )}
            </View>
          ))}
        </View>
        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.filled}`} />
            <Text>已填报</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.missing}`} />
            <Text>待填报</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.abnormal}`} />
            <Text>异常</Text>
          </View>
        </View>
      </View>

      <View className={styles.listSection}>
        <SectionHeader title="填报记录" extra={<Text style={{ fontSize: '24rpx', color: '#86909C' }}>共 {voyageRecords.length} 条</Text>} />

        {voyageRecords.length === 0 ? (
          <EmptyState text="暂无日耗记录" />
        ) : (
          voyageRecords.map(record => (
            <View key={record.id} className={styles.recordCard} onClick={() => handleRecordClick(record.date)}>
              <View className={styles.recordHeader}>
                <Text className={styles.recordDate}>{record.date}</Text>
                <View className={styles.recordTags}>
                  <Text className={styles.weatherTag}>{record.weather}</Text>
                  {record.isAbnormal && (
                    <StatusTag text="异常" type="error" />
                  )}
                </View>
              </View>
              <View className={styles.recordStats}>
                <View className={styles.statItem}>
                  <Text className={styles.statLabel}>主机耗油</Text>
                  <Text className={styles.statValue}>{formatNumber(record.mainEngineConsumption)}</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statLabel}>辅机油耗</Text>
                  <Text className={styles.statValue}>{formatNumber(record.auxiliaryEngineConsumption)}</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statLabel}>当日总计</Text>
                  <Text className={`${styles.statValue} ${styles.statTotal}`}>{formatNumber(record.totalConsumption)}吨</Text>
                </View>
              </View>
              <View className={styles.recordMeta}>
                <Text>航行 {record.sailingHours}h · 等待 {record.waitingHours}h</Text>
                <Text>航程 {formatNumber(record.distance)} 海里</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View className={styles.fabButton} onClick={handleAddToday}>
        <Text className={styles.fabIcon}>+</Text>
      </View>
    </ScrollView>
  )
}

export default DailyPage
