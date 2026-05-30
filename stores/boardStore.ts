import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { useAuthStore } from "./authStore";

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
    moveColumn: (fromColumnId: string, toColumnId: string, toIndex: number) => void;
    addColumn: (title: string) => void;
    deleteColumn: (columnId: string) => void;
    loadData: () => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
    columns: [],
    inbox: [],

    async loadData() {
        const token = useAuthStore.getState().token
        const [colRes, tasksRes] = await Promise.all([
            fetch('http://localhost:3001/api/columns', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),
            fetch('http://localhost:3001/api/tasks/inbox', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        ]);
        const columns = await colRes.json();
        const tasks = await tasksRes.json()

        set({
            columns: columns.data ?? [],
            inbox: tasks.data ?? []
        });
    },
   
    addTaskToInbox: async (title) => {
        const token = useAuthStore.getState().token
        const res = await fetch('http://localhost:3001/api/tasks/inbox', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
            body: JSON.stringify({title})
        })
        const data = await res.json()

        if (data?.data) {
            set((state) => ({
                inbox: [...state.inbox, data.data]
            }))
        }
    },
    updateTask: async (taskId, updates) => {
        const token = useAuthStore.getState().token
        const res = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
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
        const token = useAuthStore.getState().token
        const res = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
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
        const applyMove = (state: BoardStore) => {
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

        set((state) => applyMove(state))

        const token = useAuthStore.getState().token
        try {
            const res = await fetch(`http://localhost:3001/api/tasks/${taskId}/move`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({fromColumnId, toColumnId, toIndex})
            })
            const data = await res.json()
            if (!data.success) {
                await get().loadData()
            }
        } catch (error) {
            await get().loadData()
        }
    },
    moveColumn: async (fromColumnId, toColumnId, toIndex) => {
        if (fromColumnId === toColumnId || toIndex < 0) return

        set((state) => {
            const fromIndex = state.columns.findIndex((column) => column.id === fromColumnId)

            if (fromIndex === -1 || toIndex === -1) {
                return state
            }

            return {
                ...state,
                columns: arrayMove(state.columns, fromIndex, toIndex)
            }
        })
        const token = useAuthStore.getState().token
        try {
            const res = await fetch(`http://localhost:3001/api/columns/${fromColumnId}/move`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({toIndex})
            })
            const data = await res.json()

            if (!data.success) {
                await get().loadData()
            }
        } catch (e) {
            get().loadData()
        }
    },
    addColumn: async (title) => {
        const token = useAuthStore.getState().token
        const res = await fetch('http://localhost:3001/api/columns', {
            method: 'POST', 
            headers: {'Content-Type' : 'application/json', Authorization: `Bearer ${token}`},
            body: JSON.stringify({title})
        })
        const data = await res.json()

        set((state) => ({
            columns: [ ...state.columns, data.data]
        }))
    }, 
    deleteColumn: async (columnId) => {
        const token = useAuthStore.getState().token
        const res = await fetch(`http://localhost:3001/api/columns/${columnId}`, {
            method: 'DELETE',
            headers: {'Content-Type' : 'application/json', Authorization: `Bearer ${token}`},
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
    
