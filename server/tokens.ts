import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import {v4 as uuidv4} from 'uuid'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev-access'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh'
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL ?? '15m'
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL ?? '7d'

export type RefreshPayload = {
    userId: string
    type: 'refresh'
    familyId: string
    jti: string
}
export type AccessPayload = {
    userId: string
    type: 'access'
    email: string
}

export function hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex')
}
export function signAccessToken(userId: string, email: string):string {
    const payload: AccessPayload = {userId, email, type: 'access'}
    return jwt.sign(payload, ACCESS_SECRET, {expiresIn: ACCESS_TTL as SignOptions['expiresIn']})
}
export function signRefreshToken(userId: string, familyId?: string) {
    const payload: RefreshPayload = {
        userId,
        type: 'refresh',
        familyId: familyId ?? uuidv4(),
        jti: uuidv4()
    }
    const token = jwt.sign(payload, REFRESH_SECRET, {expiresIn: REFRESH_TTL as SignOptions['expiresIn']})
    return {token, payload}
}

export function verifyAccessToken(token: string): AccessPayload {
    const decoded = jwt.verify(token, ACCESS_SECRET) as AccessPayload
    if (decoded.type !== 'access') {
        throw new Error('Wrong token type')
    }
    return decoded
}
export function verifyRefreshToken(token: string) : RefreshPayload {
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshPayload
    if (decoded.type !== 'refresh') {
        throw new Error('Wrong token type')
    }
    return decoded
}
export function isTokenExpired(err: unknown): boolean {
    return err instanceof jwt.TokenExpiredError
}
