import {WebSocketServer, WebSocket} from 'ws'
import type {Server} from 'http'
import jwt from 'jsonwebtoken'
import { checkBoardAccess } from './models/storage'
import { Task } from './models/types'

const SECRET = process.env.JWT_SECRET || 'your-key'

type Client = WebSocket & {
    userId?: string
    boardId?: string
}

export type BoardEvent = 
    | { type: 'task:created'; boardId: string; payload: unknown; actorUserId: string }
    | { type: 'task:updated'; boardId: string; payload: unknown; actorUserId: string }
    | { type: 'task:deleted'; boardId: string; payload: { taskId: string }; actorUserId: string }
    | { type: 'task:moved'; boardId: string; payload: {
        taskId: string
        fromColumnId: string
        toColumnId: string
        toIndex: number
      }; actorUserId: string }
    | { type: 'task:completed'; boardId: string; payload: { taskId: string }; actorUserId: string }
    | { type: 'task:restored'; boardId: string; payload: { taskId: string }; actorUserId: string }
    | { type: 'column:created'; boardId: string; payload: unknown; actorUserId: string }
    | { type: 'column:deleted'; boardId: string; payload: { columnId: string }; actorUserId: string }
    | { type: 'column:moved'; boardId: string; payload: {
        columnId: string
        toIndex: number
      }; actorUserId: string }

const rooms = new Map<string, Set<Client>>()

function joinRoom(client: Client, boardId: string) {
    if (client.boardId)  {
        rooms.get(client.boardId)?.delete(client)
    }
    client.boardId = boardId

    if (!rooms.has(boardId)) {
        rooms.set(boardId, new Set())
    }
    rooms.get(boardId)!.add(client)
}

function leaveRoom(client: Client) {
    if (!client.boardId) return 
    rooms.get(client.boardId)?.delete(client)
    client.boardId = undefined
}

export function broadcast(event: BoardEvent) {
    const clients = rooms.get(event.boardId)
    if (!clients) return

    const message = JSON.stringify(event)

    for (const client of clients) {
        const isOpen = client.readyState === WebSocket.OPEN
        const isNotActor = client.userId !== event.actorUserId
        if (isOpen && isNotActor) {
            client.send(message)
        }
    }
}

export function attachWebSocket(server: Server) {
    const wss = new WebSocketServer({server})

    wss.on('connection', (ws) => {
        const client = ws as Client

        client.on('message', async (raw) => {
            const msg = JSON.parse(String(raw))

            if (msg.type === 'auth') {
                const decoded = jwt.verify(msg.token, SECRET) as {userId: string}
                client.userId = decoded.userId
                return
            }
            if (msg.type === 'join') {
                if (!client.userId) return

                const boardId = String(msg.boardId)
                const ok = await checkBoardAccess(boardId, client.userId)
                if (!ok) return

                joinRoom(client, boardId)
            }
        })
        client.on('close', () => leaveRoom(client))
    })
}

