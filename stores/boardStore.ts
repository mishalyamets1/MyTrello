import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { useAuthStore } from "./authStore";
import { Board, BoardMemberWithEmail } from "@/server/models/types";
import { toast } from "sonner";

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

    boards: Board[]
    currentBoardId: string | null;
    loadBoards: (preferredBoardId?: string) => Promise<void>;
    createBoard: (title: string) => Promise<void>;
    selectBoard: (boardId: string) => Promise<void>;
    deleteBoard: (boardId: string) => Promise<boolean>;

    members: BoardMemberWithEmail[];
    loadMembers: () => Promise<void>;
    inviteMember: (email: string, role: 'editor' | 'viewer') => Promise<boolean>;
    removeMember: (userId: string) => Promise<void>;
    changeMemberRole: (userId: string, role: 'editor' | 'viewer') => Promise<void>;

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
    boards: [],
    members:[],
    currentBoardId: null,

    async loadMembers() {
        const token = useAuthStore.getState().token;
        const boardId = get().currentBoardId
        if (!boardId) return

        const res = await fetch(`http://localhost:3001/api/boards/${boardId}/members`, {
            headers: {Authorization: `Bearer ${token}`}
        })
        const data = await res.json()
        if (data.success) set({members: data.data})
    },
    async inviteMember(email, role) {
        const token = useAuthStore.getState().token;
        const boardId = get().currentBoardId
        if (!boardId) return false
        const res = await fetch(`http://localhost:3001/api/boards/${boardId}/members`,{
            method: 'POST',
            headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
            body: JSON.stringify({email, role})
        })
        const data = await res.json()
        if (!data.success) {
            toast.error(String(data.error))
            return false
        }
        toast.success('Участник добавлен')
        await get().loadMembers()
        return true
    },
    async removeMember(userId) {
        const token = useAuthStore.getState().token;
        const boardId = get().currentBoardId;
        if (!boardId) return

        const res = await fetch(`http://localhost:3001/api/boards/${boardId}/members/${userId}`, {
            method: 'DELETE',
            headers: {Authorization: `Bearer ${token}`},
        })
        const data = await res.json();
        if (!data.success) {
            toast.error(String(data.error));
            return;
        }

        set((state) => ({members: state.members.filter((m) => m.userId !== userId)}))
        
    },
    async changeMemberRole(userId, role) {
        const token = useAuthStore.getState().token;
        const boardId = get().currentBoardId;
        if (!boardId) return;

        const res = await fetch(`http://localhost:3001/api/boards/${boardId}/members/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ role }),
        });

        const data = await res.json();
        if (!data.success) {
            toast.error(String(data.error));
            return;
        }

        await get().loadMembers();
    },
    async loadBoards(preferredBoardId) {
        const token = useAuthStore.getState().token;
        const res = await fetch('http://localhost:3001/api/boards',{
            headers: {Authorization: `Bearer ${token}`}
    })
        const data = await res.json()
        const boards = data.data ?? [];
        set({boards})

        const fromUrl = preferredBoardId ?? null;
        const validId = fromUrl && boards.some((b: Board) => b.id === fromUrl) ? fromUrl : null
        
        if (validId) {
            set({currentBoardId: validId})
            await get().loadData()
        } else if (boards[0]?.id) {
            await get().selectBoard(boards[0].id)
        } else {
            set({currentBoardId: null, columns: [], inbox: []})
        }
        
        
    },

    async selectBoard(boardId) {
        set({currentBoardId: boardId});
        await get().loadData()
    },

    async createBoard(title){
        const token = useAuthStore.getState().token;
        const res = await fetch('http://localhost:3001/api/boards',{
            method: 'POST',
            headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
            body: JSON.stringify({title})
        })
        const data = await res.json()
        if (data?.data) {
            set((state) => ({boards: [data.data, ...state.boards]}));
            await get().selectBoard(data.data.id)
        }
    },
    async deleteBoard(boardId){
        const token = useAuthStore.getState().token;
        const res = await fetch(`http://localhost:3001/api/boards/${boardId}`, {
            method: 'DELETE',
            headers: {"Content-type": "application/json", Authorization: `Bearer ${token}`},
        })
        const data = await res.json()

        if (!data.success) return false

        const wasCurrent = get().currentBoardId === boardId
        const remaining = get().boards.filter((b) => b.id !== boardId)

        if (wasCurrent) {
            if(remaining[0]?.id) {
                set({boards: remaining})
                await get().selectBoard(remaining[0].id)
            } else {
                set({boards: [], currentBoardId: null, columns: [], inbox: []})
            }
        } else {
            set({boards: remaining})
        }

        return wasCurrent
    },

    async loadData() {
        const token = useAuthStore.getState().token
        const boardId = get().currentBoardId;
        if (!boardId) return;
        const [colRes, tasksRes] = await Promise.all([
            fetch(`http://localhost:3001/api/columns?boardId=${boardId}`, {
                headers: {Authorization: `Bearer ${token}`},
            }),
            fetch(`http://localhost:3001/api/tasks/inbox?boardId=${boardId}`, {
                headers: {Authorization: `Bearer ${token}`},
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
        const boardId = get().currentBoardId
        if (!boardId) return
        if (!title) {
            toast.error("Введите название")
            return
        }
        const res = await fetch(`http://localhost:3001/api/tasks/inbox?boardId=${boardId}`, {
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
        const boardId = get().currentBoardId
        if (!boardId) return
        const res = await fetch(`http://localhost:3001/api/tasks/${taskId}?boardId=${boardId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
            body: JSON.stringify(updates)
        })

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
        const boardId = get().currentBoardId
        if (!boardId) return
        const res = await fetch(`http://localhost:3001/api/tasks/${taskId}?boardId=${boardId}`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
            body: JSON.stringify({})
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
        const boardId = get().currentBoardId
        try {
            const res = await fetch(`http://localhost:3001/api/tasks/${taskId}/move`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({fromColumnId, toColumnId, toIndex, boardId})
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
        const boardId = get().currentBoardId
        try {
            const res = await fetch(`http://localhost:3001/api/columns/${fromColumnId}/move?boardId=${boardId}`, {
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
        const boardId = get().currentBoardId
        if (!boardId) return
        if (!title) {
            toast.error("Введите название")
            return
        }
        const res = await fetch(`http://localhost:3001/api/columns?boardId=${boardId}`, {
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
        const boardId = get().currentBoardId
        if (!boardId) return
        const res = await fetch(`http://localhost:3001/api/columns/${columnId}?boardId=${boardId}`, {
            method: 'DELETE',
            headers: {'Content-Type' : 'application/json', Authorization: `Bearer ${token}`},
            body: JSON.stringify({})
        })
        const data = await res.json()
        if (data.success) {
            set((state) => ({
                columns: state.columns.filter((col) => col.id !== columnId)
            }))
        }
        
    }
}))
    
