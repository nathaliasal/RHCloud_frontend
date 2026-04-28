import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const AUTH_KEY = 'rhcloud.web.auth'

export const useAuthStore = create(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,

      setSession: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      clearUser: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: AUTH_KEY,
      partialize: (s) => ({
        user:         s.user,
        accessToken:  s.accessToken,
        refreshToken: s.refreshToken,
      }),
    },
  ),
)
