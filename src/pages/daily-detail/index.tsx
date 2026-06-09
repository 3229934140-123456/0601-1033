import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import { WeatherType } from '@/types/fuel'
import { formatNumber } from '@/utils/format'
import classnames from 'classnames'

const WEATHER_OPTIONS: { type: WeatherType; icon: string }[] = [
  { type: '晴', icon: '☀️' },
  { type: '多云', icon: '⛅' },
  { type: '阴', icon: '☁️' },
  { type: '小雨', icon: '🌧️' },
  { type: '中雨', icon: '🌧️' },
  { type: '大雨', icon: '⛈️' },
  { type: '雾', icon: '🌫️' },
  { type: '大风', icon: '💨' }
]

const DailyDetailPage: React.FC = () => {
  const router = useRouter()
  const { addDailyRecord, dailyRecords, currentVoyageId } = useFuelStore()
  const date = router.params.date || new Date().toISOString().split('T')[0]

  const existingRecord = useMemo(() => {
    return dailyRecords.find(r => r.date === date && r.voyageId === currentVoyageId)
  }, [dailyRecords, date, currentVoyageId])

  const [mainEngine, setMainEngine] = useState(existingRecord?.mainEngineConsumption?.toString() || '')
  const [auxiliaryEngine, setAuxiliaryEngine] = useState(existingRecord?.auxiliaryEngineConsumption?.toString() || '')
  const [weather, setWeather] = useState<WeatherType>(existingRecord?.weather || '晴')
  const [sailingHours, setSailingHours] = useState(existingRecord?.sailingHours?.toString() || '24')
  const [waitingHours, setWaitingHours] = useState(existingRecord?.waitingHours?.toString() || '0')
  const [distance, setDistance] = useState(existingRecord?.distance?.toString() || '')
  const [isAbnormal, setIsAbnormal] = useState(existingRecord?.isAbnormal || false)
  const [remark, setRemark] = useState(existingRecord?.remark || '')

  useEffect(() => {
    if (existingRecord) {
      setMainEngine(existingRecord.mainEngineConsumption.toString())
      setAuxiliaryEngine(existingRecord.auxiliaryEngineConsumption.toString())
      setWeather(existingRecord.weather)
      setSailingHours(existingRecord.sailingHours.toString())
      setWaitingHours(existingRecord.waitingHours.toString())
      setDistance(existingRecord.distance.toString())
      setIsAbnormal(existingRecord.isAbnormal)
      setRemark(existingRecord.remark || '')
    }
  }, [existingRecord])

  const totalConsumption = (parseFloat(mainEngine) || 0) + (parseFloat(auxiliaryEngine) || 0)

  const handleSubmit = () => {
    if (!mainEngine || !auxiliaryEngine || !distance) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
        .catch(err => console.error('[DailyDetail] toast error:', err))
      return
    }

    console.log('[DailyDetail] Submit daily record for date:', date)
    addDailyRecord({
      voyageId: currentVoyageId,
      date,
      mainEngineConsumption: parseFloat(mainEngine),
      auxiliaryEngineConsumption: parseFloat(auxiliaryEngine),
      totalConsumption,
      weather,
      waitingHours: parseFloat(waitingHours) || 0,
      sailingHours: parseFloat(sailingHours) || 0,
      distance: parseFloat(distance),
      remark,
      isAbnormal
    })

    Taro.showToast({ title: '提交成功', icon: 'success' })
      .then(() => {
        setTimeout(() => {
          Taro.navigateBack().catch(err => console.error('[DailyDetail] navigateBack error:', err))
        }, 1000)
      })
      .catch(err => console.error('[DailyDetail] submit toast error:', err))
  }

  const handleCancel = () => {
    Taro.navigateBack().catch(err => console.error('[DailyDetail] cancel error:', err))
  }

  return (
    <View className={styles.dailyDetailPage}>
      <View className={styles.dateHeader}>
        <Text className={styles.dateText}>{date}</Text>
        <Text className={styles.dateSub}>{existingRecord ? '编辑日耗记录' : '新建日耗记录'}</Text>
      </View>

      {existingRecord && (
        <View className={styles.historyInfo}>
          <Text className={styles.historyTitle}>历史数据参考</Text>
          <View className={styles.historyGrid}>
            <View className={styles.historyItem}>
              <Text className={styles.historyValue}>{formatNumber(existingRecord.totalConsumption)}</Text>
              <Text className={styles.historyLabel}>总耗(吨)</Text>
            </View>
            <View className={styles.historyItem}>
              <Text className={styles.historyValue}>{existingRecord.weather}</Text>
              <Text className={styles.historyLabel}>天气</Text>
            </View>
            <View className={styles.historyItem}>
              <Text className={styles.historyValue}>{formatNumber(existingRecord.distance)}</Text>
              <Text className={styles.historyLabel}>航程(海里)</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.formSection}>
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>燃油消耗（吨）</Text>
          <View className={styles.amountGrid}>
            <View className={styles.amountItem}>
              <Text className={styles.formLabel} style={{ fontSize: '24rpx', marginBottom: '8rpx' }}>主机耗油</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={mainEngine}
                onInput={(e) => setMainEngine(e.detail.value)}
                placeholder="主机耗油量"
                placeholderClass={styles.formInputPlaceholder}
              />
            </View>
            <View className={styles.amountItem}>
              <Text className={styles.formLabel} style={{ fontSize: '24rpx', marginBottom: '8rpx' }}>辅机油耗</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={auxiliaryEngine}
                onInput={(e) => setAuxiliaryEngine(e.detail.value)}
                placeholder="辅机耗油量"
                placeholderClass={styles.formInputPlaceholder}
              />
            </View>
          </View>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.totalBox}>
            <Text className={styles.totalLabel}>当日总耗油量</Text>
            <Text className={styles.totalValue}>{formatNumber(totalConsumption)} 吨</Text>
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>天气情况</Text>
          <View className={styles.weatherSelector}>
            {WEATHER_OPTIONS.map(opt => (
              <Text
                key={opt.type}
                className={classnames(styles.weatherOption, weather === opt.type && styles.active)}
                onClick={() => setWeather(opt.type)}
              >
                <Text className={styles.weatherIcon}>{opt.icon}</Text>
                {opt.type}
              </Text>
            ))}
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>航行时间（小时）</Text>
          <View className={styles.timeGrid}>
            <View className={styles.timeItem}>
              <Text className={styles.formLabel} style={{ fontSize: '24rpx', marginBottom: '8rpx' }}>航行时长</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={sailingHours}
                onInput={(e) => setSailingHours(e.detail.value)}
                placeholder="小时"
                placeholderClass={styles.formInputPlaceholder}
              />
            </View>
            <View className={styles.timeItem}>
              <Text className={styles.formLabel} style={{ fontSize: '24rpx', marginBottom: '8rpx' }}>等待时长</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={waitingHours}
                onInput={(e) => setWaitingHours(e.detail.value)}
                placeholder="小时"
                placeholderClass={styles.formInputPlaceholder}
              />
            </View>
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>航程（海里）</Text>
          <Input
            className={styles.formInput}
            type="digit"
            value={distance}
            onInput={(e) => setDistance(e.detail.value)}
            placeholder="请输入当日航行里程"
            placeholderClass={styles.formInputPlaceholder}
          />
        </View>

        <View className={styles.formGroup}>
          <View className={styles.abnormalToggle}>
            <Text className={styles.abnormalLabel}>标记为异常数据</Text>
            <View
              className={classnames(styles.switchBox, isAbnormal && styles.active)}
              onClick={() => setIsAbnormal(!isAbnormal)}
            >
              <View className={styles.switchDot} />
            </View>
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>备注说明（选填）</Text>
          <Textarea
            className={styles.formTextarea}
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
            placeholder="请输入备注信息，如天气影响、特殊情况等"
            placeholderClass={styles.formInputPlaceholder}
            maxlength={200}
          />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          {existingRecord ? '保存修改' : '提交'}
        </Button>
      </View>
    </View>
  )
}

export default DailyDetailPage
