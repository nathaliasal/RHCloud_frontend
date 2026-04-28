import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const Landing         = lazy(() => import('@/pages/Landing'))
const Login           = lazy(() => import('@/pages/auth/Login'))
const ResetPassword   = lazy(() => import('@/pages/auth/ResetPassword'))
const CompleteProfile = lazy(() => import('@/pages/auth/CompleteProfile'))
const Dashboard       = lazy(() => import('@/pages/admin/Dashboard'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
})

const router = createBrowserRouter([
  { path: '/',                element: <Landing /> },
  { path: '/login',           element: <Login /> },
  { path: '/reset-password',  element: <ResetPassword /> },
  {
    path: '/complete-profile',
    element: (
      <ProtectedRoute>
        <CompleteProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  )
}
