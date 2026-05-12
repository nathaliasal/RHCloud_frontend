import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getContratosPlantillas = (params) =>
  http.get(API.ESTABLISHED_CONTRACTS, { params }).then(r => r.data)

export const getContratoPlantilla = (id) =>
  http.get(`${API.ESTABLISHED_CONTRACTS}${id}`).then(r => r.data)

export const createContratoPlantilla = (body) =>
  http.post(API.ESTABLISHED_CONTRACTS, body).then(r => r.data)

export const updateContratoPlantilla = (id, body) =>
  http.put(`${API.ESTABLISHED_CONTRACTS}${id}`, body).then(r => r.data)

export const deleteContratoPlantilla = (id) =>
  http.delete(`${API.ESTABLISHED_CONTRACTS}${id}`)

export const toggleActivacionContratoPlantilla = (id, isActive) =>
  http.patch(`${API.ESTABLISHED_CONTRACTS}${id}/activation`, null, {
    params: { is_active: isActive },
  }).then(r => r.data)

export const getCargosPublic = () =>
  http.get(API.EMPLOYEE_CHARGES_PUBLIC, { params: { page: 1, page_size: 100 } }).then(r => r.data)

export const getIncrementos = (contractId, params) =>
  http.get(`${API.ESTABLISHED_INCREASES}/contract/${contractId}`, { params }).then(r => r.data)

export const createIncremento = (body) =>
  http.post(`${API.ESTABLISHED_INCREASES}/`, body).then(r => r.data)

export const updateIncremento = (id, body) =>
  http.put(`${API.ESTABLISHED_INCREASES}/${id}`, body).then(r => r.data)

export const deleteIncremento = (id) =>
  http.delete(`${API.ESTABLISHED_INCREASES}/${id}`)

export const getDeducciones = (contractId, params) =>
  http.get(`${API.ESTABLISHED_DEDUCTIONS}/contract/${contractId}`, { params }).then(r => r.data)

export const createDeduccion = (body) =>
  http.post(`${API.ESTABLISHED_DEDUCTIONS}/`, body).then(r => r.data)

export const updateDeduccion = (id, body) =>
  http.put(`${API.ESTABLISHED_DEDUCTIONS}/${id}`, body).then(r => r.data)

export const deleteDeduccion = (id) =>
  http.delete(`${API.ESTABLISHED_DEDUCTIONS}/${id}`)

export const getHorarios = (contractId, params) =>
  http.get(`${API.ESTABLISHED_SCHEDULES}/contract/${contractId}`, { params }).then(r => r.data)

export const createHorario = (body) =>
  http.post(`${API.ESTABLISHED_SCHEDULES}/`, body).then(r => r.data)

export const updateHorario = (id, body) =>
  http.put(`${API.ESTABLISHED_SCHEDULES}/${id}`, body).then(r => r.data)

export const deleteHorario = (id) =>
  http.delete(`${API.ESTABLISHED_SCHEDULES}/${id}`)
