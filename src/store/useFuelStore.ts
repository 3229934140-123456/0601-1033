import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { Ship, Voyage, FuelingRecord, DailyFuelRecord, ExceptionRecord, VoyageStatistics, MonthlyReport } from '@/types/fuel'
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
  getVoyageStatistics: (voyageId?: string) => VoyageStatistics | null
  getMonthlyReport: (month: string, shipName: string) => MonthlyReport | null
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

    const stats: VoyageStatistics = {
      voyageId: vid,
      totalFueling: Number(totalFueling.toFixed(2)),
      totalConsumption: Number(totalConsumption.toFixed(2)),
      remainingFuel: Number(remainingFuel.toFixed(2)),
      consumptionPerMile: Number(consumptionPerMile.toFixed(3)),
      plannedConsumptionPerMile: Number(plannedConsumptionPerMile.toFixed(3)),
      deviation: Number(deviation.toFixed(3)),
      deviationPercent: Number(deviationPercent.toFixed(1))
    }

    console.log('[FuelStore] Calculated stats for voyage', vid, ':', stats)
    return stats
  },

  getMonthlyReport: (month: string, shipName: string): MonthlyReport | null => {
    const state = get()
    const voyageIds = state.voyages.filter(v => v.shipName === shipName).map(v => v.id)

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
    const averageConsumptionPerMile = totalDistance > 0 ? totalConsumption / totalDistance : 0

    const uniqueVoyageIds = new Set([
      ...monthFueling.map(r => r.voyageId),
      ...monthDaily.map(r => r.voyageId)
    ])

    return {
      month,
      shipName,
      totalFueling: Number(totalFueling.toFixed(2)),
      totalConsumption: Number(totalConsumption.toFixed(2)),
      averageConsumptionPerMile: Number(averageConsumptionPerMile.toFixed(3)),
      totalDistance: Number(totalDistance.toFixed(0)),
      voyageCount: uniqueVoyageIds.size,
      exceptionCount: monthExceptions.length
    }
  }
}))
