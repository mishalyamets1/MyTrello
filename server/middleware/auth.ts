import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const SECRET = process.env.JWT_SECRET || 'your-key'

export interface AuthRequest extends Request {
    userId?: string
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
        return res.status(401).json({success: false, error: 'No token'})
    }
    try {
        const decoded = jwt.verify(token, SECRET) as {userId: string}
        req.userId = decoded.userId
        next()
    } catch (e) {
        res.status(401).json({success: false, error: `Invalid credentials: ${e}`})
    }
}
