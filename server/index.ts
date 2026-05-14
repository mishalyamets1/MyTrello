import express from "express";
import cors from 'cors'

const app = express();

const PORT = 3001;

interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  done: boolean;
  tags: string[];
  createdAt: Date;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json());

let tasks: Task[] = []

let columns: Column[] = [
    {id: "1", title: "To do", tasks: []},
    {id: "2", title: "In progress", tasks: []},
    {id: "3", title: "Done", tasks: []}
]

app.get('/api/columns', (req, res) => {
    const columnsWithTasks = columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.columnId === column.id)
    }))
    res.json({success: true, data: columnsWithTasks})
})

app.post('/api/columns', (req, res) => {
    const {title} = req.body

    if (!title) {
        return res.status(400).json({success: false, error: 'Title is required'})
    }

    const newColumn = {
        id: Date.now().toString(),
        title,
        tasks: []
    }
    columns.push(newColumn);
    res.json({success: true, data: newColumn})
})

app.delete('/api/columns/:id', (req, res) => {
    columns = columns.filter(col => col.id !== req.params.id)
    res.json({success: true})
})


app.get('/api/tasks/inbox', (req, res) => {
    const inboxTasks = tasks.filter(t => t.columnId === 'inbox')
    res.json({success: true, data: inboxTasks})
})

app.post('/api/tasks/inbox', (req, res) => {
    const {title} = req.body;
    if (!title) {
        return res.status(400).json({success: false, error: 'Title is required'})
    }

    const newTask: Task = {
        id: Date.now().toString(),
            title,
            description: '',
            tags: [],
            done: false,
            createdAt: new Date(),
            columnId: 'inbox'
    }
    tasks.push(newTask)
    res.json({success: true, data: newTask})
})

app.put('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === req.params.id)

    if (!task) {
        return res.status(404).json({success: false, error: 'Task not found'})
    }

    Object.assign(task, req.body)
    res.json({success:true, data: task})
})

app.delete('/api/tasks/:id' , (req, res) => {
    tasks = tasks.filter(t => t.id !== req.params.id)
    res.json({success: true})
})

app.post('/api/tasks/:id/move', (req, res) => {
    const {toColumnId} = req.body;
    const task = tasks.find(t => t.id === req.params.id)

    if (task) {
        task.columnId = toColumnId
    }

    res.json({success: true})
})

app.listen(PORT, () => {
    console.log(`✅ server running on http://localhost:${PORT}`)
})