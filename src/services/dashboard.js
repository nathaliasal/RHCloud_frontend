import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getDashboardStats = (params = {}) =>
  http.get(API.DASHBOARD_STATS, { params }).then(r => r.data)
