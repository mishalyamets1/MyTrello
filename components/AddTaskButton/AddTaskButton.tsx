import React from 'react'
import styles from './AddTaskButton.module.css'
import { Card } from '../ui/card'


const AddTaskButton = () => {
  return (
    <div className={styles.addTaskBtn}>
        <Card>
            + Add a task
        </Card>
    </div>
  )
}

export default AddTaskButton