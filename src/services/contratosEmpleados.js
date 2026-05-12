import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getContrato = (id) =>
  http.get(`${API.CONTRACTS}${id}`).then(r => r.data)

export const createContrato = (body) =>
  http.post(API.CONTRACTS, body).then(r => r.data)

export const updateContrato = (id, body) =>
  http.put(`${API.CONTRACTS}${id}`, body).then(r => r.data)

export const getIncrementos = (contractId, params) =>
  http.get(`${API.INCREASES}/contract/${contractId}`, { params }).then(r => r.data)

export const createIncremento = (body) =>
  http.post(`${API.INCREASES}/`, body).then(r => r.data)

export const updateIncremento = (id, body) =>
  http.put(`${API.INCREASES}/${id}`, body).then(r => r.data)

export const deleteIncremento = (id) =>
  http.delete(`${API.INCREASES}/${id}`)

export const getDeducciones = (contractId, params) =>
  http.get(`${API.DEDUCTIONS}/contract/${contractId}`, { params }).then(r => r.data)

export const createDeduccion = (body) =>
  http.post(`${API.DEDUCTIONS}/`, body).then(r => r.data)

export const updateDeduccion = (id, body) =>
  http.put(`${API.DEDUCTIONS}/${id}`, body).then(r => r.data)

export const deleteDeduccion = (id) =>
  http.delete(`${API.DEDUCTIONS}/${id}`)

export const getHorarios = (contractId) =>
  http.get(`${API.SCHEDULES}/contract/${contractId}`).then(r => r.data)

export const createHorario = (body) =>
  http.post(`${API.SCHEDULES}/`, body).then(r => r.data)

export const updateHorario = (id, body) =>
  http.put(`${API.SCHEDULES}/${id}`, body).then(r => r.data)

export const deleteHorario = (id) =>
  http.delete(`${API.SCHEDULES}/${id}`)
