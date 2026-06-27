import { useAuthStore } from "@/stores/authStore";

const API = 'http://localhost:3001/api'

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
        try {
            const res = await fetch(`${API}/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            })
            const data = await res.json()
            if (!res.ok) {
                useAuthStore.getState().logout()
                return null
            }
            const newAccess = data.data.accessToken as string
            useAuthStore.setState({accessToken: newAccess})
            return newAccess
        } catch (e) {
            useAuthStore.getState().logout()
            return null
        } finally {
            refreshPromise = null
        }
    })()

    return refreshPromise
}

export async function apiFetch(
    path: string,
    options: RequestInit = {}
) : Promise<Response> {
    const {accessToken} = useAuthStore.getState()

    const headers = new Headers(options.headers)
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
    }
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json')
    }
    let res = await fetch(`${API}${path}`, {...options, headers})

    if (res.status === 401) {
        const clone = await res.clone().json().catch(() => ({}))
        const code = clone.error as string | undefined

        if (code === 'Token expired') {
            const newToken = await refreshAccessToken()

            if (!newToken) {
                return res
            }
            headers.set('Authorization', `Bearer ${newToken}`)
            res = await fetch(`${API}${path}`, {...options, headers})
        }
    }
    return res
}

export async function authFetch(
    path: string,
    options: RequestInit = {}
) : Promise<Response> {
    return fetch(`${API}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        }
    })
}