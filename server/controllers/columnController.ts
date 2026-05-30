import { Request, Response } from "express";
import * as storage from '../models/storage'
import { AuthRequest } from "../middleware/auth";

export const getAllColumns = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!

    const columns = await storage.getAllColumns(userId)
    res.json({
        success: true,
        data: columns
    })
}

export const createColumn = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {title} = req.body

    if (!title) {
        return res.status(400).json({success: false, error: 'Title is required'})
    }
    const newColumn = await storage.createColumn(title.trim(), userId)

    res.json({success: true, data: {...newColumn , tasks: []}})
}

export const deleteColumn = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    await storage.deleteColumn(id, userId)
    res.json({success: true})
    
}

export const moveColumns = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {toIndex} = req.body;
    const idParam = req.params.id;
    const parsedIndex = Number(toIndex)
    const id = Array.isArray(idParam) ? idParam[0] : idParam

    if (!id || Number.isNaN(parsedIndex)) {
        return res.status(400).json({success: false, error: 'Invalid column id or index'})
    }

    await storage.moveColumns(id, parsedIndex, userId)
    res.json({success: true})
}

