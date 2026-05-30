'use client'

import React, { useState } from 'react'
import { Card } from '../ui/card'
import styles from './MainBoard.module.css'
import Column from '../Column'
import { useBoardStore } from '@/stores/boardStore'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
const MainBoard = () => {
    const [inputValue, setInputValue] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const { columns, addColumn } = useBoardStore()

  return (
    
    <div className={styles.mainCard}>
        
        <Card className={`${styles.mainCard_inner} border border-border ring-0`}>
            <ScrollArea className={styles.mainBoard}>
                <SortableContext
                    items={columns.map((column) => `column-${column.id}`)}
                    strategy={horizontalListSortingStrategy}
                >
                    <div className={styles.columnsRow}>
                        {columns.map((column) => (
                            <Column key={column.id} column={column} />
                        ))}
                        <div className={styles.column_addTask}>
                            <Input
                                placeholder="Add a column"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setIsOpen(true)}
                                onBlur={() => setIsOpen(false)}
                            />
                            {isOpen && (
                                <div className={styles.column_addTaskBtns}>
                                    <Button variant="default" onMouseDown={() => {
                                        addColumn(inputValue);
                                        setIsOpen(false);
                                        setInputValue('');
                                    }}>Добавить</Button>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>Отмена</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </SortableContext>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </Card>
        
    </div>
    
  )
}

export default MainBoard