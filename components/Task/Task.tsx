'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
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
import type { Task, TaskPriority } from '@/stores/boardStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Calendar } from '../ui/calendar'
import {format} from 'date-fns'
import {ru} from 'date-fns/locale'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/useMediaQuery'
export type TaskProps = {
  task: Task;
  columnId: string;
  draggable?: boolean;
}

const Task = ({ task, columnId, draggable = true }: TaskProps) => {
  const { updateTask, deleteTask, enhanceDescription, columns, moveTask } = useBoardStore()
  const [isOpen, setIsOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const isMobile = useIsMobile()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [tagsInput, setTagsInput] = useState(task.tags.join(', '))
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? null)
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)
  const [priority, setPriority] = useState<TaskPriority>(task.priority ?? 'medium')
  const [isEnhancing, setIsEnhancing] = useState(false)

  const {completeTask, restoreTask, members, loadMembers} = useBoardStore()

  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: task.id,
    data: { columnId, type: 'task' },
    disabled: !draggable || isMobile
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
      setAssigneeId(task.assigneeId ?? null)
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setPriority(task.priority ?? 'medium')
      loadMembers()
    }
    setIsOpen(open)
  }
  const selectedMember = useMemo(
    () => members.find((m) => m.userId === assigneeId),
    [members, assigneeId]
  )
  const parsedTags = useMemo(() => {
    return tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }, [tagsInput])

  const moveTargets = useMemo(() => {
    const targets: { id: string; title: string }[] = []
    if (columnId !== 'inbox' && columnId !== 'archive' && columnId !== 'overlay') {
      targets.push({ id: 'inbox', title: 'InBox' })
    }
    columns.forEach((column) => {
      if (column.id !== columnId) {
        targets.push({ id: column.id, title: column.title })
      }
    })
    return targets
  }, [columns, columnId])

  const handleMoveTo = (toColumnId: string) => {
    if (!moveTask) return

    const toList = toColumnId === 'inbox'
      ? useBoardStore.getState().inbox
      : columns.find((column) => column.id === toColumnId)?.tasks

    moveTask(task.id, columnId, toColumnId, toList?.length ?? 0)
    setMoveOpen(false)
    toast.success('Задача перемещена')
  }

  const handleSave = () => {
    const trimmedTitle = title.trim()
    updateTask(task.id, {
      title: trimmedTitle.length > 0 ? trimmedTitle : task.title,
      description: description.trim(),
      tags: parsedTags,
      assigneeId: assigneeId,
      dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
      priority: priority
    })
    handleOpenChange(false)
  }
  const handleToggleDone = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked && !task.done) {
      completeTask(task.id, columnId)
    }
  }


  const handleEnhaceDescription = async () => {
    setIsEnhancing(true)
    const result = await enhanceDescription({
      title,
      description, 
      tags: parsedTags,
      mode: description.trim() ? 'improve' : 'generate'
    })
    if (result) {
      setDescription(result)
      toast.success('Проверьте текст и нажмите Save')
    } 
    setIsEnhancing(false)
  }


  const isArchived = columnId === 'archive'
  const assignee = members.find((m) => m.userId === task.assigneeId)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className={styles.task} ref={setNodeRef} style={style}>
        <DialogTrigger asChild>
          <Card className={styles.task_card}>
            <div className={styles.task_header}>
              {draggable && !isMobile ? (
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
              {isMobile && draggable && columnId !== 'archive' && columnId !== 'overlay' && moveTargets.length > 0 ? (
                <Popover open={moveOpen} onOpenChange={setMoveOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className={styles.task_menuBtn}
                      aria-label="Переместить задачу"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Image src="/ellipsis.svg" alt="" width={16} height={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className={styles.moveMenu}
                    align="start"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <p className={styles.moveMenu_title}>Переместить в</p>
                    <div className={styles.moveMenu_list}>
                      {moveTargets.map((target) => (
                        <Button
                          key={target.id}
                          type="button"
                          variant="ghost"
                          className={styles.moveMenu_item}
                          onClick={() => handleMoveTo(target.id)}
                        >
                          {target.title}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
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
                checked={task.done}
                aria-label="Mark task done"
                onClick={(e) => e.stopPropagation()}
                onChange={handleToggleDone}
              />
              <p>{task?.title}</p>
              {task.dueDate && (
                <span className={styles.dueDate}>
                 {`До ${format(new Date(task.dueDate), 'd MMM', {locale: ru})}`}
                </span>
              )}
              {assignee && (
                <Avatar className={styles.taskAvatar} size='sm'>
                  {assignee.avatar && <AvatarImage src={assignee.avatar}/>}
                  <AvatarFallback>
                  {assignee.displayName?.[0] || assignee.email[0]}
                  </AvatarFallback>
                </Avatar>
              )}
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
          disabled={isEnhancing}
        />
        <Button variant='outline' onClick={handleEnhaceDescription} disabled={isEnhancing || !title.trim()} >
          {isEnhancing ? 'Генерирую' : description.trim() ? '✨ Улучшить' : '✨ Дописать'}
        </Button>
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
        <div className={styles.assigneeSection}>
          <span>Исполнитель</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' className={styles.pickMemberBtn}>
                {selectedMember ? (
                  <span className={styles.assigneeTrigger}>
                    <Avatar className={styles.assigneeAvatar}>
                        {selectedMember.avatar && (
                          <AvatarImage src={selectedMember.avatar} alt=''/>
                        )}
                        <AvatarFallback>
                        {selectedMember.displayName?.[0]?.toUpperCase()
                            || selectedMember.email[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {selectedMember.displayName || selectedMember.email}
                  </span>
                ) : (
                  'Назначить'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Command>
                <CommandInput placeholder="Поиск"/>
                <CommandEmpty>Не найдено</CommandEmpty>
                <CommandGroup>
                  <CommandItem value='none' onSelect={() => setAssigneeId(null)}>
                    Никто
                  </CommandItem>
                  {members.map((m) => (
                    <CommandItem key={m.userId} value={m.email} onSelect={() => setAssigneeId(m.userId)}>
                      <Avatar>
                        {m.avatar && <AvatarImage src={m.avatar} alt="" />}
                        <AvatarFallback>
                          {m.displayName?.[0]?.toUpperCase() || m.email[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {m.displayName || m.email}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Tabs value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <TabsList>
              <TabsTrigger value='low'>low</TabsTrigger>
              <TabsTrigger value='medium'>medium</TabsTrigger>
              <TabsTrigger value='high'>high</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div>
          <span>Срок</span>
          <Popover modal={false}>
            <PopoverTrigger asChild>
              <Button variant='outline'>
                  {dueDate
                  ? format(dueDate, 'd MMMM yyyy', {locale: ru})
                  : 'Выбрать дату'
                  }
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
              mode='single'
              selected={dueDate}
              onSelect={setDueDate}
              />
            </PopoverContent>
          </Popover>
          {dueDate && (
            <Button type='button'
            variant='outline'
            size='sm'
            onClick={() => setDueDate(undefined)}
            >
              Убрать дату
            </Button>
          )}
        </div>
        <div className={styles.task_dialogActions}>
          {isArchived && (
            <Button variant='secondary' onClick={() => {restoreTask(task.id); handleOpenChange(false)}}>Вернуть в Inbox</Button>
          )}
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