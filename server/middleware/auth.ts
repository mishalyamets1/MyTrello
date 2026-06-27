import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { isTokenExpired, verifyAccessToken } from '../tokens'

export interface AuthRequest extends Request {
    userId?: string
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
        return res.status(401).json({success: false, error: 'No token'})
    }
    try {
        const decoded = verifyAccessToken(token)
        req.userId = decoded.userId
        next()
    } catch (e) {
        if (isTokenExpired(e)) {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            })
        }
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        })
    }
}
