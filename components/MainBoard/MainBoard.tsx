'use client'

import React from 'react'
import { Card } from '../ui/card'
import styles from './MainBoard.module.css'
import Column from '../Column'
import { useBoardStore } from '@/stores/boardStore'

const MainBoard = () => {

    const { columns } = useBoardStore()

  return (
    <div className={styles.mainCard}>
        <Card className={`${styles.mainCard_inner} border border-border ring-0`}>
            {columns.map((column) => (
                <Column key={column.id} column={column} />
            ))}
        </Card>
    </div>
  )
}

export default MainBoard