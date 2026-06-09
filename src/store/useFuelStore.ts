import { create } from 'zustand'
import { Ship, Voyage, FuelingRecord, DailyFuelRecord, ExceptionRecord, VoyageStatistics, MonthlyReport } from '@/types/fuel'
import { mockShips, mockVoyages, mockFuelingRecords, mockDailyRecords, mockExceptionRecords, mockVoyageStatistics, mockMonthlyReports } from '@/data/mockData'

interface FuelState {
  ships: Ship[]
  voyages: Voyage[]
  currentVoyageId: string
  fuelingRecords: FuelingRecord[]
  dailyRecords: DailyFuelRecord[]
  exceptionRecords: ExceptionRecord[]
  voyageStatistics: VoyageStatistics | null
  monthlyReports: MonthlyReport[]

  setCurrentVoyage: (voyageId: string) => void
  addFuelingRecord: (record: Omit<FuelingRecord, 'id' | 'createdAt'>) => void
  addDailyRecord: (record: Omit<DailyFuelRecord, 'id' | 'createdAt'>) => void
  addExceptionRecord: (record: Omit<ExceptionRecord, 'id' | 'createdAt' | 'status' | 'reviewer' | 'reviewComment' | 'reviewDate'>) => void
}

export const useFuelStore = create<FuelState>((set, get) => ({
  ships: mockShips,
  voyages: mockVoyages,
  currentVoyageId: mockVoyages[0]?.id || '',
  fuelingRecords: mockFuelingRecords,
  dailyRecords: mockDailyRecords,
  exceptionRecords: mockExceptionRecords,
  voyageStatistics: mockVoyageStatistics,
  monthlyReports: mockMonthlyReports,

  setCurrentVoyage: (voyageId: string) => {
    set({ currentVoyageId: voyageId })
  },

  addFuelingRecord: (record) => {
    const newRecord: FuelingRecord = {
      ...record,
      id: `f${Date.now()}`,
      createdAt: new Date().toLocaleString()
    }
    set((state) => ({
      fuelingRecords: [newRecord, ...state.fuelingRecords]
    }))
  },

  addDailyRecord: (record) => {
    const newRecord: DailyFuelRecord = {
      ...record,
      id: `d${Date.now()}`,
      createdAt: new Date().toLocaleString()
    }
    set((state) => ({
      dailyRecords: [newRecord, ...state.dailyRecords]
    }))
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
    set((state) => ({
      exceptionRecords: [newRecord, ...state.exceptionRecords]
    }))
  }
}))
