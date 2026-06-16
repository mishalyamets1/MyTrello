import { Request, Response } from "express";
import * as storage from '../models/storage'
import { AuthRequest } from "../middleware/auth";

export const getAllColumns = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const { boardId } = req.query;
    if(!boardId) { 
        return res.status(400).json({success: false, error: 'boardId is required'})
    }

    const columns = await storage.getAllColumns(userId, String(boardId))
    res.json({
        success: true,
        data: columns
    })
}

export const createColumn = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {title} = req.body
    const { boardId } = req.query;
    if (!title) {
        return res.status(400).json({success: false, error: 'Title is required'})
    }
    if(!boardId) { 
        return res.status(400).json({success: false, error: 'boardId is required'})
    }
    const newColumn = await storage.createColumn(title.trim(), userId, String(boardId))

    res.json({success: true, data: {...newColumn , tasks: []}})
}

export const deleteColumn = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const { boardId } = req.query;

    if(!boardId) { 
        return res.status(400).json({success: false, error: 'boardId is required'})
    }
    await storage.deleteColumn(id, userId, String(boardId))
    res.json({success: true})
}

export const moveColumns = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!
    const {toIndex} = req.body;
    const { boardId } = req.query;
    const idParam = req.params.id;
    const parsedIndex = Number(toIndex)
    const id = Array.isArray(idParam) ? idParam[0] : idParam

    if (!id || Number.isNaN(parsedIndex)) {
        return res.status(400).json({success: false, error: 'Invalid column id or index'})
    }
    if(!boardId) { 
        return res.status(400).json({success: false, error: 'boardId is required'})
    }
    await storage.moveColumns(id, parsedIndex, userId, String(boardId))
    res.json({success: true})
}

