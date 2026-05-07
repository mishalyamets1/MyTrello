'use client'

import { useBoardStore } from '@/stores/boardStore'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../ui/dialog'
import styles from './Task.module.css'
import type { Task } from '@/stores/boardStore'

type TaskProps = {
  task: Task;
}

const Task = ({ task }: TaskProps) => {


  return (
    <Dialog>
        <div className={styles.task}>
          <DialogTrigger asChild>
        <Card className={styles.task_card}>
            <div className={styles.task_header}>
                <Badge style={{backgroundColor: '#564b12'}} variant="outline" ></Badge>
                <Badge style={{backgroundColor: 'blue'}} variant="outline" ></Badge>
                <Badge style={{backgroundColor: 'pink'}} variant="outline" ></Badge>
            </div>
            <div className={styles.task_content}>
              <input
                type="checkbox"
                className={styles.task_checkbox}
                aria-label="Mark task done"
                onClick={(e) => e.stopPropagation()}
              />
              <p>{task?.title}</p>
            </div>
        </Card>
        </DialogTrigger>
    </div>
    <DialogContent>
      <DialogTitle></DialogTitle>
      <DialogDescription>
              
            </DialogDescription>
        <p>{task?.description}</p>
    </DialogContent>
      
    </Dialog>
    
  )
}

export default Task