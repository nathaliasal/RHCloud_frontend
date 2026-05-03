import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getEmpresas = (params) =>
  http.get(API.EMPRESAS, { params }).then(r => r.data)

export const getEmpresa = (id) =>
  http.get(`${API.EMPRESAS}${id}`).then(r => r.data)

export const createEmpresa = (body) =>
  http.post(API.EMPRESAS, body).then(r => r.data)

export const updateEmpresa = (id, body) =>
  http.put(`${API.EMPRESAS}${id}`, body).then(r => r.data)

export const deleteEmpresa = (id) =>
  http.delete(`${API.EMPRESAS}${id}`)

export const toggleActivacionEmpresa = (id, isActive) =>
  http.patch(`${API.EMPRESAS}${id}/activation`, null, { params: { is_active: isActive } }).then(r => r.data)

export const uploadEmpresaLogo = (id, file) => {
  const form = new FormData()
  form.append('logo', file)
  return http.post(`${API.EMPRESAS}${id}/logo`, form).then(r => r.data)
}
