import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getUsuarios = (params) =>
  http.get(API.USUARIOS, { params }).then(r => r.data)

export const getUsuario = (id) =>
  http.get(`${API.USUARIOS}${id}`).then(r => r.data)

export const getPerson = (personId) =>
  http.get(`${API.PERSONS}${personId}`).then(r => r.data)

export const createUsuario = (body) =>
  http.post(API.USUARIOS, body).then(r => r.data)

export const toggleActivacionUsuario = (id, isActive) =>
  http.patch(`${API.USUARIOS}${id}/activation`, { is_active: isActive }).then(r => r.data)

export const deleteUsuario = (id) =>
  http.delete(`${API.USUARIOS}${id}`)

export const verifyUser = () =>
  http.patch(API.USERS_VERIFY).then(r => r.data)

export const getRole = (roleId) =>
  http.get(`${API.ROLES}/${roleId}`).then(r => r.data)

export const getRolesPublic = () =>
  http.get(API.ROLES_PUBLIC, { params: { page: 1, page_size: 100 } }).then(r => r.data)

export const assignUserRole = (userId, roleId) =>
  http.put(`${API.USUARIOS}${userId}/role`, { role_id: roleId }).then(r => r.data)
