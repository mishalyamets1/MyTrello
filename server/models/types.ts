export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  boardId: string;
  userId: string;
  done: boolean;
  tags: string[];
  createdAt: Date;
  position: number;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  boardId: string;
  userId: string;
}

export interface Board {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Date;
}

export interface BoardMember {
  boardId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: Date;
}

export interface BoardMemberWithEmail extends BoardMember {
    email: string;
    displayName: string | null;
    avatar: string | null;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatar: string | null;
  createdAt: Date;
}