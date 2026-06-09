import { Ship, Voyage, FuelingRecord, DailyFuelRecord, ExceptionRecord, VoyageStatistics, MonthlyReport } from '@/types/fuel'

export const mockShips: Ship[] = [
  { id: 's001', name: '远洋号', code: 'YY-001', type: '散货船' },
  { id: 's002', name: '海航号', code: 'HH-002', type: '集装箱船' },
  { id: 's003', name: '东方之星', code: 'DF-003', type: '油轮' }
]

export const mockVoyages: Voyage[] = [
  {
    id: 'v001',
    shipId: 's001',
    shipName: '远洋号',
    segment: '上海-新加坡',
    departurePort: '上海港',
    arrivalPort: '新加坡港',
    departureDate: '2026-06-01',
    estimatedArrivalDate: '2026-06-12',
    status: 'in_progress',
    plannedFuelConsumption: 850,
    distance: 2800
  },
  {
    id: 'v002',
    shipId: 's001',
    shipName: '远洋号',
    segment: '新加坡-鹿特丹',
    departurePort: '新加坡港',
    arrivalPort: '鹿特丹港',
    departureDate: '2026-06-15',
    estimatedArrivalDate: '2026-07-05',
    status: 'pending',
    plannedFuelConsumption: 1200,
    distance: 4200
  },
  {
    id: 'v003',
    shipId: 's002',
    shipName: '海航号',
    segment: '深圳-洛杉矶',
    departurePort: '深圳港',
    arrivalPort: '洛杉矶港',
    departureDate: '2026-06-03',
    estimatedArrivalDate: '2026-06-25',
    status: 'in_progress',
    plannedFuelConsumption: 1500,
    distance: 5800
  },
  {
    id: 'v004',
    shipId: 's003',
    shipName: '东方之星',
    segment: '青岛-釜山',
    departurePort: '青岛港',
    arrivalPort: '釜山港',
    departureDate: '2026-05-28',
    estimatedArrivalDate: '2026-06-10',
    status: 'in_progress',
    plannedFuelConsumption: 380,
    distance: 650
  }
]

export const mockFuelingRecords: FuelingRecord[] = [
  {
    id: 'f001',
    voyageId: 'v001',
    date: '2026-06-01',
    fuelType: '重油',
    quantity: 500,
    unitPrice: 4800,
    totalAmount: 2400000,
    supplyPort: '上海港',
    supplier: '中石化燃供',
    receiptPhotos: [],
    remark: '首航加满',
    reviewStatus: 'confirmed',
    reviewComment: '油价合理，单据齐全',
    reviewer: '机务主管',
    reviewDate: '2026-06-02',
    createdAt: '2026-06-01 08:30:00'
  },
  {
    id: 'f002',
    voyageId: 'v001',
    date: '2026-06-05',
    fuelType: '轻油',
    quantity: 80,
    unitPrice: 6200,
    totalAmount: 496000,
    supplyPort: '香港锚地',
    supplier: '香港燃油供应',
    receiptPhotos: [],
    reviewStatus: 'pending_review',
    reviewComment: '',
    reviewer: '',
    reviewDate: '',
    remark: '',
    createdAt: '2026-06-05 14:20:00'
  }
]

export const mockDailyRecords: DailyFuelRecord[] = [
  {
    id: 'd001',
    voyageId: 'v001',
    date: '2026-06-01',
    mainEngineConsumption: 28.5,
    auxiliaryEngineConsumption: 3.2,
    totalConsumption: 31.7,
    weather: '晴',
    waitingHours: 2,
    sailingHours: 20,
    distance: 280,
    remark: '启航顺利',
    isAbnormal: false,
    createdAt: '2026-06-01 20:00:00'
  },
  {
    id: 'd002',
    voyageId: 'v001',
    date: '2026-06-02',
    mainEngineConsumption: 30.2,
    auxiliaryEngineConsumption: 3.5,
    totalConsumption: 33.7,
    weather: '多云',
    waitingHours: 0,
    sailingHours: 24,
    distance: 320,
    remark: '',
    isAbnormal: false,
    createdAt: '2026-06-02 20:00:00'
  },
  {
    id: 'd003',
    voyageId: 'v001',
    date: '2026-06-03',
    mainEngineConsumption: 35.8,
    auxiliaryEngineConsumption: 4.1,
    totalConsumption: 39.9,
    weather: '大风',
    waitingHours: 4,
    sailingHours: 18,
    distance: 240,
    remark: '遭遇强风，航速降低',
    isAbnormal: true,
    createdAt: '2026-06-03 20:00:00'
  },
  {
    id: 'd004',
    voyageId: 'v001',
    date: '2026-06-04',
    mainEngineConsumption: 29.0,
    auxiliaryEngineConsumption: 3.3,
    totalConsumption: 32.3,
    weather: '晴',
    waitingHours: 0,
    sailingHours: 24,
    distance: 310,
    remark: '',
    isAbnormal: false,
    createdAt: '2026-06-04 20:00:00'
  },
  {
    id: 'd005',
    voyageId: 'v001',
    date: '2026-06-05',
    mainEngineConsumption: 27.8,
    auxiliaryEngineConsumption: 3.0,
    totalConsumption: 30.8,
    weather: '晴',
    waitingHours: 3,
    sailingHours: 21,
    distance: 290,
    remark: '香港锚地补给',
    isAbnormal: false,
    createdAt: '2026-06-05 20:00:00'
  }
]

export const mockExceptionRecords: ExceptionRecord[] = [
  {
    id: 'e001',
    voyageId: 'v001',
    date: '2026-06-03',
    type: 'fuel_high',
    description: '6月3日油耗偏高，主机耗油35.8吨',
    reason: '当日遭遇8级大风，为保证安全需保持主机高负荷运转，同时顶浪航行阻力增大。等待避让时间约4小时。',
    status: 'approved',
    reviewer: '张主管',
    reviewComment: '情况属实，天气因素导致油耗增加合理。已记录备案。',
    reviewDate: '2026-06-04',
    createdAt: '2026-06-03 21:30:00'
  },
  {
    id: 'e002',
    voyageId: 'v001',
    date: '2026-06-06',
    type: 'fuel_abnormal',
    description: '6月6日辅机油耗异常升高',
    reason: '正在排查中，怀疑是空调系统故障导致。',
    status: 'reviewing',
    reviewer: '',
    reviewComment: '',
    reviewDate: '',
    createdAt: '2026-06-06 21:00:00'
  }
]

export const mockVoyageStatistics: VoyageStatistics = {
  voyageId: 'v001',
  totalFueling: 580,
  totalConsumption: 168.4,
  remainingFuel: 411.6,
  consumptionPerMile: 0.172,
  plannedConsumptionPerMile: 0.304,
  deviation: -0.132,
  deviationPercent: -43.4
}

export const mockMonthlyReports: MonthlyReport[] = [
  {
    month: '2026-05',
    shipName: '远洋号',
    totalFueling: 1850,
    totalConsumption: 1720,
    averageConsumptionPerMile: 0.185,
    totalDistance: 9300,
    voyageCount: 3,
    exceptionCount: 2
  },
  {
    month: '2026-04',
    shipName: '远洋号',
    totalFueling: 2100,
    totalConsumption: 1980,
    averageConsumptionPerMile: 0.192,
    totalDistance: 10300,
    voyageCount: 4,
    exceptionCount: 1
  }
]
