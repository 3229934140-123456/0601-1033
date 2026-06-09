import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useFuelStore } from '@/store/useFuelStore'
import { Ship, Voyage } from '@/types/fuel'
import { getVoyageStatusText } from '@/utils/format'
import classnames from 'classnames'

interface VoyageSelectorProps {
  visible: boolean
  onClose: () => void
  mode: 'ship' | 'voyage' | 'all'
}

const VoyageSelector: React.FC<VoyageSelectorProps> = ({ visible, onClose, mode = 'all' }) => {
  const { ships, voyages, currentVoyageId, setCurrentVoyage } = useFuelStore()
  const currentVoyage = voyages.find(v => v.id === currentVoyageId)
  const currentShip = ships.find(s => s.name === currentVoyage?.shipName)

  const shipsWithVoyages = useMemo(() => {
    return ships.filter(ship => voyages.some(v => v.shipName === ship.name))
  }, [ships, voyages])

  const [selectedShipId, setSelectedShipId] = useState<string | undefined>(currentShip?.id)
  const [step, setStep] = useState<'ship' | 'voyage'>(
    mode === 'voyage' ? 'voyage' : 'ship'
  )

  const selectedShip = useMemo(() => {
    return ships.find(s => s.id === selectedShipId)
  }, [ships, selectedShipId])

  const filteredVoyages = useMemo(() => {
    if (!selectedShip) return []
    return voyages.filter(v => v.shipName === selectedShip.name)
  }, [selectedShip, voyages])

  const handleSelectShip = (ship: Ship) => {
    setSelectedShipId(ship.id)
    const shipVoyages = voyages.filter(v => v.shipName === ship.name)
    if (shipVoyages.length === 0) {
      Taro.showToast({ title: '该船舶暂无航段', icon: 'none' }).catch(() => {})
      return
    }
    if (mode === 'ship') {
      setCurrentVoyage(shipVoyages[0].id)
      Taro.showToast({ title: `已切换至${ship.name}`, icon: 'success' }).catch(() => {})
      onClose()
    } else {
      setStep('voyage')
    }
  }

  const handleSelectVoyage = (voyage: Voyage) => {
    setCurrentVoyage(voyage.id)
    Taro.showToast({ title: '已切换航段', icon: 'success' }).catch(() => {})
    onClose()
  }

  if (!visible) return null

  return (
    <View className={styles.mask} onClick={onClose}>
      <View className={styles.sheet} onClick={e => e.stopPropagation()}>
        <View className={styles.sheetHeader}>
          <Text className={styles.sheetTitle}>
            {step === 'ship' ? '选择船舶' : '选择航段'}
          </Text>
          <Text className={styles.sheetClose} onClick={onClose}>关闭</Text>
        </View>

        {step === 'voyage' && selectedShip && (
          <View className={styles.backBar} onClick={() => setStep('ship')}>
            <Text className={styles.backText}>← 返回选择船舶（当前：{selectedShip.name}）</Text>
          </View>
        )}

        <ScrollView scrollY className={styles.listContainer}>
          {step === 'ship' && shipsWithVoyages.map(ship => (
            <View
              key={ship.id}
              className={classnames(styles.listItem, {
                [styles.listItemActive]: currentShip?.id === ship.id
              })}
              onClick={() => handleSelectShip(ship)}
            >
              <View className={styles.itemMain}>
                <Text className={styles.itemTitle}>{ship.name}</Text>
                <Text className={styles.itemSub}>{ship.code} · {ship.type}</Text>
              </View>
              {currentShip?.id === ship.id && (
                <Text className={styles.checkMark}>✓</Text>
              )}
            </View>
          ))}

          {step === 'ship' && shipsWithVoyages.length === 0 && (
            <View className={styles.emptyState}>
              <Text>暂无可用船舶</Text>
            </View>
          )}

          {step === 'voyage' && filteredVoyages.map(voyage => (
            <View
              key={voyage.id}
              className={classnames(styles.listItem, {
                [styles.listItemActive]: voyage.id === currentVoyageId
              })}
              onClick={() => handleSelectVoyage(voyage)}
            >
              <View className={styles.itemMain}>
                <Text className={styles.itemTitle}>
                  {voyage.departurePort} → {voyage.arrivalPort}
                </Text>
                <Text className={styles.itemSub}>
                  {voyage.departureDate} 出发 · {voyage.distance}海里 · {getVoyageStatusText(voyage.status)}
                </Text>
              </View>
              {voyage.id === currentVoyageId && (
                <Text className={styles.checkMark}>✓</Text>
              )}
            </View>
          ))}

          {step === 'voyage' && filteredVoyages.length === 0 && (
            <View className={styles.emptyState}>
              <Text>该船舶暂无航段数据</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default VoyageSelector
