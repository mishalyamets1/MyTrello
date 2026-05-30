import express from "express";
import cors from 'cors'
import columnsRouter from './routes/columns';
import tasksRouter from './routes/tasks'
import authRouter from './routes/auth'
import { authMiddleware } from "./middleware/auth";

const app = express();

const PORT = 3001;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json());
app.use('/api/auth', authRouter)
app.use('/api/columns', authMiddleware, columnsRouter)
app.use('/api/tasks', authMiddleware, tasksRouter)


app.listen(PORT, () => {
    console.log(`✅ server running on http://localhost:${PORT}`)
})