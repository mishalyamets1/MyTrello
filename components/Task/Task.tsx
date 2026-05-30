'use client'

import React, { useMemo, useState } from 'react'
import { useBoardStore } from '@/stores/boardStore'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import styles from './Task.module.css'
import type { Task } from '@/stores/boardStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
export type TaskProps = {
  task: Task;
  columnId: string;
  draggable?: boolean;
}

const Task = ({ task, columnId, draggable = true }: TaskProps) => {
  const { updateTask, deleteTask } = useBoardStore()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [tagsInput, setTagsInput] = useState(task.tags.join(', '))

  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: task.id,
    data: { columnId, type: 'task' },
    disabled: !draggable
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : undefined
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description || '')
      setTagsInput(task.tags.join(', '))
    }
    setIsOpen(open)
  }

  const parsedTags = useMemo(() => {
    return tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }, [tagsInput])

  const handleSave = () => {
    const trimmedTitle = title.trim()
    updateTask(task.id, {
      title: trimmedTitle.length > 0 ? trimmedTitle : task.title,
      description: description.trim(),
      tags: parsedTags
    })
    handleOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className={styles.task} ref={setNodeRef} style={style}>
        <DialogTrigger asChild>
          <Card className={styles.task_card}>
            <div className={styles.task_header}>
              {draggable ? (
                <button
                  type="button"
                  className={styles.task_dragHandle}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  {...listeners}
                  {...attributes}
                >
                  ::
                </button>
              ) : null}
              {task.tags.length === 0 ? (
                <Badge variant="outline">no tags</Badge>
              ) : (
                task.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))
              )}
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
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Update title, description, and tags.</DialogDescription>
        </DialogHeader>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags (comma separated)"
        />
        <div className={styles.task_header}>
          {parsedTags.length === 0 ? (
            <Badge variant="outline">no tags</Badge>
          ) : (
            parsedTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))
          )}
        </div>
        <div className={styles.task_dialogActions}>
          <Button variant="destructive" onClick={() => deleteTask(task.id)}>
            Delete
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Task