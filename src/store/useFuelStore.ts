import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { Ship, Voyage, FuelingRecord, DailyFuelRecord, ExceptionRecord, VoyageStatistics, MonthlyReport, VoyageCostAnalysis, FuelingReviewStatus } from '@/types/fuel'
import { mockShips, mockVoyages, mockFuelingRecords, mockDailyRecords, mockExceptionRecords, mockMonthlyReports } from '@/data/mockData'

const STORAGE_KEY = 'fuel_records_v1'

interface PersistedData {
  fuelingRecords: FuelingRecord[]
  dailyRecords: DailyFuelRecord[]
  exceptionRecords: ExceptionRecord[]
  currentVoyageId: string
}

interface FuelState {
  ships: Ship[]
  voyages: Voyage[]
  currentVoyageId: string
  fuelingRecords: FuelingRecord[]
  dailyRecords: DailyFuelRecord[]
  exceptionRecords: ExceptionRecord[]
  monthlyReports: MonthlyReport[]

  initFromStorage: () => void
  persistToStorage: () => void
  setCurrentVoyage: (voyageId: string) => void
  addFuelingRecord: (record: Omit<FuelingRecord, 'id' | 'createdAt'>) => void
  addDailyRecord: (record: Omit<DailyFuelRecord, 'id' | 'createdAt'>) => void
  addExceptionRecord: (record: Omit<ExceptionRecord, 'id' | 'createdAt' | 'status' | 'reviewer' | 'reviewComment' | 'reviewDate'>) => void
  reviewExceptionRecord: (id: string, status: 'approved' | 'rejected' | 'reviewing', reviewComment: string, reviewer?: string) => void
  reviewFuelingRecord: (id: string, status: FuelingReviewStatus, reviewComment: string, reviewer?: string) => void
  getVoyageStatistics: (voyageId?: string) => VoyageStatistics | null
  getVoyageCostAnalysis: (voyageId?: string) => VoyageCostAnalysis | null
  getMonthlyReport: (month: string, shipName: string) => MonthlyReport | null
  getAvailableMonths: (shipName?: string) => string[]
  getFuelPrediction: (voyageId?: string) => { remainingDistance: number; dailyAvgConsumption: number; estimatedArrivalFuel: number; riskLevel: 'safe' | 'warning' | 'danger' | 'insufficient' } | null
}

const loadFromStorage = (): PersistedData | null => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY)
    if (data) {
      console.log('[FuelStore] Loaded data from storage')
      return JSON.parse(data) as PersistedData
    }
  } catch (e) {
    console.error('[FuelStore] Failed to load from storage:', e)
  }
  return null
}

export const useFuelStore = create<FuelState>((set, get) => ({
  ships: mockShips,
  voyages: mockVoyages,
  currentVoyageId: mockVoyages[0]?.id || '',
  fuelingRecords: mockFuelingRecords,
  dailyRecords: mockDailyRecords,
  exceptionRecords: mockExceptionRecords,
  monthlyReports: mockMonthlyReports,

  initFromStorage: () => {
    const saved = loadFromStorage()
    if (saved) {
      console.log('[FuelStore] Restoring from storage, records:', {
        fueling: saved.fuelingRecords?.length || 0,
        daily: saved.dailyRecords?.length || 0,
        exception: saved.exceptionRecords?.length || 0,
        voyageId: saved.currentVoyageId
      })
      set({
        fuelingRecords: saved.fuelingRecords || mockFuelingRecords,
        dailyRecords: saved.dailyRecords || mockDailyRecords,
        exceptionRecords: saved.exceptionRecords || mockExceptionRecords,
        currentVoyageId: saved.currentVoyageId || mockVoyages[0]?.id || ''
      })
    }
  },

  persistToStorage: () => {
    const state = get()
    const data: PersistedData = {
      fuelingRecords: state.fuelingRecords,
      dailyRecords: state.dailyRecords,
      exceptionRecords: state.exceptionRecords,
      currentVoyageId: state.currentVoyageId
    }
    try {
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(data))
      console.log('[FuelStore] Persisted to storage, records:', {
        fueling: data.fuelingRecords.length,
        daily: data.dailyRecords.length,
        exception: data.exceptionRecords.length
      })
    } catch (e) {
      console.error('[FuelStore] Failed to persist:', e)
    }
  },

  setCurrentVoyage: (voyageId: string) => {
    console.log('[FuelStore] Switching voyage to:', voyageId)
    set({ currentVoyageId: voyageId })
    get().persistToStorage()
  },

  addFuelingRecord: (record) => {
    const newRecord: FuelingRecord = {
      ...record,
      id: `f${Date.now()}`,
      reviewStatus: 'pending_review',
      createdAt: new Date().toLocaleString()
    }
    console.log('[FuelStore] Adding fueling record:', newRecord)
    set((state) => ({
      fuelingRecords: [newRecord, ...state.fuelingRecords]
    }))
    get().persistToStorage()
  },

  addDailyRecord: (record) => {
    const state = get()
    const existingIndex = state.dailyRecords.findIndex(
      r => r.voyageId === record.voyageId && r.date === record.date
    )

    if (existingIndex >= 0) {
      console.log('[FuelStore] Updating existing daily record for date:', record.date)
      const existingRecord = state.dailyRecords[existingIndex]
      const updatedRecords = [...state.dailyRecords]
      updatedRecords[existingIndex] = {
        ...existingRecord,
        ...record,
        id: existingRecord.id,
        createdAt: existingRecord.createdAt
      }
      set({ dailyRecords: updatedRecords })
    } else {
      console.log('[FuelStore] Adding new daily record for date:', record.date)
      const newRecord: DailyFuelRecord = {
        ...record,
        id: `d${Date.now()}`,
        createdAt: new Date().toLocaleString()
      }
      set((state) => ({
        dailyRecords: [newRecord, ...state.dailyRecords]
      }))
    }
    get().persistToStorage()
  },

  addExceptionRecord: (record) => {
    const newRecord: ExceptionRecord = {
      ...record,
      id: `e${Date.now()}`,
      status: 'pending',
      reviewer: '',
      reviewComment: '',
      reviewDate: '',
      createdAt: new Date().toLocaleString()
    }
    console.log('[FuelStore] Adding exception record:', newRecord)
    set((state) => ({
      exceptionRecords: [newRecord, ...state.exceptionRecords]
    }))
    get().persistToStorage()
  },

  reviewExceptionRecord: (id, status, reviewComment, reviewer = '机务主管') => {
    console.log('[FuelStore] Reviewing exception:', { id, status, reviewComment })
    set((state) => ({
      exceptionRecords: state.exceptionRecords.map(r =>
        r.id === id
          ? {
              ...r,
              status,
              reviewer,
              reviewComment,
              reviewDate: new Date().toISOString().split('T')[0]
            }
          : r
      )
    }))
    get().persistToStorage()
  },

  reviewFuelingRecord: (id, status, reviewComment, reviewer = '机务主管') => {
    console.log('[FuelStore] Reviewing fueling record:', { id, status, reviewComment })
    set((state) => ({
      fuelingRecords: state.fuelingRecords.map(r =>
        r.id === id
          ? {
              ...r,
              reviewStatus: status,
              reviewer,
              reviewComment,
              reviewDate: new Date().toISOString().split('T')[0]
            }
          : r
      )
    }))
    get().persistToStorage()
  },

  getAvailableMonths: (shipName) => {
    const state = get()
    const shipVoyageIds = shipName
      ? state.voyages.filter(v => v.shipName === shipName).map(v => v.id)
      : state.voyages.map(v => v.id)

    const months = new Set<string>()

    state.voyages.forEach(v => {
      if (!shipName || v.shipName === shipName) {
        if (v.departureDate) months.add(v.departureDate.slice(0, 7))
        if (v.estimatedArrivalDate) months.add(v.estimatedArrivalDate.slice(0, 7))
      }
    })
    state.fuelingRecords.forEach(r => {
      if (!shipName || shipVoyageIds.includes(r.voyageId)) {
        if (r.date) months.add(r.date.slice(0, 7))
      }
    })
    state.dailyRecords.forEach(r => {
      if (!shipName || shipVoyageIds.includes(r.voyageId)) {
        if (r.date) months.add(r.date.slice(0, 7))
      }
    })
    state.exceptionRecords.forEach(r => {
      if (!shipName || shipVoyageIds.includes(r.voyageId)) {
        if (r.date) months.add(r.date.slice(0, 7))
      }
    })

    return Array.from(months).sort().reverse()
  },

  getVoyageCostAnalysis: (voyageId) => {
    const state = get()
    const vid = voyageId || state.currentVoyageId
    if (!vid) return null

    const voyage = state.voyages.find(v => v.id === vid)
    if (!voyage) return null

    const voyageFueling = state.fuelingRecords.filter(r => r.voyageId === vid)
    const voyageDaily = state.dailyRecords.filter(r => r.voyageId === vid)

    const totalFuelingAmount = voyageFueling.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    const totalFuelingQuantity = voyageFueling.reduce((sum, r) => sum + r.quantity, 0)
    const totalDistance = voyageDaily.reduce((sum, r) => sum + r.distance, 0)
    const totalConsumption = voyageDaily.reduce((sum, r) => sum + r.totalConsumption, 0)

    if (totalFuelingQuantity === 0 && voyageFueling.length === 0) {
      return {
        totalFuelingAmount: 0,
        averageUnitPrice: 0,
        costPerMile: 0,
        plannedTotalCost: 0,
        actualTotalCost: 0,
        costDeviation: 0,
        costDeviationPercent: 0,
        hasData: false
      }
    }

    const averageUnitPrice = totalFuelingQuantity > 0 ? totalFuelingAmount / totalFuelingQuantity : 5200
    const plannedPerMile = voyage.distance > 0 ? voyage.plannedFuelConsumption / voyage.distance : 0
    const costPerMile = totalDistance > 0 ? (totalConsumption * averageUnitPrice) / totalDistance : 0
    const plannedTotalCost = plannedPerMile * averageUnitPrice * (voyage.distance || 0)
    const actualTotalCost = totalConsumption * averageUnitPrice
    const costDeviation = actualTotalCost - plannedTotalCost
    const costDeviationPercent = plannedTotalCost > 0 ? (costDeviation / plannedTotalCost) * 100 : 0

    return {
      totalFuelingAmount: Number(totalFuelingAmount.toFixed(2)),
      averageUnitPrice: Number(averageUnitPrice.toFixed(2)),
      costPerMile: Number(costPerMile.toFixed(2)),
      plannedTotalCost: Number(plannedTotalCost.toFixed(2)),
      actualTotalCost: Number(actualTotalCost.toFixed(2)),
      costDeviation: Number(costDeviation.toFixed(2)),
      costDeviationPercent: Number(costDeviationPercent.toFixed(1)),
      hasData: true
    }
  },

  getFuelPrediction: (voyageId?: string) => {
    const state = get()
    const vid = voyageId || state.currentVoyageId
    if (!vid) return null

    const voyage = state.voyages.find(v => v.id === vid)
    if (!voyage) return null

    const voyageFueling = state.fuelingRecords.filter(r => r.voyageId === vid)
    const voyageDaily = state.dailyRecords.filter(r => r.voyageId === vid)

    const totalFueling = voyageFueling.reduce((sum, r) => sum + r.quantity, 0)
    const totalConsumption = voyageDaily.reduce((sum, r) => sum + r.totalConsumption, 0)
    const totalDistance = voyageDaily.reduce((sum, r) => sum + r.distance, 0)
    const remainingFuel = totalFueling - totalConsumption

    const remainingDistance = Math.max(voyage.distance - totalDistance, 0)
    const daysCount = voyageDaily.length

    if (totalFueling === 0 || daysCount < 2) {
      return {
        remainingDistance: Number(remainingDistance.toFixed(0)),
        dailyAvgConsumption: 0,
        estimatedArrivalFuel: 0,
        riskLevel: 'insufficient' as const
      }
    }

    const dailyAvgConsumption = totalConsumption / daysCount
    const consumptionPerMile = totalDistance > 0 ? totalConsumption / totalDistance : dailyAvgConsumption / 24
    const estimatedRemainingConsumption = remainingDistance * consumptionPerMile
    const estimatedArrivalFuel = remainingFuel - estimatedRemainingConsumption

    let riskLevel: 'safe' | 'warning' | 'danger' | 'insufficient'
    if (estimatedArrivalFuel < 0) {
      riskLevel = 'danger'
    } else if (estimatedArrivalFuel < dailyAvgConsumption * 2) {
      riskLevel = 'warning'
    } else {
      riskLevel = 'safe'
    }

    return {
      remainingDistance: Number(remainingDistance.toFixed(0)),
      dailyAvgConsumption: Number(dailyAvgConsumption.toFixed(2)),
      estimatedArrivalFuel: Number(estimatedArrivalFuel.toFixed(2)),
      riskLevel
    }
  },

  getVoyageStatistics: (voyageId?: string): VoyageStatistics | null => {
    const state = get()
    const vid = voyageId || state.currentVoyageId
    if (!vid) return null

    const voyage = state.voyages.find(v => v.id === vid)
    if (!voyage) return null

    const voyageFueling = state.fuelingRecords.filter(r => r.voyageId === vid)
    const voyageDaily = state.dailyRecords.filter(r => r.voyageId === vid)

    const totalFueling = voyageFueling.reduce((sum, r) => sum + r.quantity, 0)
    const totalConsumption = voyageDaily.reduce((sum, r) => sum + r.totalConsumption, 0)
    const totalDistance = voyageDaily.reduce((sum, r) => sum + r.distance, 0)

    const remainingFuel = totalFueling - totalConsumption
    const consumptionPerMile = totalDistance > 0 ? totalConsumption / totalDistance : 0
    const plannedConsumptionPerMile = voyage.distance > 0 ? voyage.plannedFuelConsumption / voyage.distance : 0
    const deviation = consumptionPerMile - plannedConsumptionPerMile
    const deviationPercent = plannedConsumptionPerMile > 0
      ? (deviation / plannedConsumptionPerMile) * 100
      : 0

    const cost = state.getVoyageCostAnalysis(vid) || {
      totalFuelingAmount: 0,
      averageUnitPrice: 0,
      costPerMile: 0,
      plannedTotalCost: 0,
      actualTotalCost: 0,
      costDeviation: 0,
      costDeviationPercent: 0,
      hasData: false
    }

    const stats: VoyageStatistics = {
      voyageId: vid,
      totalFueling: Number(totalFueling.toFixed(2)),
      totalConsumption: Number(totalConsumption.toFixed(2)),
      remainingFuel: Number(remainingFuel.toFixed(2)),
      consumptionPerMile: Number(consumptionPerMile.toFixed(3)),
      plannedConsumptionPerMile: Number(plannedConsumptionPerMile.toFixed(3)),
      deviation: Number(deviation.toFixed(3)),
      deviationPercent: Number(deviationPercent.toFixed(1)),
      cost
    }

    console.log('[FuelStore] Calculated stats for voyage', vid, ':', stats)
    return stats
  },

  getMonthlyReport: (month: string, shipName: string): MonthlyReport | null => {
    const state = get()
    const shipVoyages = state.voyages.filter(v => v.shipName === shipName)
    const relevantVoyages = shipVoyages.filter(v =>
      v.departureDate.startsWith(month) || v.estimatedArrivalDate.startsWith(month)
    )
    const voyageIds = relevantVoyages.map(v => v.id)

    const monthFueling = state.fuelingRecords.filter(
      r => voyageIds.includes(r.voyageId) && r.date.startsWith(month)
    )
    const monthDaily = state.dailyRecords.filter(
      r => voyageIds.includes(r.voyageId) && r.date.startsWith(month)
    )
    const monthExceptions = state.exceptionRecords.filter(
      r => voyageIds.includes(r.voyageId) && r.date.startsWith(month)
    )

    const totalFueling = monthFueling.reduce((sum, r) => sum + r.quantity, 0)
    const totalConsumption = monthDaily.reduce((sum, r) => sum + r.totalConsumption, 0)
    const totalDistance = monthDaily.reduce((sum, r) => sum + r.distance, 0)
    const totalFuelingAmount = monthFueling.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    const averageUnitPrice = totalFueling > 0 ? totalFuelingAmount / totalFueling : 0
    const costPerMile = totalDistance > 0 ? (totalConsumption * averageUnitPrice) / totalDistance : 0

    const voyageDetails = relevantVoyages.map(v => ({
      voyageId: v.id,
      segment: `${v.departurePort}→${v.arrivalPort}`,
      departurePort: v.departurePort,
      arrivalPort: v.arrivalPort,
      departureDate: v.departureDate,
      hasFueling: state.fuelingRecords.some(r => r.voyageId === v.id),
      hasDaily: state.dailyRecords.some(r => r.voyageId === v.id)
    }))

    const averageConsumptionPerMile = totalDistance > 0 ? totalConsumption / totalDistance : 0

    return {
      month,
      shipName,
      totalFueling: Number(totalFueling.toFixed(2)),
      totalConsumption: Number(totalConsumption.toFixed(2)),
      averageConsumptionPerMile: Number(averageConsumptionPerMile.toFixed(3)),
      totalDistance: Number(totalDistance.toFixed(0)),
      voyageCount: uniqueVoyageIds.size,
      exceptionCount: monthExceptions.length,
      totalFuelingAmount: Number(totalFuelingAmount.toFixed(2)),
      averageUnitPrice: Number(averageUnitPrice.toFixed(2)),
      costPerMile: Number(costPerMile.toFixed(2)),
      voyageDetails
    }
  }
}))
