import pool from "../db";
import {Column, Task} from "../models/types";

export const getAllColumns = async (userId: string) => {
    const columnsResult = await pool.query('SELECT * FROM columns WHERE id <> $1 AND user_id = $2 ORDER BY position ASC', ['inbox', userId]);
    const columns = columnsResult.rows

    const result = await Promise.all(
        columns.map(async (column) => {
            const tasksResult = await pool.query(
                'SELECT * FROM tasks WHERE column_id = $1 and user_id = $2 ORDER BY position ASC',
                [column.id, userId]
            )
            return {
                ...column,
                tasks: tasksResult.rows
            }
        })
    )
    return result;
};

export const moveColumns = async (id: string, toIndex: number, userId: string) => {
    await pool.query('BEGIN')

    const colRes = await pool.query(
        'SELECT position FROM columns WHERE id = $1 AND user_id = $2',
        [id, userId]
    )
    const col = colRes.rows[0]
    if (!col) {
        await pool.query('ROLLBACK');
        return;
    }
    if (toIndex === col.position) {
        await pool.query('COMMIT')
        return
    }
    if (toIndex > col.position) {
        await pool.query(
            'UPDATE columns SET position = position - 1 WHERE user_id = $1 AND position > $2 AND position <= $3',
            [userId, col.position, toIndex]
        )
    } else if (toIndex < col.position) {
        await pool.query(
            'UPDATE columns SET position = position + 1 WHERE user_id = $1 AND position >= $2 AND position < $3',
            [userId, toIndex, col.position]
        )
    }
    await pool.query(
        'UPDATE columns SET position = $1 WHERE id = $2 AND user_id = $3', [toIndex, id, userId]
    )

    await pool.query('COMMIT')
}

export const createColumn = async (title: string, userId: string): Promise<Column> => {

    const id = Date.now().toString()
    const result = await pool.query(
        'INSERT INTO columns (id, title, user_id) VALUES ($1, $2, $3) RETURNING *',
        [id, title, userId]
    )
    return result.rows[0]
}

export const deleteColumn = async (id: string, userId: string) => {
    await pool.query('DELETE FROM columns WHERE id = $1 AND user_id = $2', [id, userId])
}

export const getTasks = async (userId: string) => {
    const result = await pool.query('SELECT * FROM tasks where column_id = $1 and user_id = $2 ORDER BY position ASC' , ['inbox', userId])
    return result.rows
}

export const addTask = async (title: string, userId: string) => {
    const id = Date.now().toString();

    const posRes = await pool.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM tasks WHERE column_id = $1 AND user_id = $2',
        ['inbox', userId]
        )
        const position = Number(posRes.rows[0]?.pos ?? 0)
    const result = await pool.query(
        'INSERT INTO tasks (id, title, description, tags, done, user_id, column_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [id, title, '', '{}', false, userId, 'inbox', position]
    )
    return result.rows[0]
}

export const updateTask = async (taskId: string, updates: Partial<Task>, userId: string) => {
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

   const query = `UPDATE tasks SET ${setUpdates.join(', ')} WHERE id=$${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`

   const result = await pool.query(query, [...values, userId])
   return result.rows[0] || null

}

export const deleteTask = async (id: string, userId: string) => {
    await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId])
}

export const moveTask = async (id: string, toColumnId: string, toIndex: number, userId: string) => {
    await pool.query('BEGIN');

    const taskRes = await pool.query(
        'SELECT column_id, position FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]
    );
    const task = taskRes.rows[0];
    if (!task) {
        await pool.query('ROLLBACK');
        return;
    }

    const safeIndex = Math.max(0, toIndex)
    if (task.column_id === toColumnId && safeIndex === task.position) {
        await pool.query('COMMIT')
        return
    }

    await pool.query(
        `UPDATE tasks
        SET position = position - 1
        WHERE user_id = $1 AND column_id = $2 AND position > $3`,
        [userId, task.column_id, task.position]
    );

    await pool.query(
        `UPDATE tasks
        SET position = position + 1
        WHERE user_id = $1 AND column_id = $2 AND position >= $3`,
        [userId, toColumnId, safeIndex]
    );
    await pool.query(
        `UPDATE tasks
        SET column_id = $1, position = $2
        WHERE id = $3 AND user_id = $4`,
        [toColumnId, safeIndex, id, userId]
    );

    await pool.query('COMMIT');
}

export const getUserByEmail = async (email: string) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    return result.rows[0] || null
}

export const createUser = async (id: string, email: string, hashedPassword: string) => {
    const result = await pool.query(
        'INSERT INTO users (id, email, password) VALUES ($1, $2, $3) RETURNING id, email', [id, email, hashedPassword]
    )
    return result.rows[0]
}