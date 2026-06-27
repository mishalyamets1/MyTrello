import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'
import {toast} from "sonner"
import { useBoardStore } from './boardStore'
import { apiFetch, authFetch } from '@/lib/apiClient'

type AuthState = {
    accessToken: string | null,
    userId: string | null,
    user: UserProfile | null
    login: (email: string, password: string) => Promise<void>,
    register: (email: string, password: string, displayName?: string, avatar?: string | null) => Promise<void>,
    logout: () => void,
    fetchProfile: () => Promise<void>
    updateProfile: (data: {displayName?: string; avatar?: string | null}) => Promise<boolean>
    changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
    isHydrated: boolean,
    setHydrated: (v: boolean) => void
}

type UserProfile = {
    id: string
    email: string
    displayName: string
    avatar: string | null
}

const resetBoardStore = () => {
    useBoardStore.setState({
        boards: [],
        currentBoardId: null,
        columns: [],
        inbox: [],
        members: []
    })
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            userId: null,
            user: null,
            isHydrated: false,
            setHydrated: (v) => set({isHydrated: v}),

            fetchProfile: async () => {
                const res = await apiFetch('/users/me')
                const data = await res.json()
                if (res.ok) set({user: data.data})
            },

            updateProfile: async (updates) => {
                if (!get().accessToken) return false
                try {
                    const res = await apiFetch('/users/me', {
                        method: 'PATCH',
                        body: JSON.stringify(updates)
                    })
                    const data = await res.json()
                    if (!res.ok) {
                        const message = typeof data.error === 'string'
                            ? data.error
                            : data.error?.message ?? 'Ошибка'
                        toast.error(message)
                        return false
                    }
                    set({user: data.data})
                    toast.success('Профиль обновлен')
                    return true
                } catch {
                    toast.error('Сетевая ошибка')
                    return false
                }
            },

            changePassword: async (oldPassword, newPassword) => {
                if (!get().accessToken) return false
                try {
                    const res = await apiFetch('/users/me/password', {
                        method: 'PATCH',
                        body: JSON.stringify({oldPassword, newPassword})
                    })
                    const data = await res.json()
                    if (!res.ok) {
                        toast.error(data.error || 'Ошибка')
                        return false
                    }
                    toast.success('Пароль обновлен')
                    return true
                } catch {
                    toast.error('Сетевая ошибка')
                    return false
                }
            },

            login: async (email, password) => {
                try {
                    const res = await authFetch('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({email, password})
                    })

                    const data = await res.json()
                    if (!res.ok) {
                        toast.error(data.error || 'Ошибка входа')
                        return
                    }
                    resetBoardStore()
                    set({accessToken: data.data.accessToken, userId: data.data.userId})
                    await get().fetchProfile()
                    toast.success('Вход успешный')
                } catch {
                    toast.error('Сетевая ошибка')
                }
            },

            register: async (email, password, displayName, avatar) => {
                try {
                    const res = await authFetch('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify({email, password, displayName, avatar})
                    })

                    const data = await res.json()
                    if (!res.ok) {
                        toast.error(data.error || 'Ошибка регистрации')
                        return
                    }
                    resetBoardStore()
                    set({accessToken: data.data.accessToken, userId: data.data.userId, user: data.data.user})
                    toast.success('Вход успешен!')
                } catch {
                    toast.error('Сетевая ошибка')
                }
            },

            logout: async () => {
                try {
                    await authFetch('/auth/logout', {method: 'POST'})
                } catch {}
                set({accessToken: null, userId: null, user: null})
                resetBoardStore()
            }
        }),
        {
            name: 'auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({accessToken: state.accessToken, userId: state.userId}),
            onRehydrateStorage: () => (state) => {
                if (!state) return
                const legacy = state as AuthState & { token?: string }
                if (!legacy.accessToken && legacy.token) {
                    state.accessToken = legacy.token
                }
            }
        }
    )
)
