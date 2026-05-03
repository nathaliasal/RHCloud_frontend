export const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const API = {
  LOGIN:              '/api/v1/auth/login',
  ME:                 '/api/v1/auth/me',
  RECOVER_PASSWORD:   '/api/v1/auth/recover-password',
  RESET_PASSWORD:     '/api/v1/auth/reset-password',

  PERSONS:                      '/api/v1/persons/',
  PERSONS_DOCUMENT_TYPES:       '/api/v1/persons/document/available',
  PERSONS_GENDERS:              '/api/v1/persons/genders/available',

  EMPRESAS:         '/api/v1/companies/',
  TERMS_PUBLIC:     '/api/v1/terms/public',
  TERMS:            '/api/v1/terms',
  CARGOS:           '/api/v1/cargos',
  USUARIOS:         '/api/v1/usuarios',
  CONTRATOS:        '/api/v1/contratos',
  SOLICITUDES:      '/api/v1/solicitudes',
  NOTIFICACIONES:   '/api/v1/notificaciones',
  CHATBOT:          '/api/v1/chatbot/terminos',
}
