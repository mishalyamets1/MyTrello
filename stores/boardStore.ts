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

    addTaskToInbox :(title: string, description: string) => void;
    deleteCardFromInbox?: (cardId: string) => void;
    updateInboxCard?: (cardId: string, updates: Partial<Task>) => void;
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
    addTaskToInbox: (title, description) => {
        set((state) => ({
            inbox: [
                ...state.inbox,
                {
                    id: Date.now().toString(),
                    title,
                    description: description,
                    tags: [],
                    done: false,
                    createdAt: new Date()
                }
            ]
        }))
    }
}))
    
