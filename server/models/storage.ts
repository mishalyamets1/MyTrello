import pool from "../db";
import {Column, Task} from "../models/types";

export const getAllColumns = async () => {
    const columnsResult = await pool.query('SELECT * FROM columns WHERE id <> $1', ['inbox']);
    const columns = columnsResult.rows

    const result = await Promise.all(
        columns.map(async (column) => {
            const tasksResult = await pool.query(
                'SELECT * FROM tasks WHERE column_id = $1',
                [column.id]
            )
            return {
                ...column,
                tasks: tasksResult.rows
            }
        })
    )
    return result;
};

export const createColumn = async (title: string): Promise<Column> => {

    const id = Date.now().toString()
    const result = await pool.query(
        'INSERT INTO columns (id, title) VALUES ($1, $2) RETURNING *',
        [id, title]
    )
    return result.rows[0]
}

export const deleteColumn = async (id: string) => {
    await pool.query('DELETE FROM columns WHERE id = $1', [id])
}

export const getTasks = async () => {
    const result = await pool.query('SELECT * FROM tasks where column_id = $1', ['inbox'])
    return result.rows
}

export const addTask = async (title: string) => {
    const id = Date.now().toString();
    const result = await pool.query(
        'INSERT INTO tasks (id, title, description, tags, done) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, title, '', '{}', false]
    )
    return result.rows[0]
}

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
   const setUpdates: string[] = []
   const values = []
   let paramIndex = 1;

   if (updates.title !== undefined) {
    setUpdates.push(`title = $${paramIndex}`)
    values.push(updates.title)
    paramIndex++
   }

   if (updates.description !== undefined) {
    setUpdates.push(`description = $${paramIndex}`)
    values.push(updates.description)
    paramIndex++
   }

   if (updates.done !== undefined) {
    setUpdates.push(`done = $${paramIndex}`)
    values.push(updates.done)
    paramIndex++
   }
   if (updates.tags !== undefined) {
    setUpdates.push(`tags = $${paramIndex}`)
    values.push(updates.tags)
    paramIndex++
   }

   if (setUpdates.length === 0 ) return null

   values.push(taskId)

   const query = `UPDATE tasks SET ${setUpdates.join(', ')} WHERE id=$${paramIndex} RETURNING *`

   const result = await pool.query(query, values)
   return result.rows[0] || null

}

export const deleteTask = async (id: string) => {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id])
}

export const moveTask = async (id: string, toColumnId: string) => {
    await pool.query(
        'UPDATE tasks SET column_id = $1 WHERE id = $2',
        [toColumnId, id]
    )
}