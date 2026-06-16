import { Request, Response } from "express";
import * as storage from '../models/storage';
import { AuthRequest } from "../middleware/auth";
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
    
    const newTask = await storage.addTask(title, userId, String(boardId))
    res.json({
        success: true, 
        data: newTask
    })
}
export const updateTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const idParam = req.params.id
    const { boardId } = req.query;
    const id = Array.isArray(idParam) ? idParam[0] : idParam

    if (!boardId) {
        return res.status(400).json({success: false, error: "boardId is requierd"})
    }

    const updated = await storage.updateTask(id, req.body, userId, String(boardId))
    if (!updated) {
        return res.status(404).json({success: false, error: 'Task not found'})
    }
    res.json({success: true, data: updated})
}

export const deleteTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const { boardId } = req.query;
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam

    if (!boardId) {
        return res.status(400).json({success: false, error: 'boardId is required'})
    }

    await storage.deleteTask(id, userId, String(boardId))
    res.json({success: true})
}
export const moveTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {toColumnId, toIndex, boardId} = req.body
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    const parsedIndex = Number(toIndex)
    if (!id || !toColumnId || Number.isNaN(parsedIndex)) {
        return res.status(400).json({success: false, error: 'Invalid payload'})
    }
    await storage.moveTask(id, toColumnId, parsedIndex, userId, boardId)
    res.json({success: true})
}