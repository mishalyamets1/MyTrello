import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'
import {toast} from "sonner"
type AuthState = {
    token: string | null,
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

const API = 'http://localhost:3001/api'

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            userId: null,
            user: null,
            isHydrated: false,
            setHydrated: (v) => set({isHydrated: v}),

            fetchProfile: async () =>  {
                const token = get().token
                if (!token) return 
                try {
                    const res = await fetch(`${API}/users/me`, {
                        headers: {Authorization: `Bearer ${token}`}
                    })
                    const data = await res.json()
                    if (res.ok) set({user: data.data})
                } catch {
                    
            }
            },
            updateProfile: async (updates) => {
                const token = get().token
                if (!token) return false
                try {
                    const res = await fetch(`${API}/users/me`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
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
                const token = get().token
                if (!token) return false
                try {
                    const res = await fetch(`${API}/users/me/password`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
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
                    const res = await fetch('http://localhost:3001/api/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password})
                })

                const data = await res.json()
                if (!res.ok) {
                    toast.error(data.error || 'Ошибка входа')
                    return
                }
                set({token: data.data.token, userId: data.data.userId})
                await get().fetchProfile()
                toast.success('Вход успешный')
                }
                catch {
                    toast.error('Сетевая ошибка')
                }
                
                
            },
            register: async (email, password, displayName, avatar) => {
                try {
                    const res = await fetch('http://localhost:3001/api/auth/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password, displayName, avatar})
                })

                const data = await res.json()
                if (!res.ok) {
                    toast.error(data.error || 'Ошибка регистрации')
                    return
                }
                set({token: data.data.token, userId: data.data.userId, user: data.data.user})
                toast.success('Вход успешен!')
                }
                catch {
                    toast.error('Сетевая ошибка')
                }
            },
            logout: () => {
                set({token: null, userId: null, user: null})
            }
        }),
        {
            name: 'auth',
            storage: createJSONStorage(()=> localStorage),
            partialize: (state) => ({token: state.token, userId: state.userId})
        }
    )
)

