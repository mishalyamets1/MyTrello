'use client'
import { useAuthStore } from "@/stores/authStore"
import { useBoardStore } from "@/stores/boardStore"
import { useEffect, useRef } from "react"

const WS_URL = 'ws://localhost:3001'

export function useBoardRealtime(boardId: string | null) {
    const token = useAuthStore((s) => s.accessToken)
    const applyRemoteEvent = useBoardStore((s) => s.applyRemoteEvent)
    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        if (!boardId || !token) {
            return
        }
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            ws.send(JSON.stringify({type: 'auth', token}))
            ws.send(JSON.stringify({type: 'join', boardId}))
        }
        ws.onmessage = (e) => {
            const event = JSON.parse(e.data)
            applyRemoteEvent(event)
        }
        ws.onclose = () => {

        }
        return () => {
            ws.close()
            wsRef.current = null
        }

    },[boardId, token, applyRemoteEvent])
}