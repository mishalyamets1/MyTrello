import { Request, Response } from "express";
import * as storage from '../models/storage'

export const getAllColumns = async (req: Request, res: Response) => {
    const columns = await storage.getAllColumns()
    res.json({
        success: true,
        data: columns
    })
}

export const createColumn = async (req: Request, res: Response) => {
    const {title} = req.body

    if (!title) {
        return res.status(400).json({success: false, error: 'Title is required'})
    }
    const newColumn = await storage.createColumn(title.trim())

    res.json({success: true, data: {...newColumn , tasks: []}})
}

export const deleteColumn = async (req: Request, res: Response) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    storage.deleteColumn(id)
    res.json({success: true})
    
}


