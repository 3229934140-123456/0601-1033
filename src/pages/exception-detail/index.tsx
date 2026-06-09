import React, { useState, useMemo } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import { getExceptionStatusText } from '@/utils/format'
import StatusTag from '@/components/StatusTag'
import dayjs from 'dayjs'
import classnames from 'classnames'

type ExceptionType = 'fuel_high' | 'fuel_abnormal' | 'other'

const TYPE_OPTIONS: { key: ExceptionType; label: string }[] = [
  { key: 'fuel_high', label: '油耗偏高' },
  { key: 'fuel_abnormal', label: '油耗异常' },
  { key: 'other', label: '其他异常' }
]

const ExceptionDetailPage: React.FC = () => {
  const router = useRouter()
  const { addExceptionRecord, exceptionRecords, currentVoyageId } = useFuelStore()
  const recordId = router.params.id

  const existingRecord = useMemo(() => {
    if (!recordId) return null
    return exceptionRecords.find(r => r.id === recordId)
  }, [exceptionRecords, recordId])

  const isEdit = !existingRecord

  const [date, setDate] = useState(existingRecord?.date || dayjs('2026-06-09').format('YYYY-MM-DD'))
  const [type, setType] = useState<ExceptionType>(existingRecord?.type || 'fuel_high')
  const [description, setDescription] = useState(existingRecord?.description || '')
  const [reason, setReason] = useState(existingRecord?.reason || '')

  const handleSubmit = () => {
    if (!description || !reason) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
        .catch(err => console.error('[ExceptionDetail] toast error:', err))
      return
    }

    console.log('[ExceptionDetail] Submit exception record')
    addExceptionRecord({
      voyageId: currentVoyageId,
      date,
      type,
      description,
      reason
    })

    Taro.showToast({ title: '提交成功', icon: 'success' })
      .then(() => {
        setTimeout(() => {
          Taro.navigateBack().catch(err => console.error('[ExceptionDetail] navigateBack error:', err))
        }, 1000)
      })
      .catch(err => console.error('[ExceptionDetail] submit toast error:', err))
  }

  const handleCancel = () => {
    Taro.navigateBack().catch(err => console.error('[ExceptionDetail] cancel error:', err))
  }

  const getStatusTagType = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'error' | 'primary'> = {
      approved: 'success',
      rejected: 'error',
      reviewing: 'warning',
      pending: 'primary'
    }
    return map[status] || 'primary'
  }

  return (
    <View className={styles.exceptionDetailPage}>
      <View className={styles.statusHeader}>
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text className={styles.statusBadge}>
            {isEdit ? '新建异常说明' : getExceptionStatusText(existingRecord?.status || 'pending')}
          </Text>
          {existingRecord && (
            <StatusTag
              text={getExceptionStatusText(existingRecord?.status || 'pending')}
              type={getStatusTagType(existingRecord?.status || 'pending')}
            />
          )}
        </View>
        <Text className={styles.dateText}>{date}</Text>
        <Text className={styles.descText}>
          {existingRecord?.description || '请详细描述异常情况'}
        </Text>
      </View>

      {isEdit ? (
        <View className={styles.formSection}>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>异常日期</Text>
            <View className={styles.formInput}>
              <Text>{date}</Text>
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>异常类型</Text>
            <View className={styles.typeSelector}>
              {TYPE_OPTIONS.map(opt => (
                <Text
                  key={opt.key}
                  className={classnames(styles.typeOption, type === opt.key && styles.active)}
                  onClick={() => setType(opt.key)}
                >
                  {opt.label}
                </Text>
              ))}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>异常描述</Text>
            <Input
              className={styles.formInput}
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              placeholder="简要描述异常情况"
              placeholderClass={styles.formInputPlaceholder}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>异常原因说明</Text>
            <Textarea
              className={styles.formTextarea}
              value={reason}
              onInput={(e) => setReason(e.detail.value)}
              placeholder="请详细说明异常原因、影响因素、处理情况等..."
              placeholderClass={styles.formInputPlaceholder}
              maxlength={500}
            />
          </View>
        </View>
      ) : (
        <View className={styles.formSection}>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>异常类型</Text>
            <View className={styles.readOnlyValue}>
              {existingRecord?.type === 'fuel_high' ? '油耗偏高' : existingRecord?.type === 'fuel_abnormal' ? '油耗异常' : '其他异常'}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>异常原因说明</Text>
            <View className={styles.readOnlyValue}>
              {existingRecord?.reason}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>提交时间</Text>
            <View className={styles.readOnlyValue}>
              {existingRecord?.createdAt}
            </View>
          </View>
        </View>
      )}

      {existingRecord?.reviewComment && (
        <View className={styles.reviewSection}>
          <Text className={styles.reviewTitle}>审核意见</Text>
          <View className={styles.reviewInfo}>
            <Text className={styles.reviewerName}>审核人：{existingRecord.reviewer}</Text>
            <Text className={styles.reviewDate}>{existingRecord.reviewDate}</Text>
          </View>
          <View className={styles.reviewCommentBox}>
            <Text className={styles.reviewCommentText}>{existingRecord.reviewComment}</Text>
          </View>
        </View>
      )}

      {isEdit && (
        <View className={styles.bottomBar}>
          <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
          <Button className={styles.submitBtn} onClick={handleSubmit}>提交审核</Button>
        </View>
      )}
    </View>
  )
}

export default ExceptionDetailPage
