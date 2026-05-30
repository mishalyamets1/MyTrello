import { Request, Response } from "express";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as storage from '../models/storage'
import {v4 as uuidv4} from 'uuid'
const SECRET = process.env.JWT_SECRET || 'your-key'

export const register = async (req: Request, res: Response) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({success: false, error: 'Email and password required'})
        }

        const existing = await storage.getUserByEmail(email)

        if (existing) {
            return res.status(400).json({success: false, error: 'User already exists'})
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const id = uuidv4();
        const user = await storage.createUser(id, email, hashedPassword)
        const token = jwt.sign({userId: user.id, email: user.email}, SECRET, {expiresIn: '1d'})

        res.json({success: true, data: {token, userId: user.id}})
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
        const token = jwt.sign({userId: user.id, email: user.email}, SECRET, {expiresIn: '1d'})
        res.json({success: true, data: {token, userId: user.id}})

    } catch (e) {
        res.status(500).json({success: false, error: `Server error: ${e}`})
    }
}