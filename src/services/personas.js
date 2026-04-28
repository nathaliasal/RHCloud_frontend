import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getDocumentTypes = () =>
  http.get(API.PERSONS_DOCUMENT_TYPES).then((r) => r.data)

export const getGenders = () =>
  http.get(API.PERSONS_GENDERS).then((r) => r.data)

export const createPerson = (body) =>
  http.post(API.PERSONS, body).then((r) => r.data)
