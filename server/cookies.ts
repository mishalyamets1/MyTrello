import {Response} from 'express'

const COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken'

const REFRESH_PATH = '/api/auth'

export const setRefreshCookie = (res: Response, rawToken: string) => {
    const maxAge = 7 * 24 * 60 * 60 * 1000
    res.cookie(COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: REFRESH_PATH
    })
}

export const clearRefreshCookie = (res: Response) =>  {
    res.clearCookie(COOKIE_NAME, {path: REFRESH_PATH})
}
export const getRefreshFromCookie = (req: {cookies?: Record<string, string>}) => {
    return req.cookies?.[COOKIE_NAME] ?? null
}
