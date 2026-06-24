'use client'

import React, { useState } from 'react'
import { Card } from '../ui/card'
import styles from './InBox.module.css'
import Image from 'next/image'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import Task from '../Task'
import { useBoardStore, type Task as TaskType } from '@/stores/boardStore'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Archive from '../Archive'
import { useAuthStore } from '@/stores/authStore'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '../ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'


const InBox = () => {

    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const { addTaskToInbox, inbox, taskFilter, setTaskFilter } = useBoardStore()
    const {userId} = useAuthStore()
    const { setNodeRef } = useDroppable({
        id: 'inbox',
        data: { columnId: 'inbox' }
    })

    const filterTask = (task: TaskType) => {
       return taskFilter === 'all' || task.assigneeId === userId
    }
    
  return (
    <div className={styles.inBox}>
        <Card className={`${styles.card} border border-border ring-0`} id='card'>
            <div className={styles.inBox_header}>
                <div className={styles.inBox_headerLogo}>
                    <Image src="/inbox.svg" alt="inbox logo" width={16} height={16}></Image>
                    <div>InBox</div>
                    
                </div>
                <div className={styles.inBox_headerBtn}>
                    <Archive/>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className={styles.filterBtn} variant="outline" size="sm"><Image src='/ellipsis.svg' alt='' width={16} height={16}></Image></Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverHeader>
                                <PopoverTitle>
                                    Фильтры
                                </PopoverTitle>
                            </PopoverHeader>
                            <span>Показать только мои задачи?</span>
                            <Tabs value={taskFilter} onValueChange={(v) => setTaskFilter(v as 'all' | 'mine')}>
                                <TabsList>
                                    <TabsTrigger value='all'>Нет</TabsTrigger>
                                    <TabsTrigger value='mine'>Да</TabsTrigger>
                                </TabsList>
                                <TabsContent value='all'>Все</TabsContent>
                                <TabsContent value='mine'>Только мои задачи</TabsContent>
                                
                            </Tabs>
                        </PopoverContent>
                    </Popover>
                    
                </div>
            </div>
            <div className={styles.inBox_content}>
                <div className={styles.InBox_addItem}>
                    <Input
                     placeholder="Add a card"
                     value={inputValue}
                     onChange={(e) => setInputValue(e.target.value)}
                     onFocus={() => setIsOpen(true)}
                     onBlur={() => { 
                        setIsOpen(false)
                         setInputValue(''); 
                        }}
                      />
                      {isOpen && (
                        <div className={styles.InBox_addItemBtns}>
                            <Button variant="default" onMouseDown={() => {
                                addTaskToInbox(inputValue);
                                setIsOpen(false);
                                setInputValue('');
                            }}>Добавить</Button>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Отмена</Button>
                        </div>
                      )}
                </div>
                <SortableContext items={inbox.filter(filterTask).map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    <div className={styles.InBox_tasks} ref={setNodeRef}>
                        {inbox.filter(filterTask).length === 0 ? (
                            <div className={styles.InBox_empty}>Drop task here</div>
                        ) : (
                            inbox.filter(filterTask).map((task) => (
                                <Task key={task.id} task={task} columnId="inbox"></Task>
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>
        </Card>
    </div>
  )
}

export default InBox