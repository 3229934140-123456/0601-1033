export interface Ship {
  id: string
  name: string
  code: string
  type: string
}

export interface Voyage {
  id: string
  shipId: string
  shipName: string
  segment: string
  departurePort: string
  arrivalPort: string
  departureDate: string
  estimatedArrivalDate: string
  status: 'in_progress' | 'completed' | 'pending'
  plannedFuelConsumption: number
  distance: number
}

export type FuelType = '重油' | '轻油' | '柴油' | '润滑油'

export type FuelingReviewStatus = 'pending_review' | 'confirmed' | 'needs_revision'

export interface FuelingRecord {
  id: string
  voyageId: string
  date: string
  fuelType: FuelType
  quantity: number
  unitPrice: number
  totalAmount: number
  supplyPort: string
  supplier?: string
  receiptPhotos: string[]
  remark?: string
  reviewStatus?: FuelingReviewStatus
  reviewComment?: string
  reviewer?: string
  reviewDate?: string
  createdAt: string
}

export type WeatherType = '晴' | '多云' | '阴' | '小雨' | '中雨' | '大雨' | '雾' | '大风'

export interface DailyFuelRecord {
  id: string
  voyageId: string
  date: string
  mainEngineConsumption: number
  auxiliaryEngineConsumption: number
  totalConsumption: number
  weather: WeatherType
  waitingHours: number
  sailingHours: number
  distance: number
  remark?: string
  isAbnormal: boolean
  createdAt: string
}

export type ExceptionStatus = 'pending' | 'reviewing' | 'approved' | 'rejected'

export interface ExceptionRecord {
  id: string
  voyageId: string
  date: string
  type: 'fuel_high' | 'fuel_abnormal' | 'other'
  description: string
  reason: string
  status: ExceptionStatus
  reviewer?: string
  reviewComment?: string
  reviewDate?: string
  createdAt: string
}

export interface VoyageCostAnalysis {
  totalFuelingAmount: number
  averageUnitPrice: number
  costPerMile: number
  plannedTotalCost: number
  actualTotalCost: number
  costDeviation: number
  costDeviationPercent: number
  hasData: boolean
}

export interface VoyageStatistics {
  voyageId: string
  totalFueling: number
  totalConsumption: number
  remainingFuel: number
  consumptionPerMile: number
  plannedConsumptionPerMile: number
  deviation: number
  deviationPercent: number
  cost: VoyageCostAnalysis
}

export interface MonthlyVoyageDetail {
  voyageId: string
  segment: string
  departurePort: string
  arrivalPort: string
  departureDate: string
  hasFueling: boolean
  hasDaily: boolean
}

export interface MonthlyReport {
  month: string
  shipName: string
  totalFueling: number
  totalConsumption: number
  averageConsumptionPerMile: number
  totalDistance: number
  voyageCount: number
  exceptionCount: number
  totalFuelingAmount: number
  averageUnitPrice: number
  costPerMile: number
  voyageDetails: MonthlyVoyageDetail[]
}
