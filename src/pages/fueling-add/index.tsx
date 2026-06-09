import React, { useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import { FuelType } from '@/types/fuel'
import dayjs from 'dayjs'
import classnames from 'classnames'

const FUEL_TYPES: FuelType[] = ['重油', '轻油', '柴油', '润滑油']

const FuelingAddPage: React.FC = () => {
  const { addFuelingRecord, currentVoyageId } = useFuelStore()
  const [date, setDate] = useState(dayjs('2026-06-09').format('YYYY-MM-DD'))
  const [fuelType, setFuelType] = useState<FuelType>('重油')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [supplyPort, setSupplyPort] = useState('')
  const [supplier, setSupplier] = useState('')
  const [remark, setRemark] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)

  const handleAddPhoto = () => {
    console.log('[FuelingAdd] Add photo clicked')
    Taro.chooseImage({
      count: 3 - photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    }).then(res => {
      console.log('[FuelingAdd] Photos selected:', res.tempFilePaths.length)
      setPhotos([...photos, ...res.tempFilePaths])
    }).catch(err => {
      console.error('[FuelingAdd] chooseImage error:', err)
    })
  }

  const handleDeletePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!quantity || !unitPrice || !supplyPort) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
        .catch(err => console.error('[FuelingAdd] toast error:', err))
      return
    }

    console.log('[FuelingAdd] Submit record')
    addFuelingRecord({
      voyageId: currentVoyageId,
      date,
      fuelType,
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice),
      totalAmount,
      supplyPort,
      supplier,
      receiptPhotos: photos,
      remark
    })

    Taro.showToast({ title: '提交成功', icon: 'success' })
      .then(() => {
        setTimeout(() => {
          Taro.navigateBack().catch(err => console.error('[FuelingAdd] navigateBack error:', err))
        }, 1000)
      })
      .catch(err => console.error('[FuelingAdd] submit toast error:', err))
  }

  const handleCancel = () => {
    Taro.navigateBack().catch(err => console.error('[FuelingAdd] cancel error:', err))
  }

  return (
    <View className={styles.fuelingAddPage}>
      <View className={styles.formSection}>
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>加油日期</Text>
          <View className={styles.formInput}>
            <Text className={styles.formInputText}>{date}</Text>
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>燃油种类</Text>
          <View className={styles.typeSelector}>
            {FUEL_TYPES.map(type => (
              <Text
                key={type}
                className={classnames(styles.typeOption, fuelType === type && styles.active)}
                onClick={() => setFuelType(type)}
              >
                {type}
              </Text>
            ))}
          </View>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.amountRow}>
            <View className={styles.amountItem}>
              <Text className={styles.formLabel}>加油量 (吨)</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={quantity}
                onInput={(e) => setQuantity(e.detail.value)}
                placeholder="请输入加油量"
                placeholderClass={styles.formInputPlaceholder}
              />
            </View>
            <View className={styles.amountItem}>
              <Text className={styles.formLabel}>单价 (元/吨)</Text>
              <Input
                className={styles.formInput}
                type="digit"
                value={unitPrice}
                onInput={(e) => setUnitPrice(e.detail.value)}
                placeholder="请输入单价"
                placeholderClass={styles.formInputPlaceholder}
              />
            </View>
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>金额合计</Text>
          <View className={styles.formInput}>
            <Text className={styles.formInputText}>¥ {totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>供应港</Text>
          <Input
            className={styles.formInput}
            value={supplyPort}
            onInput={(e) => setSupplyPort(e.detail.value)}
            placeholder="请输入供应港口"
            placeholderClass={styles.formInputPlaceholder}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>供应商（选填）</Text>
          <Input
            className={styles.formInput}
            value={supplier}
            onInput={(e) => setSupplier(e.detail.value)}
            placeholder="请输入供应商名称"
            placeholderClass={styles.formInputPlaceholder}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>备注说明（选填）</Text>
          <Textarea
            className={styles.formTextarea}
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
            placeholder="请输入备注信息"
            placeholderClass={styles.formInputPlaceholder}
            maxlength={200}
          />
        </View>
      </View>

      <View className={styles.photoSection}>
        <Text className={styles.formLabel}>油单照片（最多3张）</Text>
        <View className={styles.photoGrid} style={{ marginTop: '16rpx' }}>
          {photos.map((photo, idx) => (
            <View key={idx} className={styles.photoItem}>
              <Text style={{ width: '100%', height: '100%', background: '#e5e6eb', borderRadius: '12rpx', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60rpx' }}>🖼️</Text>
              <View className={styles.photoDelete} onClick={() => handleDeletePhoto(idx)}>×</View>
            </View>
          ))}
          {photos.length < 3 && (
            <View className={styles.photoAdd} onClick={handleAddPhoto}>
              <Text className={styles.photoAddIcon}>+</Text>
              <Text className={styles.photoAddText}>上传照片</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>提交</Button>
      </View>
    </View>
  )
}

export default FuelingAddPage
