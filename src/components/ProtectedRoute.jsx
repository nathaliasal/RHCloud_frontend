import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export function ProtectedRoute({ children }) {
  const { accessToken } = useAuthStore()
  if (!accessToken) return <Navigate to="/login" replace />
  return children
}
