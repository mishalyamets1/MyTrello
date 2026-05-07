import React from 'react'
import { Card } from '../ui/card'
import styles from './MainBoard.module.css'

const MainBoard = () => {
  return (
    <div className={styles.mainCard}>
        <Card className="border border-border ring-0" id='card'>
            MainBoard
        </Card>
    </div>
  )
}

export default MainBoard