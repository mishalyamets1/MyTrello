import { Request, Response } from "express";
import * as storage from '../models/storage';
import { AuthRequest } from "../middleware/auth";

export const getBoards = async (req: AuthRequest, res: Response) => {
    const userId = req.userId
    try {
        const boards = await storage.getUserBoards(userId!)
        res.json({success: true, data: boards})
    } catch (e) {
        res.status(500).json({success: false, error: e})
    }
}

export const createBoard = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const {title} = req.body;

    if(!title) return res.status(400).json({success: false, error: 'Title is required'})

    try {
        const board = await storage.createBoard(title.trim(), userId!)
        res.json({success: true, data: board})
    } catch (e) {
        res.status(500).json({success: false, error: e})
    }
}

export const getBoard = async (req: AuthRequest, res: Response) => {
    const userId = req.userId
    const idParam = req.params.id;
    const boardId = Array.isArray(idParam) ? idParam[0] : idParam
    if (!boardId) return res.status(400).json({success: false, error: 'boardId is required'})
    
    try {
        const columns = await storage.getAllColumns(userId!, boardId);
        res.json({success: true, data: {boardId, columns}})
    } catch (e) {
        res.status(403).json({success: false, error: e})
    }
}

export const deleteBoard = async (req: AuthRequest, res: Response) => {
    const userId = req.userId
    const idParam = req.params.id;
    const boardId = Array.isArray(idParam) ? idParam[0] : idParam

    if (!boardId) return res.status(400).json({success: false, error: 'boardId is required'})
    
    try {
        await storage.deleteBoard(userId!, boardId)
        res.json({success: true})
    } catch (e) {
        res.status(500).json({success: false, error: e})
    }
}

export const addMember = async (req: AuthRequest, res: Response) => {
    const requsetingUserId = req.userId;
    const boardIdParam = req.params.id;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam
    const {email, role} = req.body

    if (!boardId || !email || !role) return res.status(400).json({success: false, error: 'boardId, email and role are required'})
    
    try {
       const member = await storage.addBoardMember(boardId, email, role, requsetingUserId!)
       res.json({success: true, data: member})
    } catch (e) {
        res.status(403).json({success: false, error: e})
    }
}

export const removeMember = async (req: AuthRequest, res: Response) => {
    const requsetingUserId = req.userId;
    const boardIdParam = req.params.id;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam
    const targetUserIdParam = req.params.userId;
    const targetId = Array.isArray(targetUserIdParam) ? targetUserIdParam[0] : targetUserIdParam

    if (!boardId || !targetId) return res.status(400).json({success: false, error: 'boardId and targetId are required'})

    try {
        await storage.removeBoardMember(boardId, targetId, requsetingUserId!)
        res.json({success: true})
    }
    catch (e) {
        res.status(403).json({success: false, error: e})
    }
}

export const changeMemberRole = async (req: AuthRequest, res: Response) => {
    const requestingUserId = req.userId
    const boardIdParam = req.params.id;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam
    const targetUserIdParam = req.params.userId;
    const targetId = Array.isArray(targetUserIdParam) ? targetUserIdParam[0] : targetUserIdParam
    const {role} = req.body;

    if (!boardId || !targetId || !role) return res.status(400).json({success: false, error: 'boardId, targetId, role are required'})
    
    try {
        const updated = await storage.changeMemberRole(boardId, targetId, role, requestingUserId!)
        res.json({ success: true, data: updated });
    } catch (e) {
        res.status(403).json({ success: false, error: e})
    }

}
export const getBoardMembers = async (req: AuthRequest, res: Response) => {
    const boardIdParam = req.params.id;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam
    const userId = req.userId

    if (!boardId) return res.status(400).json({success: false, error: 'boardId role are required'})

    try {
        const members = await storage.getBoardMembers(boardId, userId!)
        res.json({success: true, data: members})
    } catch (e) {
        res.status(403).json({success: false, error: e})
    }

}