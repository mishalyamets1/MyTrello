import e, { Request, Response } from "express";
import * as storage from '../models/storage';
import { AuthRequest } from "../middleware/auth";
import { broadcast } from "../realtime";
export const getTasks = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const { boardId } = req.query;

    if(!boardId) {
        return res.status(400).json({success: false, error: 'boardId is requierd'})
    }

    try {
        const tasks = await storage.getTasks(userId, String(boardId))
        res.json({
            success: true,
            data: tasks
        })
    } catch {
        res.status(403).json({success: false, error: 'Forbidden'})
    }


    
}
export const addTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {title} = req.body
    const { boardId } = req.query;

    if (!title || !boardId) {
        return res.status(400).json({success: false, error: 'Title and boardId is required'})
    }
    try {
        const newTask = await storage.addTask(title, userId, String(boardId))
        res.json({
            success: true, 
            data: newTask
        })
        broadcast({
            type: 'task:created',
            boardId: String(boardId),
            payload: newTask,
            actorUserId: userId
        })
    } catch (e) {
        res.json({success: false, error: String(e)})
    }
    
}
export const updateTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const idParam = req.params.id
    const { boardId } = req.query;
    const id = Array.isArray(idParam) ? idParam[0] : idParam

    if (!boardId) {
        return res.status(400).json({success: false, error: "boardId is requierd"})
    }
    try {
        const updated = await storage.updateTask(id, req.body, userId, String(boardId))
        if (!updated) {
            return res.status(404).json({success: false, error: 'Task not found'})
        }
        res.json({success: true, data: updated})
        broadcast({
            type: 'task:updated',
            boardId: String(boardId),
            payload: updated,
            actorUserId: userId
        })
    } catch (e) {
        res.json({success: false, error: String(e)})
    }
    
}

export const deleteTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const { boardId } = req.query;
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam

    if (!boardId) {
        return res.status(400).json({success: false, error: 'boardId is required'})
    }
    try {
        await storage.deleteTask(id, userId, String(boardId))
        res.json({success: true})
        broadcast({
            type: 'task:deleted',
            boardId: String(boardId),
            payload: {taskId: id},
            actorUserId: userId
        })
    } catch (e) {
        res.json({success: false, error: String(e)})
    }
    
}
export const moveTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {toColumnId, toIndex, boardId, fromColumnId} = req.body
    const inboxId = `inbox_${boardId}`
    const resolvedTo = toColumnId === 'inbox' ? inboxId : String(toColumnId)
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    const parsedIndex = Number(toIndex)
    if (!id || !toColumnId || Number.isNaN(parsedIndex)) {
        return res.status(400).json({success: false, error: 'Invalid payload'})
    }
    try {
        await storage.moveTask(id, resolvedTo, parsedIndex, userId, boardId)
        res.json({success: true})
        broadcast({
            type: 'task:moved',
            boardId: String(boardId),
            payload: {
                taskId: id,
                fromColumnId: String(fromColumnId),
                toColumnId: String(toColumnId),
                toIndex: parsedIndex,
            },
            actorUserId: userId
        })
    } catch (e) {
        res.json({success: false, error: String(e)})
    }
}

export const getArchive = async (req: AuthRequest, res: Response) => {
    const {boardId} = req.query
    if (!boardId) return res.status(400).json({success: false, error: 'boardId required'})
    try {
        const tasks = await storage.getArchivedTasks(req.userId!, String(boardId))
        res.json({success: true, data: tasks})
    } catch (e) {
        res.status(403).json({success: false, error: String(e)})
    }
}
export const completeTasks = async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id)
    const {boardId} = req.query
    try {
        const result = await storage.completeTask(id, req.userId!, String(boardId))
        res.json({success: true, data: result})
        broadcast({
            type: 'task:completed',
            boardId: String(boardId),
            payload: {taskId: id},
            actorUserId: req.userId!
        })
    } catch (e) {
        res.json({success: false, error: String(e)})
    }
}
export const restoreTask = async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id)
    const {boardId} = req.query

    try {
        await storage.restoreTask(id, req.userId!, String(boardId))
        broadcast({
            type: 'task:restored',
            boardId: String(boardId),
            payload: {taskId: id},
            actorUserId: req.userId!
        })
    } catch (e) {
        res.json({success: false, error: String(e)})
    }
}