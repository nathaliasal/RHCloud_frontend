import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getTerminos = (params) =>
  http.get(`${API.TERMS}/`, { params }).then(r => r.data)

export const createTermino = (body) =>
  http.post(`${API.TERMS}/`, body).then(r => r.data)

export const updateTermino = (id, body) =>
  http.put(`${API.TERMS}/${id}`, body).then(r => r.data)

export const deleteTermino = (id) =>
  http.delete(`${API.TERMS}/${id}`)

export const toggleActivacionTermino = (id, is_active) =>
  http.patch(`${API.TERMS}/${id}/activation`, null, { params: { is_active } }).then(r => r.data)
