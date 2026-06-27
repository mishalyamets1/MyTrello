import {Response} from 'express'
import {AuthRequest} from '../middleware/auth'
import * as storage from "../models/storage"
import { validateAvatar, validateDisplayName } from '../utills/userUpdate'
import bcrypt from 'bcryptjs'
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await storage.getUserById(req.userId!)
        if (!user) return res.status(404).json({success: false, error: "User not found"});
        res.json({success: true, data: user})
    } catch (e) {
        res.status(500).json({success: false, error: String(e)})
    }
}

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const {displayName, avatar} = req.body;

        const updates: {displayName?: string | null; avatar?: string | null} = {}

        if (displayName !== undefined) {
            updates.displayName = validateDisplayName(displayName)
        }
        if (avatar !== undefined) {
            updates.avatar = validateAvatar(avatar)
        }
        const user = await storage.updateUserProfile(req.userId!, updates);
        res.json({success: true, data: user})
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        res.status(400).json({success: false, error: message})
    }
}

export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const {oldPassword, newPassword} = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({success: false, error: "Both password required"})
        }
        if (newPassword.length < 6) {
            return res.status(400).json({success: false, error: "New password min 6 chars"})
        }

        const user = await storage.getUserById(req.userId!)

        if (!user) {
            return res.status(404).json({success: false, error: "User not found"})
        }

        const row = await storage.getUserByEmail(user.email);
        if (!row || !(await bcrypt.compare(oldPassword, row.password))) {
            res.status(401).json({success: false, error: "Wrong current password"})
        }

        const hashed = await bcrypt.hash(newPassword, 10)
        await storage.updateUserPassword(req.userId!, hashed)
        await storage.revokedAllUserRefreshTokens(req.userId!)
        res.json({success: true, data: {forceLogout: true}})

    } catch (e) {
        res.status(500).json({success: false, error: e})
    }
}
