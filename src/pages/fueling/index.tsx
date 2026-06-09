import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import EmptyState from '@/components/EmptyState'
import SectionHeader from '@/components/SectionHeader'
import { formatNumber, formatCurrency } from '@/utils/format'

const FuelingPage: React.FC = () => {
  const { fuelingRecords, currentVoyageId } = useFuelStore()
  const [, forceUpdate] = useState(0)

  useDidShow(() => {
    forceUpdate(n => n + 1)
  })

  const voyageRecords = useMemo(() => {
    return fuelingRecords.filter(r => r.voyageId === currentVoyageId)
  }, [fuelingRecords, currentVoyageId])

  const summary = useMemo(() => {
    const totalQty = voyageRecords.reduce((sum, r) => sum + r.quantity, 0)
    const totalAmount = voyageRecords.reduce((sum, r) => sum + r.totalAmount, 0)
    return { totalQty, totalAmount }
  }, [voyageRecords])

  const handleAddFueling = () => {
    console.log('[FuelingPage] Navigate to add fueling')
    Taro.navigateTo({ url: '/pages/fueling-add/index' })
      .catch(err => console.error('[FuelingPage] navigateTo error:', err))
  }

  return (
    <ScrollView className={styles.fuelingPage} scrollY refresherEnabled>
      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>本航次加油汇总</Text>
        <View className={styles.summaryStats}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{formatNumber(summary.totalQty)}</Text>
            <Text className={styles.summaryUnit}>累计加油 (吨)</Text>
          </View>
          <View className={styles.summaryDivider} />
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{formatCurrency(summary.totalAmount)}</Text>
            <Text className={styles.summaryUnit}>累计金额</Text>
          </View>
        </View>
      </View>

      <View className={styles.listSection}>
        <SectionHeader title="加油记录" extra={<Text style={{ fontSize: '24rpx', color: '#86909C' }}>共 {voyageRecords.length} 条</Text>} />

        {voyageRecords.length === 0 ? (
          <EmptyState text="暂无加油记录" />
        ) : (
          voyageRecords.map(record => (
            <View key={record.id} className={styles.recordCard}>
              <View className={styles.recordHeader}>
                <Text className={styles.recordDate}>{record.date}</Text>
                <Text className={styles.fuelTypeTag}>{record.fuelType}</Text>
              </View>
              <View className={styles.recordInfo}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>加油量</Text>
                  <Text className={styles.infoValue}>{formatNumber(record.quantity)} 吨</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>单价</Text>
                  <Text className={styles.infoValue}>{formatCurrency(record.unitPrice)}/吨</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>供应港</Text>
                  <Text className={styles.infoValue}>{record.supplyPort}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>金额</Text>
                  <Text className={styles.infoAmount}>{formatCurrency(record.totalAmount)}</Text>
                </View>
              </View>
              {(record.remark || record.receiptPhotos.length > 0) && (
                <View className={styles.recordFooter}>
                  {record.remark && (
                    <Text className={styles.recordRemark}>{record.remark}</Text>
                  )}
                  {record.receiptPhotos.length > 0 && (
                    <View className={styles.photoIndicator}>
                      <Text>📷</Text>
                      <Text>{record.receiptPhotos.length}张</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View className={styles.fabButton} onClick={handleAddFueling}>
        <Text className={styles.fabIcon}>+</Text>
      </View>
    </ScrollView>
  )
}

export default FuelingPage
