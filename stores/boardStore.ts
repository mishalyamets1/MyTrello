import { create } from "zustand";

export interface Task {
    id: string;
    title: string;
    description: string;
    tags: string[];
    done: boolean;
    createdAt: Date;
}
export interface Column {
    id: string;
    title: string;
    tasks: Task[];
}

export interface BoardStore {
    columns: Column[];
    inbox: Task[];

    addTaskToInbox: (title: string) => void;
    deleteTask: (taskId: string) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    moveTask?: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void;
    addColumn: (title: string) => void;
    deleteColumn: (columnId: string) => void;
    loadData: () => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
    columns: [],
    inbox: [],

    async loadData() {
        const [colRes, tasksRes] = await Promise.all([
            fetch('http://localhost:3001/api/columns'),
            fetch('http://localhost:3001/api/tasks/inbox')
        ]);
        const columns = await colRes.json();
        const tasks = await tasksRes.json()

        set({
            columns: columns.data,
            inbox: tasks.data
        });
    },
   
    addTaskToInbox: async (title) => {
        const res = await fetch('http://localhost:3001/api/tasks/inbox', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title})
        })
        const data = await res.json()

        set((state) => ({
            inbox: [...state.inbox, data.data]
        }))
    },
    updateTask: async (taskId, updates) => {
        const res = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updates)
        })
        const data = await res.json()

        set((state) => ({
            inbox: state.inbox.map((task) =>
                task.id === taskId ? { ...task, ...updates } : task
            ),
            columns: state.columns.map((column) => ({
                ...column,
                tasks: column.tasks.map((task) =>
                    task.id === taskId ? { ...task, ...updates } : task
                )
            }))
        }))
    },
    deleteTask: async (taskId) => {
        const res = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({taskId})
        })
        const data = await res.json()
        if (data.success) {
            set((state) => ({
                inbox: state.inbox.filter((task) => task.id !== taskId),
                columns: state.columns.map((column) => ({
                    ...column,
                    tasks: column.tasks.filter((task) => task.id !== taskId)
                }))
            }))
        }
        
    },
    moveTask: async (taskId, fromColumnId, toColumnId, toIndex) => {
        const res = await fetch(`http://localhost:3001/api/tasks/${taskId}/move`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({fromColumnId, toColumnId, toIndex})
        })
        const data = await res.json()
        if (data.success){
set((state) => {
            const nextColumns = state.columns.map((column) => ({
                ...column,
                tasks: [...column.tasks]
            }))

            const getColumnTasks = (columnId: string) => {
                const column = nextColumns.find((item) => item.id === columnId)
                return column ? column.tasks : null
            }

            const fromList = fromColumnId === 'inbox'
                ? [...state.inbox]
                : getColumnTasks(fromColumnId)

            if (!fromList) {
                return state
            }

            const fromIndex = fromList.findIndex((task) => task.id === taskId)
            if (fromIndex === -1) {
                return state
            }

            const [movedTask] = fromList.splice(fromIndex, 1)

            const toList = toColumnId === 'inbox'
                ? fromColumnId === 'inbox'
                    ? fromList
                    : [...state.inbox]
                : getColumnTasks(toColumnId)

            if (!toList) {
                return state
            }

            const safeIndex = Math.max(0, Math.min(toIndex, toList.length))
            toList.splice(safeIndex, 0, movedTask)

            const nextInbox = toColumnId === 'inbox'
                ? toList
                : fromColumnId === 'inbox'
                    ? fromList
                    : state.inbox

            if (fromColumnId !== 'inbox') {
                const fromColumn = nextColumns.find((item) => item.id === fromColumnId)
                if (fromColumn) {
                    fromColumn.tasks = fromColumnId === toColumnId ? toList : fromList
                }
            }

            if (toColumnId !== 'inbox' && fromColumnId !== toColumnId) {
                const toColumn = nextColumns.find((item) => item.id === toColumnId)
                if (toColumn) {
                    toColumn.tasks = toList
                }
            }

            return {
                ...state,
                inbox: nextInbox,
                columns: nextColumns
            }
        }
    )}
    },
    addColumn: async (title) => {
        const res = await fetch('http://localhost:3001/api/columns', {
            method: 'POST', 
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({title})
        })
        const data = await res.json()

        set((state) => ({
            columns: [ ...state.columns, data.data]
        }))
    }, 
    deleteColumn: async (columnId) => {
        const res = await fetch(`http://localhost:3001/api/columns/${columnId}`, {
            method: 'DELETE',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({columnId})
        })
        const data = await res.json()
        if (data.success) {
            set((state) => ({
                columns: state.columns.filter((col) => col.id !== columnId)
            }))
        }
        
    }
}))
    
