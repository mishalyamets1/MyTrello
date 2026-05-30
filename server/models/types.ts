export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  done: boolean;
  tags: string[];
  createdAt: Date;
  position: number;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}