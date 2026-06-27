import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { useAuthStore } from "./authStore";
import { Board, BoardMemberWithEmail} from "@/server/models/types";
import { toast } from "sonner";
import { BoardEvent } from "@/server/realtime";
import { apiFetch } from "@/lib/apiClient";

export interface Task {
    id: string;
    title: string;
    description: string;
    tags: string[];
    done: boolean;
    createdAt: Date;
    assigneeId: string | null;
    dueDate: string | null;
    priority: TaskPriority
}
export interface Column {
    id: string;
    title: string;
    tasks: Task[];
}
export type TaskFilter = 'all' | 'mine'

export type TaskPriority = 'low' | 'medium' | 'high'

export type EnhanceDescriptionMode = 'generate' | 'improve'

export type EnhanceDescriptionParams = {
    title: string
    description: string
    tags: string[]
    mode: EnhanceDescriptionMode
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

    archive: Task[];
    loadArchive: () => Promise<void>;
    completeTask: (taskId: string, fromColumnId: string) => Promise<void>
    restoreTask: (taskId: string) => Promise<void>

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

    taskFilter: TaskFilter,
    setTaskFilter: (filter: TaskFilter) => void;

    applyRemoteEvent: (event: BoardEvent) => void

    enhanceDescription: (params: EnhanceDescriptionParams) => Promise<string | null>

}

function getActorLabel(members: BoardMemberWithEmail[], actorUserId: string): string {
    const member = members.find((m) => m.userId === actorUserId)
    return member?.displayName?.trim() || member?.email || 'Другой участник'
}
function findTaskInState(
    state: { inbox: Task[]; columns: Column[] },
    taskId: string
  ): Task | undefined {
    const inInbox = state.inbox.find((t) => t.id === taskId)
    if (inInbox) return inInbox
    for (const column of state.columns) {
      const task = column.tasks.find((t) => t.id === taskId)
      if (task) return task
    }
    return undefined
}
function showRemoteActionToast(
    event: BoardEvent,
    state: { members: BoardMemberWithEmail[]; inbox: Task[]; columns: Column[]; archive: Task[] }
  ) {
    const actor = getActorLabel(state.members, event.actorUserId)
    switch (event.type) {
      case 'task:created': {
        const task = event.payload as Task
        toast.info(`${actor} добавил задачу «${task.title}»`)
        break
      }
      case 'task:updated': {
        const task = event.payload as Task
        toast.info(`${actor} обновил задачу «${task.title}»`)
        break
      }
      case 'task:deleted': {
        const { taskId } = event.payload
        const task = findTaskInState(state, taskId)
        const title = task ? ` «${task.title}»` : ''
        toast.info(`${actor} удалил задачу${title}`)
        break
      }
      case 'task:moved': {
        const { taskId } = event.payload
        const task = findTaskInState(state, taskId)
        const title = task ? ` «${task.title}»` : ''
        toast.info(`${actor} переместил задачу${title}`)
        break
      }
      case 'task:completed': {
        const {taskId} = event.payload
        const task = findTaskInState(state, taskId)
        const title = task ? `"${task.title}"` : ''
        toast.info(`${actor} завершил задачу "${title}"`)
        break
      }
      case 'task:restored': {
        const {taskId} = event.payload
        const task = state.archive.find((t) => t.id === taskId)
        const title = task ? `"${task.title}"` : ''
        toast.info(`${actor} восстановил задачу ${title}`)
         break
      }
      case 'column:created': {
        const column = event.payload as Column
        toast.info(`${actor} создал колонку «${column.title}»`)
        break
      }
      case 'column:deleted': {
        const { columnId } = event.payload
        const column = state.columns.find((c) => c.id === columnId)
        const title = column ? ` «${column.title}»` : ''
        toast.info(`${actor} удалил колонку${title}`)
        break
      }
      case 'column:moved': {
        const { columnId } = event.payload
        const column = state.columns.find((c) => c.id === columnId)
        const title = column ? ` «${column.title}»` : ''
        toast.info(`${actor} переместил колонку${title}`)
        break
      }
    }
  }
export const useBoardStore = create<BoardStore>((set, get) => ({
    columns: [],
    inbox: [],
    boards: [],
    members:[],
    currentBoardId: null,
    archive: [],
    taskFilter: 'all',

    enhanceDescription: async ({title, description, tags, mode}) => {
        if (!useAuthStore.getState().accessToken) {
            toast.error('Нужно войти в аккаунт')
            return null
        }

        try {
            const res = await apiFetch('/ai/enhance-description', {
                method: 'POST',
                body: JSON.stringify({title, description, tags, mode})
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Не удалось получить описание')
                return null
            }
            return data.data.description as string
        } catch {
            toast.error('Ollama недоступна')
            return null
        }
    },

    applyRemoteEvent(event) {
        showRemoteActionToast(event, get())
        switch (event.type) {
            case 'task:created': {
                const task = event.payload as Task
                set((state) => {
                    if (state.inbox.some((t) => t.id === task.id)) return state
                    return {inbox: [...state.inbox, task]}
                })
                break
            }
            case 'task:updated': {
                const task = event.payload as Task
                set((state) => ({
                    inbox: state.inbox.map((t) => (t.id === task.id ? {...t, ...task} : t)),
                    columns: state.columns.map((col) => ({
                        ...col,
                        tasks: col.tasks.map((t) => (t.id === task.id ? {...t, ...task} : t))
                    }))
                }))
                break
            }
            case 'task:deleted': {
                const {taskId} = event.payload
                set((state) => ({
                    inbox: state.inbox.filter((t) => t.id !== taskId),
                    columns: state.columns.map((col) => ({
                        ...col,
                        tasks: col.tasks.filter((t) => t.id !== taskId)
                    }))
                }))
                break
            }
            case 'task:moved': {
                const { taskId, fromColumnId, toColumnId, toIndex } = event.payload
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
                break
            }
            case 'column:created': {
                const column = event.payload as Column
                set((state) => {
                    if (state.columns.some((c) => c.id === column.id)) return state
                    return {columns: [...state.columns, column]}
                })
                break
            }
            case 'task:completed': {
                const {taskId} = event.payload
                set((state) => ({
                    inbox: state.inbox.filter((t) => t.id !== taskId),
                    columns: state.columns.map((col) => ({
                      ...col,
                      tasks: col.tasks.filter((t) => t.id !== taskId),
                    })),
                  }))
                break
            }
            case 'task:restored': {
                const {taskId} = event.payload
                set((state) => ({
                    archive: state.archive.filter((t) => t.id !== taskId)
                }))
                get().loadData()
                break
            }
            case 'column:deleted': {
                const {columnId} = event.payload
                set((state) => ({
                    columns: state.columns.filter((c) => c.id !== columnId)
                }))
                break
            }
            case 'column:moved': {
                const {columnId, toIndex} = event.payload
                set((state) => {
                    const fromIndex = state.columns.findIndex((c) => c.id === columnId)
                    if (fromIndex === -1) return state
                    return {columns: arrayMove(state.columns, fromIndex, toIndex)}
                })
                break
            }
        }

    },

    setTaskFilter(filter) {
       return set({taskFilter: filter})
    },
    
    async loadArchive() {
        const boardId = get().currentBoardId

        try {
            const res = await apiFetch(`/tasks/archive?boardId=${boardId}`)
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error('Нет прав на это действие')
            }
            set({archive: data.data ?? []})
        } catch {
            toast.error('Сетевая ошибка')
        }
    },

    async completeTask(taskId, fromColumnId) {
        const boardId = get().currentBoardId
        if (!boardId) return 
        
        set((state) => ({
            inbox: fromColumnId === 'inbox'
            ? state.inbox.filter((t) => t.id !== taskId)
            : state.inbox, columns: state.columns.map((col) => ({
                ...col,
                tasks: col.id === fromColumnId ? col.tasks.filter((t) => t.id !== taskId) : col.tasks,
            })),
        }))

        const res = await apiFetch(`/tasks/${taskId}/complete?boardId=${boardId}`, {
            method: 'POST',
            body: JSON.stringify({})
        })
        const data = await res.json()
        toast.success(`Задача выполнена и переведена в архив`)
        if (!res.ok || !data.success) {
            await get().loadData()
            toast.error(data.error || 'Не удалось завершить')
        }
    },

    async restoreTask(taskId) {
        const boardId = get().currentBoardId
        if (!boardId) return 

        set((state) => ({
            archive: state.archive.filter((t) => t.id !== taskId),
        }))

        const res = await apiFetch(`/tasks/${taskId}/restore?boardId=${boardId}`, {
            method: 'POST',
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
            await get().loadArchive()
            toast.error(data.error || 'Не удалосьв восстановить')
        }
        await get().loadData()
    },

    async loadMembers() {
        const boardId = get().currentBoardId
        if (!boardId) return

        const res = await apiFetch(`/boards/${boardId}/members`)
        const data = await res.json()
        if (data.success) set({members: data.data})
    },
    async inviteMember(email, role) {
        const boardId = get().currentBoardId
        if (!boardId) return false
        const res = await apiFetch(`/boards/${boardId}/members`, {
            method: 'POST',
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
        const boardId = get().currentBoardId;
        if (!boardId) return

        const res = await apiFetch(`/boards/${boardId}/members/${userId}`, {
            method: 'DELETE',
        })
        const data = await res.json();
        if (!data.success) {
            toast.error(String(data.error));
            return;
        }

        set((state) => ({members: state.members.filter((m) => m.userId !== userId)}))
        
    },
    async changeMemberRole(userId, role) {
        const boardId = get().currentBoardId;
        if (!boardId) return;

        const res = await apiFetch(`/boards/${boardId}/members/${userId}`, {
            method: 'PATCH',
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
        const res = await apiFetch('/boards')
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
        const res = await apiFetch('/boards', {
            method: 'POST',
            body: JSON.stringify({title})
        })
        const data = await res.json()
        if (data?.data) {
            set((state) => ({boards: [data.data, ...state.boards]}));
            await get().selectBoard(data.data.id)
        }
    },
    async deleteBoard(boardId){
        const res = await apiFetch(`/boards/${boardId}`, {
            method: 'DELETE',
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
        const boardId = get().currentBoardId;
        if (!boardId) return;
        const [colRes, tasksRes] = await Promise.all([
            apiFetch(`/columns?boardId=${boardId}`),
            apiFetch(`/tasks/inbox?boardId=${boardId}`),
        ]);
        const columns = await colRes.json();
        const tasks = await tasksRes.json()

        set({
            columns: columns.data ?? [],
            inbox: tasks.data ?? []
        });
        await get().loadMembers()
    },
   
    addTaskToInbox: async (title) => {
        const boardId = get().currentBoardId
        if (!boardId) return
        if (!title) {
            toast.error("Введите название")
            return
        }
        try {
            const res = await apiFetch(`/tasks/inbox?boardId=${boardId}`, {
                method: 'POST', 
                body: JSON.stringify({title})
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Нет прав на это действие')
                return
            }
            if (data?.data) {
                set((state) => ({
                    inbox: [...state.inbox, data.data]
                }))
            }
        } catch  {
            toast.error('Сетевая ошибка')
        }
        
    },
    updateTask: async (taskId, updates) => {
        const boardId = get().currentBoardId
        if (!boardId) return
        try {
            const res = await apiFetch(`/tasks/${taskId}?boardId=${boardId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Нет прав на это действие')
                return
            }
    
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
        } catch {
            toast.error('Сетевая ошибка')
        }
        
    },
    deleteTask: async (taskId) => {
        const boardId = get().currentBoardId
        if (!boardId) return
        try {
            const res = await apiFetch(`/tasks/${taskId}?boardId=${boardId}`, {
                method: 'DELETE',
                body: JSON.stringify({})
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Нет прав на это действие')
                return
            }
            if (data.success) {
                set((state) => ({
                    inbox: state.inbox.filter((task) => task.id !== taskId),
                    columns: state.columns.map((column) => ({
                        ...column,
                        tasks: column.tasks.filter((task) => task.id !== taskId)
                    }))
                }))
            }
        } catch {
            toast.error('Сетевая ошибка')
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

        const boardId = get().currentBoardId
        try {
            const res = await apiFetch(`/tasks/${taskId}/move`, {
                method: 'POST',
                body: JSON.stringify({fromColumnId, toColumnId, toIndex, boardId})
            })
            const data = await res.json()
            if (!data.success) {
                await get().loadData()
            }
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Нет прав на это действие')
                return
            }
        } catch {
            await get().loadData()
            toast.error('Сетевая ошибка')
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
        const boardId = get().currentBoardId
        try {
            const res = await apiFetch(`/columns/${fromColumnId}/move?boardId=${boardId}`, {
                method: 'POST',
                body: JSON.stringify({toIndex})
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Нет прав на это действие')
                return
            }
            if (!data.success) {
                await get().loadData()
            }
        } catch {
            toast.error('Сетевая ошибка')
        }
    },
    addColumn: async (title) => {
        const boardId = get().currentBoardId
        if (!boardId) return
        if (!title) {
            toast.error("Введите название")
            return
        }
        try {
            const res = await apiFetch(`/columns?boardId=${boardId}`, {
                method: 'POST', 
                body: JSON.stringify({title})
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Нет прав на это действие')
                return
            }
            set((state) => ({
                columns: [ ...state.columns, data.data]
            }))
        } catch {
            toast.error('Сетевая ошибка')
        }
        
    }, 
    deleteColumn: async (columnId) => {
        const boardId = get().currentBoardId
        if (!boardId) return
        
        try {
            const res = await apiFetch(`/columns/${columnId}?boardId=${boardId}`, {
                method: 'DELETE',
                body: JSON.stringify({})
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Нет прав на это действие')
            }
            if (data.success) {
                set((state) => ({
                    columns: state.columns.filter((col) => col.id !== columnId)
                }))
            }
        } catch {
            toast.error('Сетевая ошибка')
        }
    }
}))
    
