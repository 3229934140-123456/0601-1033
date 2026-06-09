import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

interface EmptyStateProps {
  text?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({ text = '暂无数据' }) => {
  return (
    <View className={styles.emptyState}>
      <View className={styles.emptyIcon}>
        <Text className={styles.emptyIconText}>📋</Text>
      </View>
      <Text className={styles.emptyText}>{text}</Text>
    </View>
  )
}

export default EmptyState
