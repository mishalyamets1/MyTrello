import React from 'react'
import styles from './Column.module.css'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import Task from '../Task'
import { useBoardStore } from '@/stores/boardStore'
import type { Column as ColumnType } from '@/stores/boardStore'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'


export type ColumnProps = {
    column: ColumnType;
    draggable?: boolean;
    droppable?: boolean;
}

const Column = ({column, draggable = true, droppable = true}: ColumnProps) => {

    const {deleteColumn} = useBoardStore()
    const {setNodeRef: setDropNodeRef} = useDroppable({
        id: column.id,
        data: {columnId: column.id},
        disabled: !droppable
    })

    const {
        setNodeRef: setSortNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: `column-${column.id}`,
        data: { type: 'column', columnId: column.id },
        disabled: !draggable
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined
    }

  return (
    <div className={styles.column} ref={setSortNodeRef} style={style}>
      <Card className={`${styles.column_card} border border-border ring-0 items-start`}>
            <div className={styles.column_header}>
                <div className={styles.column_title}>{column.title}</div>
                <button
                    type="button"
                    className={styles.column_dragHandle}
                    aria-label="Drag column"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    {...attributes}
                    {...listeners}
                >
                    ::
                </button>
                <Button variant="destructive" size="sm" onClick={() => deleteColumn(column.id)}>Delete</Button>
                
            </div>
            <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.column_tasks} ref={setDropNodeRef}>
                    {column.tasks.map((task) => (
                        <Task key={task.id} task={task} columnId={column.id}></Task>
                    ))}
                </div>
            </SortableContext>
        </Card>
    </div>
  )
}

export default Column