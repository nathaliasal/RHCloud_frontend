import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getNotifications = (params = {}) =>
  http.get(API.NOTIFICATIONS, { params }).then(r => r.data)

export const getUnreadCount = () =>
  http.get(API.NOTIFICATIONS_UNREAD).then(r => r.data)

export const markNotificationAsRead = (id) =>
  http.patch(`/api/v1/notifications/${id}/read`, {}).then(r => r.data)
