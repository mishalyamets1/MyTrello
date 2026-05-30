import { Request, Response } from "express";
import * as storage from '../models/storage';
import { AuthRequest } from "../middleware/auth";
export const getTasks = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const tasks = await storage.getTasks(userId)
    res.json({
        success: true,
        data: tasks
    })
}
export const addTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {title} = req.body

    if (!title) {
        return res.status(400).json({success: false, error: 'Title is required'})
    }

    const newTask = await storage.addTask(title, userId)
    res.json({
        success: true, 
        data: newTask
    })
}
export const updateTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    const updated = await storage.updateTask(id, req.body, userId)
    if (!updated) {
        return res.status(404).json({success: false, error: 'Task not found'})
    }
    res.json({success: true, data: updated})
}

export const deleteTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    await storage.deleteTask(id, userId)
    res.json({success: true})
}
export const moveTask = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {toColumnId, toIndex} = req.body
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    const parsedIndex = Number(toIndex)
    if (!id || !toColumnId || Number.isNaN(parsedIndex)) {
        return res.status(400).json({success: false, error: 'Invalid payload'})
    }
    await storage.moveTask(id, toColumnId, parsedIndex, userId)
    res.json({success: true})
}