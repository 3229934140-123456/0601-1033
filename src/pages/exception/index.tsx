import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import EmptyState from '@/components/EmptyState'
import StatusTag from '@/components/StatusTag'
import { getExceptionStatusText, getExceptionTypeText } from '@/utils/format'
import { ExceptionStatus } from '@/types/fuel'
import classnames from 'classnames'

const TAB_LIST = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'reviewing', label: '审核中' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' }
]

const ExceptionPage: React.FC = () => {
  const { exceptionRecords, currentVoyageId } = useFuelStore()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [, forceUpdate] = useState(0)

  useDidShow(() => {
    forceUpdate(n => n + 1)
  })

  const voyageRecords = useMemo(() => {
    return exceptionRecords
      .filter(r => r.voyageId === currentVoyageId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [exceptionRecords, currentVoyageId])

  const filteredRecords = useMemo(() => {
    if (activeTab === 'all') return voyageRecords
    return voyageRecords.filter(r => r.status === activeTab)
  }, [voyageRecords, activeTab])

  const getStatusTagType = (status: ExceptionStatus): 'success' | 'warning' | 'error' | 'primary' => {
    const map: Record<ExceptionStatus, 'success' | 'warning' | 'error' | 'primary'> = {
      approved: 'success',
      rejected: 'error',
      reviewing: 'warning',
      pending: 'primary'
    }
    return map[status] || 'primary'
  }

  const getTypeClass = (type: string): string => {
    const map: Record<string, string> = {
      fuel_high: styles.typeHigh,
      fuel_abnormal: styles.typeAbnormal,
      other: styles.typeOther
    }
    return map[type] || styles.typeOther
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const handleAddException = () => {
    console.log('[ExceptionPage] Navigate to add exception')
    Taro.navigateTo({ url: '/pages/exception-detail/index' })
      .catch(err => console.error('[ExceptionPage] navigateTo error:', err))
  }

  const handleCardClick = (id: string) => {
    console.log('[ExceptionPage] Click exception:', id)
    Taro.navigateTo({ url: `/pages/exception-detail/index?id=${id}` })
      .catch(err => console.error('[ExceptionPage] navigateTo error:', err))
  }

  return (
    <ScrollView className={styles.exceptionPage} scrollY refresherEnabled>
      <View className={styles.filterTabs}>
        {TAB_LIST.map(tab => (
          <Text
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </Text>
        ))}
      </View>

      <View className={styles.listSection}>
        {filteredRecords.length === 0 ? (
          <EmptyState text="暂无异常记录" />
        ) : (
          filteredRecords.map(record => (
            <View
              key={record.id}
              className={classnames(styles.exceptionCard, getTypeClass(record.type))}
              onClick={() => handleCardClick(record.id)}
            >
              <View className={styles.cardHeader}>
                <View className={styles.headerLeft}>
                  <Text className={styles.exceptionDate}>{record.date}</Text>
                  <Text className={styles.exceptionType}>{getExceptionTypeText(record.type)}</Text>
                </View>
                <StatusTag text={getExceptionStatusText(record.status)} type={getStatusTagType(record.status)} />
              </View>
              <View className={styles.cardBody}>
                <Text className={styles.exceptionDesc}>{record.description}</Text>
                <Text className={styles.exceptionReason}>{record.reason}</Text>
              </View>
              {record.reviewComment && (
                <View className={styles.reviewSection}>
                  <Text className={styles.reviewLabel}>审核意见 · {record.reviewer}</Text>
                  <Text className={styles.reviewComment}>{record.reviewComment}</Text>
                </View>
              )}
              <View className={styles.cardFooter}>
                {record.reviewer && (
                  <Text className={styles.reviewerInfo}>审核人：{record.reviewer} · {record.reviewDate}</Text>
                )}
                {!record.reviewer && (
                  <Text className={styles.reviewerInfo}>提交时间：{record.createdAt}</Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View className={styles.fabButton} onClick={handleAddException}>
        <Text className={styles.fabIcon}>+</Text>
      </View>
    </ScrollView>
  )
}

export default ExceptionPage
