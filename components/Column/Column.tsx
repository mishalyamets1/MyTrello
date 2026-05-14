import React from 'react'
import styles from './Column.module.css'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import Task from '../Task'
import { useBoardStore } from '@/stores/boardStore'
import type { Column as ColumnType } from '@/stores/boardStore'
import { useDroppable } from '@dnd-kit/core'


export type ColumnProps = {
    column: ColumnType;
}

const Column = ({column}: ColumnProps) => {

    const {deleteColumn} = useBoardStore()
    const {setNodeRef} = useDroppable({
        id: column.id,
        data: {columnId: column.id}
    })

  return (
    <div className={styles.column} ref={setNodeRef}>
      <Card className={`${styles.column_card} border border-border ring-0 items-start`}>
            <div className={styles.column_header}>
                <div>{column.title}</div>
                <Button variant="destructive" size="sm" onClick={() => deleteColumn(column.id)}>Delete</Button>
                
            </div>
            <div className={styles.column_tasks}>
                {column.tasks.map((task) => (
                    <Task key={task.id} task={task} columnId={column.id}></Task>
                ))}
            </div>
        </Card>
    </div>
  )
}

export default Column