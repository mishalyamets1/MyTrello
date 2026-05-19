'use client'

import React, { useMemo, useState } from 'react'
import styles from './page.module.css'
import InBox from '@/components/InBox'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import Task from '@/components/Task'
import MainBoard from '@/components/MainBoard'
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, type DragCancelEvent } from '@dnd-kit/core'
import { useBoardStore } from '@/stores/boardStore'
import type { Task as TaskType } from '@/stores/boardStore'

const MainPage = () => {
  const { moveTask, inbox, columns } = useBoardStore()
  const [activeTask, setActiveTask] = useState<TaskType | null>(null)

  const taskIndex = useMemo(() => {
    const map = new Map<string, TaskType>()
    inbox.forEach((task) => map.set(task.id, task))
    columns.forEach((column) => column.tasks.forEach((task) => map.set(task.id, task)))
    return map
  }, [columns, inbox])

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id)
    setActiveTask(taskIndex.get(taskId) ?? null)
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveTask(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !moveTask) {
      setActiveTask(null)
      return
    }

    const taskId = String(active.id)
    const fromColumnId = String(active.data.current?.columnId || '')
    const toColumnId = String(over.data.current?.columnId || over.id)

    if (!fromColumnId || !toColumnId) {
      setActiveTask(null)
      return
    }

    moveTask(taskId, fromColumnId, toColumnId, 0)
    setActiveTask(null)
  }

  return (
    <div className={styles.mainPage}>
      <DndContext onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={300} minSize={300}>
            <InBox />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize={400}>
              <MainBoard />
          </ResizablePanel>
        </ResizablePanelGroup>
        <DragOverlay dropAnimation={null}>
          {activeTask ? <Task task={activeTask} columnId="overlay" draggable={false} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default MainPage