import { Request, Response } from "express";
import * as storage from '../models/storage';

export const getTasks = async (req: Request, res: Response) => {
    const tasks = await storage.getTasks()
    res.json({
        success: true,
        data: tasks
    })
}
export const addTask = async (req: Request, res: Response) => {
    const {title} = req.body

    if (!title) {
        return res.status(400).json({success: false, error: 'Title is required'})
    }

    const newTask = await storage.addTask(title)
    res.json({
        success: true, 
        data: newTask
    })
}
export const updateTask = async (req: Request, res: Response) => {
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    const updated = await storage.updateTask(id, req.body)
    if (!updated) {
        return res.status(404).json({success: false, error: 'Task not found'})
    }
    res.json({success: true, data: updated})
}

export const deleteTask = async (req: Request, res: Response) => {
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    await storage.deleteTask(id)
    res.json({success: true})
}
export const moveTask = async (req: Request, res: Response) => {
    const {toColumnId} = req.body
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam
    await storage.moveTask(id, toColumnId)
    res.json({success: true})
}