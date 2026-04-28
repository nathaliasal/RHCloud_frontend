import { http } from '@/services/http'
import { API } from '@/constants/api'

export const login = (username, password) => {
  const body = new URLSearchParams()
  body.append('grant_type', 'password')
  body.append('username', username)
  body.append('password', password)
  return http
    .post(API.LOGIN, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((r) => r.data)
}

export const getMe = () => http.get(API.ME).then((r) => r.data)

export const recoverPassword = (email) =>
  http.post(API.RECOVER_PASSWORD, { email }).then((r) => r.data)

export const resetPassword = (token, new_password, confirm_password) =>
  http
    .post(API.RESET_PASSWORD, { token, new_password, confirm_password })
    .then((r) => r.data)
