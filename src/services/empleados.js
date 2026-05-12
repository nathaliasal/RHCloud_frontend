import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getEmpleados = (params) =>
  http.get(API.EMPLOYEES, { params }).then(r => r.data)

export const createEmpleado = (body) =>
  http.post(API.EMPLOYEES, body).then(r => r.data)

export const updateEmpleado = (id, body) =>
  http.put(`${API.EMPLOYEES}${id}`, body).then(r => r.data)

export const toggleActivacionEmpleado = (id) =>
  http.patch(`${API.EMPLOYEES}${id}/activation`).then(r => r.data)

export const getContratosEmpleado = (employeeId, params) =>
  http.get(API.CONTRACTS_FILTERED, { params: { ...params, employee_id: employeeId } }).then(r => r.data)

export const getUsuariosActivos = (params) =>
  http.get(API.USUARIOS, { params }).then(r => r.data)

export const getEmpresasPublic = (params) =>
  http.get(API.COMPANIES_PUBLIC, { params }).then(r => r.data)

export const getCargosPublicEmpleados = (params) =>
  http.get(API.EMPLOYEE_CHARGES_PUBLIC, { params }).then(r => r.data)
