'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import styles from './page.module.css'
import InBox from '@/components/InBox'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import Task from '@/components/Task'
import MainBoard from '@/components/MainBoard'
import Column from '@/components/Column'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useBoardStore } from '@/stores/boardStore'
import type { Task as TaskType, Column as ColumnType } from '@/stores/boardStore'
import { useBoardRealtime } from '@/hooks/useBoardRealtime'
import { useIsMobile } from '@/hooks/useMediaQuery'

const MainPage = () => {
  const { moveTask, moveColumn, inbox, columns } = useBoardStore()
  const [activeTask, setActiveTask] = useState<TaskType | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null)
  const [inboxOpen, setInboxOpen] = useState(false)
  const isMobile = useIsMobile()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  const currentBoardId = useBoardStore((s) => s.currentBoardId)
  useBoardRealtime(currentBoardId)

  const taskIndex = useMemo(() => {
    const map = new Map<string, TaskType>()
    inbox.forEach((task) => {
      if (task) {
        map.set(task.id, task)
      }
    })
    columns.forEach((column) => {
      column.tasks.forEach((task) => {
        if (task) {
          map.set(task.id, task)
        }
      })
    })
    return map
  }, [columns, inbox])

  const columnIndex = useMemo(() => {
    const map = new Map<string, ColumnType>()
    columns.forEach((column) => map.set(column.id, column))
    return map
  }, [columns])

  const handleDragStart = (event: DragStartEvent) => {
    if (isMobile) return

    const activeType = event.active.data.current?.type

    if (activeType === 'column') {
      const columnId = String(event.active.data.current?.columnId || '')
      setActiveColumn(columnIndex.get(columnId) ?? null)
      setActiveTask(null)
      return
    }

    const taskId = String(event.active.id)
    setActiveTask(taskIndex.get(taskId) ?? null)
    setActiveColumn(null)
  }

  const handleDragCancel = () => {
    setActiveTask(null)
    setActiveColumn(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (isMobile) return

    const { active, over } = event
    const activeType = active.data.current?.type

    if (activeType === 'column') {
      if (!over || !moveColumn) {
        setActiveColumn(null)
        return
      }

      const fromColumnId = String(active.data.current?.columnId || '')
      const toColumnId = String(over.data.current?.columnId || '').trim()
        || String(over.id).replace(/^column-/, '')

      if (!fromColumnId || !toColumnId) {
        setActiveColumn(null)
        return
      }

      const overIndex = over.data.current?.sortable?.index
      const fallbackIndex = columns.findIndex((column) => `column-${column.id}` === String(over.id))
      const toIndex = typeof overIndex === 'number' ? overIndex : fallbackIndex

      if (toIndex === -1) {
        setActiveColumn(null)
        return
      }

      moveColumn(fromColumnId, toColumnId, toIndex)
      setActiveColumn(null)
      return
    }

    if (!over || !moveTask) {
      setActiveTask(null)
      return
    }

    const taskId = String(active.id)
    const fromColumnId = String(active.data.current?.columnId || '')
    const rawToColumnId = String(over.data.current?.columnId || over.id)
    const toColumnId = rawToColumnId.replace(/^column-/, '')

    if (!fromColumnId || !toColumnId) {
      setActiveTask(null)
      return
    }

    const getTaskList = (columnId: string) => {
      if (columnId === 'inbox') return inbox
      return columns.find((column) => column.id === columnId)?.tasks
    }

    const fromList = getTaskList(fromColumnId)
    const toList = getTaskList(toColumnId)

    if (!fromList || !toList) {
      setActiveTask(null)
      return
    }

    const activeIndex = active.data.current?.sortable?.index
    const fromIndex = typeof activeIndex === 'number'
      ? activeIndex
      : fromList.findIndex((task) => task.id === taskId)
    if (fromIndex === -1) {
      setActiveTask(null)
      return
    }

    const overIndex = over.data.current?.sortable?.index
    const toIndex = typeof overIndex === 'number'
      ? overIndex
      : toList.length

    moveTask(taskId, fromColumnId, toColumnId, toIndex)
    setActiveTask(null)
  }

  return (
    <div className={styles.mainPage}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        {isMobile && (
          <div className={styles.mobileToolbar}>
            <Button variant="outline" size="sm" onClick={() => setInboxOpen(true)}>
              <Image src="/inbox.svg" alt="" width={16} height={16} />
              InBox
            </Button>
          </div>
        )}

        {isMobile ? (
          <>
            <div className={styles.mainPage_board}>
              <MainBoard />
            </div>
            <Sheet open={inboxOpen} onOpenChange={setInboxOpen}>
              <SheetContent side="left" title="InBox">
                <div className={styles.inBoxDrawer}>
                  <InBox />
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <ResizablePanelGroup orientation="horizontal" className={styles.mainPage_board}>
            <ResizablePanel defaultSize="300px" minSize="250px">
              <InBox />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel minSize="400px">
              <MainBoard />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

        {!isMobile && (
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <Task task={activeTask} columnId="overlay" draggable={false} />
            ) : activeColumn ? (
              <Column column={activeColumn} draggable={false} droppable={false} />
            ) : null}
          </DragOverlay>
        )}
      </DndContext>
    </div>
  )
}

export default MainPage
