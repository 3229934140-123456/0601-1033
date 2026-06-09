import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import EmptyState from '@/components/EmptyState'
import SectionHeader from '@/components/SectionHeader'
import StatusTag from '@/components/StatusTag'
import { formatNumber, formatCurrency, getFuelingReviewStatusText, getFuelingReviewStatusColor } from '@/utils/format'
import type { FuelingReviewStatus, FuelingRecord } from '@/types/fuel'
import classnames from 'classnames'

const FuelingPage: React.FC = () => {
  const { fuelingRecords, currentVoyageId, reviewFuelingRecord } = useFuelStore()
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [currentReviewRecord, setCurrentReviewRecord] = useState<FuelingRecord | null>(null)
  const [reviewStatus, setReviewStatus] = useState<FuelingReviewStatus>('pending_review')
  const [reviewComment, setReviewComment] = useState('')

  useDidShow(() => {
    setRefreshVersion(v => v + 1)
  })

  const voyageRecords = useMemo(() => {
    return fuelingRecords.filter(r => r.voyageId === currentVoyageId)
  }, [fuelingRecords, currentVoyageId, refreshVersion])

  const summary = useMemo(() => {
    const totalQty = voyageRecords.reduce((sum, r) => sum + r.quantity, 0)
    const totalAmount = voyageRecords.reduce((sum, r) => sum + r.totalAmount, 0)
    const pendingCount = voyageRecords.filter(r => r.reviewStatus === 'pending_review').length
    return { totalQty, totalAmount, pendingCount }
  }, [voyageRecords])

  const handleAddFueling = () => {
    console.log('[FuelingPage] Navigate to add fueling')
    Taro.navigateTo({ url: '/pages/fueling-add/index' })
      .catch(err => console.error('[FuelingPage] navigateTo error:', err))
  }

  const openReviewModal = (record: FuelingRecord) => {
    setCurrentReviewRecord(record)
    setReviewStatus(record.reviewStatus || 'pending_review')
    setReviewComment(record.reviewComment || '')
    setShowReviewModal(true)
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setCurrentReviewRecord(null)
    setReviewComment('')
  }

  const handleSaveReview = () => {
    if (!currentReviewRecord) return
    reviewFuelingRecord(currentReviewRecord.id, reviewStatus, reviewComment, '张主管')
    Taro.showToast({ title: '复核结果已保存', icon: 'success' })
    closeReviewModal()
    setRefreshVersion(v => v + 1)
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
          <View className={styles.summaryDivider} />
          <View className={styles.summaryItem}>
            <Text className={classnames(styles.summaryValue, summary.pendingCount > 0 ? styles.summaryValueWarn : '')}>
              {summary.pendingCount}
            </Text>
            <Text className={styles.summaryUnit}>待复核</Text>
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
                <View className={styles.recordHeaderRight}>
                  <Text className={styles.fuelTypeTag}>{record.fuelType}</Text>
                  <StatusTag
                    text={getFuelingReviewStatusText(record.reviewStatus)}
                    color={getFuelingReviewStatusColor(record.reviewStatus)}
                  />
                </View>
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
              {(record.reviewComment || record.reviewer) && (
                <View className={styles.reviewInfo}>
                  <Text className={styles.reviewLabel}>
                    复核人：{record.reviewer || '-'}  {record.reviewDate || ''}
                  </Text>
                  {record.reviewComment && (
                    <Text className={styles.reviewComment}>"{record.reviewComment}"</Text>
                  )}
                </View>
              )}
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
              <View className={styles.recordActions}>
                <Text className={styles.reviewBtn} onClick={() => openReviewModal(record)}>
                  成本复核
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {showReviewModal && currentReviewRecord && (
        <View className={styles.modalMask} onClick={closeReviewModal}>
          <View className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>加油单成本复核</Text>
              <Text className={styles.modalClose} onClick={closeReviewModal}>取消</Text>
            </View>
            <ScrollView className={styles.modalContent} scrollY>
              <View className={styles.reviewRecordInfo}>
                <Text className={styles.reviewRecordRow}>
                  日期：{currentReviewRecord.date}
                </Text>
                <Text className={styles.reviewRecordRow}>
                  油品：{currentReviewRecord.fuelType}  数量：{formatNumber(currentReviewRecord.quantity)}吨
                </Text>
                <Text className={styles.reviewRecordRow}>
                  单价：{formatCurrency(currentReviewRecord.unitPrice)}/吨  金额：{formatCurrency(currentReviewRecord.totalAmount)}
                </Text>
                <Text className={styles.reviewRecordRow}>
                  供应港：{currentReviewRecord.supplyPort}
                </Text>
              </View>

              <View className={styles.formBlock}>
                <Text className={styles.formLabel}>复核结果</Text>
                <View className={styles.statusOptions}>
                  {(['pending_review', 'confirmed', 'needs_revision'] as FuelingReviewStatus[]).map(status => (
                    <View
                      key={status}
                      className={classnames(styles.statusOption, reviewStatus === status && styles.statusOptionActive)}
                      onClick={() => setReviewStatus(status)}
                    >
                      <Text className={classnames(styles.statusOptionText, reviewStatus === status && styles.statusOptionTextActive)}>
                        {getFuelingReviewStatusText(status)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formBlock}>
                <Text className={styles.formLabel}>复核意见</Text>
                <Textarea
                  className={styles.formTextarea}
                  value={reviewComment}
                  onInput={(e) => setReviewComment(e.detail.value)}
                  placeholder="请填写复核意见，如单价异常需修改等"
                  maxlength={200}
                />
              </View>
            </ScrollView>
            <View className={styles.modalActions}>
              <Text className={styles.modalBtnSecondary} onClick={closeReviewModal}>取消</Text>
              <Text className={styles.modalBtnPrimary} onClick={handleSaveReview}>保存复核</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.fabButton} onClick={handleAddFueling}>
        <Text className={styles.fabIcon}>+</Text>
      </View>
    </ScrollView>
  )
}

export default FuelingPage
