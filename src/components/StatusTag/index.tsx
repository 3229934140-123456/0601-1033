import React from 'react'
import { Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'

interface StatusTagProps {
  text: string
  type?: 'primary' | 'success' | 'warning' | 'error' | 'default'
}

const StatusTag: React.FC<StatusTagProps> = ({ text, type = 'default' }) => {
  return (
    <Text className={classnames(styles.statusTag, styles[type])}>{text}</Text>
  )
}

export default StatusTag
