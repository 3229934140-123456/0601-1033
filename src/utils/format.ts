export const formatNumber = (num: number, decimals: number = 2): string => {
  if (isNaN(num)) return '0'
  return Number(num).toFixed(decimals)
}

export const formatCurrency = (num: number): string => {
  if (isNaN(num)) return '¥0.00'
  return `¥${Number(num).toFixed(2)}`
}

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  return dateStr
}

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    in_progress: '进行中',
    completed: '已完成',
    pending: '待启航',
    approved: '已通过',
    rejected: '已驳回',
    reviewing: '审核中',
    pending: '待审核'
  }
  return map[status] || status
}

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    in_progress: '#00B42A',
    completed: '#0066CC',
    pending: '#FF7D00',
    approved: '#00B42A',
    rejected: '#F53F3F',
    reviewing: '#FF7D00'
  }
  return map[status] || '#86909C'
}

export const getExceptionTypeText = (type: string): string => {
  const map: Record<string, string> = {
    fuel_high: '油耗偏高',
    fuel_abnormal: '油耗异常',
    other: '其他异常'
  }
  return map[type] || type
}
