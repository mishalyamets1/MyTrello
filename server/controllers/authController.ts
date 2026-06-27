import { Request, Response } from "express";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as storage from '../models/storage'
import {v4 as uuidv4} from 'uuid'
import { validateAvatar, validateDisplayName } from "../utills/userUpdate";
import { isTokenExpired, signAccessToken, signRefreshToken, verifyRefreshToken } from "../tokens";
import { clearRefreshCookie, getRefreshFromCookie, setRefreshCookie } from "../cookies";
import { error } from "node:console";
const SECRET = process.env.JWT_SECRET || 'your-key'

export const issueSession = async (
    res: Response,
    user: {id: string; email: string, display_name?: string; avatar?: string | null}
) => {
    const accessToken = signAccessToken(user.id, user.email)

    const {token: refreshToken, payload} = signRefreshToken(user.id)

    const decoded = jwt.decode(refreshToken) as {exp: number}
    const expiresAt = new Date(decoded.exp * 1000)

    await storage.saveRefreshToken({
        id: uuidv4(),
        userId: user.id,
        rawToken: refreshToken,
        familyId: payload.familyId,
        expiresAt
    })

    setRefreshCookie(res, refreshToken)

    const publicUser = {
        id: user.id,
        email: user.email,
        displayName: user.display_name ?? '',
        avatar: user.avatar ?? null
    }

    return {accessToken, userId: user.id, user: publicUser}
}

export const register = async (req: Request, res: Response) => {
    try {
        const {email, password, displayName, avatar} = req.body;

        if (!email || !password) {
            return res.status(400).json({success: false, error: 'Email and password required'})
        }

        const existing = await storage.getUserByEmail(email)

        if (existing) {
            return res.status(400).json({success: false, error: 'User already exists'})
        }

        const validDisplayName = validateDisplayName(displayName)
        const validAvatar = validateAvatar(avatar)

        const hashedPassword = await bcrypt.hash(password, 10)
        const id = uuidv4();
        const user = await storage.createUser(id, email, hashedPassword, validDisplayName, validAvatar)
        await storage.createBoard('My Board', user.id)
        const session = await issueSession(res, user)

        res.json({success: true, data: session})
    } catch (e) {
        res.status(500).json({success: false, error: `Server error: ${e}`})
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
           return  res.status(400).json({success: false, error: 'Email and password required'})
        }
        const user = await storage.getUserByEmail(email)
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({success: false, error: 'Invalid credentials'})
        }
        const session = await issueSession(res, user)
        res.json({success: true, data: session})

    } catch (e) {
        res.status(500).json({success: false, error: `Server error: ${e}`})
    }
}

export const refresh = async (req: Request, res: Response) => {
    const rawRefresh = getRefreshFromCookie(req)

    if (!rawRefresh) {
        return res.status(401).json({
            success: false, error: 'No refresh token'
        })
    }

    try {
        const payload = verifyRefreshToken(rawRefresh)

        const revoked = await storage.findRevokedRefresh(rawRefresh)
        if (revoked) {
            await storage.revokeRefreshFamily(revoked.family_id)
            clearRefreshCookie(res)
            return res.status(401).json({
                success: false,
                error: 'Refresh reuse detected'
            })
        }
        const row = await storage.findActiveRefresh(rawRefresh)
        if (!row) {
            clearRefreshCookie(res)
            return res.status(401).json({success: false, error: 'Invalid refresh token'})
        }
        await storage.revokeRefreshToken(rawRefresh)

        const user = await storage.getUserById(payload.userId)
        if (!user) {
            clearRefreshCookie(res)
            return res.status(401).json({success: false, error: 'User not found'})
        }
        const accessToken = signAccessToken(user.id, user.email)
        const {token: newRefresh, payload: newPayload} = signRefreshToken(user.id, payload.familyId)
        const decoded = jwt.decode(newRefresh) as {exp: number}
        await storage.saveRefreshToken({
            id: uuidv4(),
            userId: user.id,
            rawToken: newRefresh,
            familyId: newPayload.familyId,
            expiresAt: new Date(decoded.exp * 1000)
        })
        setRefreshCookie(res, newRefresh)
        res.json({
            success: true,
            data: {accessToken}
        })
    } catch (e) {
        clearRefreshCookie(res)
        if (isTokenExpired(e)) {
            return res.status(401).json({success: false, error: 'Refresh expired'})
        }
        return res.status(401).json({success: false, error: 'Invalid refresh token'})
    }
}
export const logout = async (req: Request, res: Response) => {
    const rawRefresh = getRefreshFromCookie(req)
    if (rawRefresh) {
        await storage.revokeRefreshToken(rawRefresh)
    }
    clearRefreshCookie(res)
    res.json({success: true})
}