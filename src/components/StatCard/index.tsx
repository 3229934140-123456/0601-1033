import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'normal'
  trendValue?: string
  highlight?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, trend, trendValue, highlight = false }) => {
  return (
    <View className={classnames(styles.statCard, highlight && styles.highlight)}>
      <Text className={styles.title}>{title}</Text>
      <View className={styles.valueRow}>
        <Text className={styles.value}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      {trend && trendValue && (
        <Text className={classnames(styles.trend, styles[trend])}>
          {trendValue}
        </Text>
      )}
    </View>
  )
}

export default StatCard
