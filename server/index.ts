import express from "express";
import cors from 'cors'
import columnsRouter from './routes/columns';
import tasksRouter from './routes/tasks'
import authRouter from './routes/auth'
import boardRouter from './routes/boards'
import usersRouter from './routes/users'
import aiRouter from './routes/ai'
import { authMiddleware } from "./middleware/auth";
import { createServer } from "http";
import { attachWebSocket } from "./realtime";
import cookieParser from 'cookie-parser'

const app = express();

const PORT = 3001;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}))

app.use(cookieParser())

app.use(express.json({limit: '3mb'}))

app.use(express.json());
app.use('/api/auth', authRouter)
app.use('/api/columns', authMiddleware, columnsRouter)
app.use('/api/tasks', authMiddleware, tasksRouter)
app.use('/api/boards', authMiddleware, boardRouter)
app.use('/api/users', authMiddleware, usersRouter)
app.use('/api/ai', authMiddleware, aiRouter)

const server = createServer(app)
attachWebSocket(server)


server.listen(PORT, () => {
    console.log(`✅ server running on http://localhost:${PORT}`)
})