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
    deleteCardFromInbox?: (cardId: string) => void;
    updateInboxCard: (cardId: string, updates: Partial<Task>) => void;
    moveTask?: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
    inbox: [],

    columns: [
        {
            id: '1',
            title: 'To Do',
            tasks: []
        },

        {
            id: '2',
            title: 'In Progress',
            tasks: []
        },

        {
            id: '3',
            title: 'Done',
            tasks: []
        }
    ],
    addTaskToInbox: (title) => {
        console.log('Adding task:', title);
        set((state) => ({
            inbox: [
                ...state.inbox,
                {
                    id: Date.now().toString(),
                    title,
                    description: '',
                    tags: [],
                    done: false,
                    createdAt: new Date()
                }
            ]
        }))
    },
    updateInboxCard: (cardId, updates) => {
        set((state) => ({
            inbox: state.inbox.map((task) =>
                task.id === cardId ? { ...task, ...updates } : task
            )
        }))
    },
    deleteCardFromInbox: (cardId) => {
        set((state) => ({
            inbox: state.inbox.filter((task) => task.id !== cardId)
        }))
    },
    moveTask: (taskId, fromColumnId, toColumnId, toIndex) => {
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
        })
    }
}))
    
