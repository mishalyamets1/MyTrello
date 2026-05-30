import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'
import {toast} from "sonner"
type AuthState = {
    token: string | null,
    userId: string | null,
    login: (email: string, password: string) => Promise<void>,
    register: (email: string, password: string) => Promise<void>,
    logout: () => void,
    isHydrated: boolean,
    setHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            userId: null,
            isHydrated: false,
            setHydrated: (v) => set({isHydrated: v}),

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
                toast.success('Вход успешный')
                }
                catch {
                    toast.error('Сетевая ошибка')
                }
                
                
            },
            register: async (email, password) => {
                try {
                    const res = await fetch('http://localhost:3001/api/auth/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password})
                })

                const data = await res.json()
                if (!res.ok) {
                    toast.error(data.error || 'Ошибка регистрации')
                    return
                }
                set({token: data.data.token, userId: data.data.userId})
                toast.success('Вход успешен!')
                }
                catch {
                    toast.error('Сетевая ошибка')
                }
            },
            logout: () => {
                set({token: null, userId: null})
            }
        }),
        {
            name: 'auth',
            storage: createJSONStorage(()=> localStorage),
            partialize: (state) => ({token: state.token, userId: state.userId})
        }
    )
)

