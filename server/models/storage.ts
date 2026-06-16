import pool from "../db";
import { Board, Column, Task, BoardMemberWithEmail, User } from "../models/types";

export const getAllColumns = async (userId: string, boardId: string) => {
    const hasAccess = await checkBoardAccess(boardId, userId);
    if (!hasAccess) {
        throw new Error("No access to this board");
    }

    const columnsResult = await pool.query(
        "SELECT * FROM columns WHERE board_id = $1 AND id NOT LIKE $2 ORDER BY position ASC",
        [boardId, "inbox%"]
    );
    const columns = columnsResult.rows;

    const result = await Promise.all(
        columns.map(async (column) => {
            const tasksResult = await pool.query(
                "SELECT * FROM tasks WHERE column_id = $1 AND board_id = $2 ORDER BY position ASC",
                [column.id, boardId]
            );
            return {
                id: column.id,
                title: column.title,
                boardId: column.board_id,
                userId: column.user_id,
                tasks: tasksResult.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    columnId: row.column_id,
                    boardId: row.board_id,
                    userId: row.user_id,
                    done: row.done,
                    tags: row.tags,
                    createdAt: row.created_at,
                    position: row.position,
                })),
            };
        })
    );
    return result;
};

export const moveColumns = async (id: string, toIndex: number, userId: string, boardId: string) => {
    const memberRes = await pool.query(
        "SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2",
        [boardId, userId]
    );
    if (!memberRes.rows[0] || memberRes.rows[0].role === "viewer") {
        throw new Error("No permission to move column");
    }

    await pool.query("BEGIN");

    const colRes = await pool.query(
        "SELECT position FROM columns WHERE id = $1 AND board_id = $2",
        [id, boardId]
    );
    const col = colRes.rows[0];
    if (!col) {
        await pool.query("ROLLBACK");
        return;
    }
    if (toIndex === col.position) {
        await pool.query("COMMIT");
        return;
    }
    if (toIndex > col.position) {
        await pool.query(
            "UPDATE columns SET position = position - 1 WHERE board_id = $1 AND position > $2 AND position <= $3",
            [boardId, col.position, toIndex]
        );
    } else if (toIndex < col.position) {
        await pool.query(
            "UPDATE columns SET position = position + 1 WHERE board_id = $1 AND position >= $2 AND position < $3",
            [boardId, toIndex, col.position]
        );
    }
    await pool.query("UPDATE columns SET position = $1 WHERE id = $2 AND board_id = $3", [
        toIndex,
        id,
        boardId,
    ]);

    await pool.query("COMMIT");
};

export const createColumn = async (title: string, userId: string, boardId: string): Promise<Column> => {
    const memberRes = await pool.query(
        "SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2",
        [boardId, userId]
    );
    if (!memberRes.rows[0] || memberRes.rows[0].role === "viewer") {
        throw new Error("No permission to create column");
    }

    const id = Date.now().toString();
    const posRes = await pool.query(
        "SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM columns WHERE board_id = $1 AND id NOT LIKE $2",
        [boardId, "inbox%"]
    );
    const position = Number(posRes.rows[0]?.pos ?? 0);

    const result = await pool.query(
        "INSERT INTO columns (id, title, user_id, board_id, position) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [id, title, userId, boardId, position]
    );
    const row = result.rows[0];
    return {
        id: row.id,
        title: row.title,
        boardId: row.board_id,
        userId: row.user_id,
        tasks: [],
    };
};

export const deleteColumn = async (id: string, userId: string, boardId: string) => {
    const memberRes = await pool.query(
        "SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2",
        [boardId, userId]
    );
    if (!memberRes.rows[0] || memberRes.rows[0].role === "viewer") {
        throw new Error("No permission to delete column");
    }

    await pool.query("DELETE FROM columns WHERE id = $1 AND board_id = $2", [id, boardId]);
};

export const getTasks = async (userId: string, boardId: string) => {
    const hasAccess = await checkBoardAccess(boardId, userId);
    if (!hasAccess) {
        throw new Error("No access to this board");
    }

    const inboxId = `inbox_${boardId}`;
    const result = await pool.query(
        "SELECT * FROM tasks WHERE column_id = $1 AND board_id = $2 ORDER BY position ASC",
        [inboxId, boardId]
    );
    return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        columnId: row.column_id,
        boardId: row.board_id,
        userId: row.user_id,
        done: row.done,
        tags: row.tags,
        createdAt: row.created_at,
        position: row.position,
    }));
};

export const addTask = async (title: string, userId: string, boardId: string) => {
    const memberRes = await pool.query(
        "SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2",
        [boardId, userId]
    );
    if (!memberRes.rows[0] || memberRes.rows[0].role === "viewer") {
        throw new Error("No permission to add task");
    }

    const id = Date.now().toString();
    const inboxId = `inbox_${boardId}`;

    const posRes = await pool.query(
        "SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM tasks WHERE column_id = $1 AND board_id = $2",
        [inboxId, boardId]
    );
    const position = Number(posRes.rows[0]?.pos ?? 0);

    const result = await pool.query(
        "INSERT INTO tasks (id, title, description, tags, done, user_id, column_id, board_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        [id, title, "", "{}", false, userId, inboxId, boardId, position]
    );
    const row = result.rows[0];
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        columnId: row.column_id,
        boardId: row.board_id,
        userId: row.user_id,
        done: row.done,
        tags: row.tags,
        createdAt: row.created_at,
        position: row.position,
    };
};

export const updateTask = async (
    taskId: string,
    updates: Partial<Task>,
    userId: string,
    boardId: string
) => {
    const memberRes = await pool.query(
        "SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2",
        [boardId, userId]
    );
    if (!memberRes.rows[0] || memberRes.rows[0].role === "viewer") {
        throw new Error("No permission to update task");
    }

    const setUpdates: string[] = [];
    const values = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
        setUpdates.push(`title = $${paramIndex}`);
        values.push(updates.title);
        paramIndex++;
    }

    if (updates.description !== undefined) {
        setUpdates.push(`description = $${paramIndex}`);
        values.push(updates.description);
        paramIndex++;
    }

    if (updates.done !== undefined) {
        setUpdates.push(`done = $${paramIndex}`);
        values.push(updates.done);
        paramIndex++;
    }
    if (updates.tags !== undefined) {
        setUpdates.push(`tags = $${paramIndex}`);
        values.push(updates.tags);
        paramIndex++;
    }

    if (setUpdates.length === 0) return null;

    values.push(taskId);
    values.push(boardId);

    const query = `UPDATE tasks SET ${setUpdates.join(", ")} WHERE id = $${paramIndex} AND board_id = $${paramIndex + 1} RETURNING *`;

    const result = await pool.query(query, values);
    const row = result.rows[0];
    return row
        ? {
              id: row.id,
              title: row.title,
              description: row.description,
              columnId: row.column_id,
              boardId: row.board_id,
              userId: row.user_id,
              done: row.done,
              tags: row.tags,
              createdAt: row.created_at,
              position: row.position,
          }
        : null;
};

export const deleteTask = async (id: string, userId: string, boardId: string) => {
    const memberRes = await pool.query(
        "SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2",
        [boardId, userId]
    );
    if (!memberRes.rows[0] || memberRes.rows[0].role === "viewer") {
        throw new Error("No permission to delete task");
    }

    await pool.query("DELETE FROM tasks WHERE id = $1 AND board_id = $2", [id, boardId]);
};

export const moveTask = async (
    id: string,
    toColumnId: string,
    toIndex: number,
    userId: string,
    boardId: string
) => {
    const memberRes = await pool.query(
        "SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2",
        [boardId, userId]
    );
    if (!memberRes.rows[0] || memberRes.rows[0].role === "viewer") {
        throw new Error("No permission to move task");
    }

    await pool.query("BEGIN");

    const taskRes = await pool.query(
        "SELECT column_id, position FROM tasks WHERE id = $1 AND board_id = $2",
        [id, boardId]
    );
    const task = taskRes.rows[0];
    if (!task) {
        await pool.query("ROLLBACK");
        return;
    }

    const safeIndex = Math.max(0, toIndex);
    if (task.column_id === toColumnId && safeIndex === task.position) {
        await pool.query("COMMIT");
        return;
    }

    await pool.query(
        "UPDATE tasks SET position = position - 1 WHERE board_id = $1 AND column_id = $2 AND position > $3",
        [boardId, task.column_id, task.position]
    );

    await pool.query(
        "UPDATE tasks SET position = position + 1 WHERE board_id = $1 AND column_id = $2 AND position >= $3",
        [boardId, toColumnId, safeIndex]
    );
    await pool.query(
        "UPDATE tasks SET column_id = $1, position = $2 WHERE id = $3 AND board_id = $4",
        [toColumnId, safeIndex, id, boardId]
    );

    await pool.query("COMMIT");
};

export const getUserByEmail = async (email: string) => {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
};
const mapUser = (row: Record<string, unknown>): User => ({
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    avatar: row.avatar as string,
    createdAt: row.created_at as Date
})
export const createUser = async (id: string, email: string, hashedPassword: string, displayName?: string | null, avatar?: string | null) => {
    const result = await pool.query(
        "INSERT INTO users (id, email, password, display_name, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, display_name, avatar, created_at",
        [id, email, hashedPassword, displayName ?? null, avatar ?? null]
    );
    return mapUser(result.rows[0]);
};
export const getUserById = async (id: string) => {
    const result = await pool.query(
        "SELECT id, email, display_name, avatar, created_at FROM users WHERE id = $1",
        [id]
    )
    return result.rows[0] ? mapUser(result.rows[0]) : null
}

export const updateUserProfile = async (id: string, updates: {displayName?: string | null; avatar?: string | null}): Promise<User | null> => {
    const setParts: string[] = []
    const values: unknown[] = []
    let i = 1;
    if (updates.displayName !== undefined) {
        setParts.push(`display_name = $${i++}`)
        values.push(updates.displayName)
    }
    if (updates.avatar !== undefined) {
        setParts.push(`avatar = $${i++}`)
        values.push(updates.avatar)
    }

    if (setParts.length === 0) return getUserById(id)

    values.push(id);
    const result = await pool.query(
        `UPDATE users SET ${setParts.join(", ")} WHERE id = $${i} RETURNING id, email, display_name, avatar, created_at`,
        values
    )
    return result.rows[0] ? mapUser(result.rows[0]) : null;
}
export const updateUserPassword = async (id: string, hashedPassword: string) => {
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id])
}
export const createBoard = async (title: string, userId: string): Promise<Board> => {
    const id = Date.now().toString();
    const result = await pool.query(
        "INSERT INTO boards (id, title, owner_id) VALUES ($1, $2, $3) RETURNING *",
        [id, title, userId]
    );
    const board = result.rows[0];

    await pool.query("INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)", [
        id,
        userId,
        "owner",
    ]);

    const inboxId = `inbox_${id}`;
    await pool.query("INSERT INTO columns (id, title, user_id, board_id) VALUES ($1, $2, $3, $4)", [
        inboxId,
        "INBOX",
        userId,
        id,
    ]);

    return {
        id: board.id,
        title: board.title,
        ownerId: board.owner_id,
        createdAt: board.created_at,
    };
};

export const getUserBoards = async (userId: string): Promise<Board[]> => {
    const result = await pool.query(
        "SELECT b.* FROM boards b INNER JOIN board_members bm ON b.id = bm.board_id WHERE bm.user_id = $1 ORDER BY b.created_at DESC",
        [userId]
    );

    return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        ownerId: row.owner_id,
        createdAt: row.created_at,
    }));
};

export const deleteBoard = async (userId: string, boardId: string) => {
    const checkRes = await pool.query("SELECT owner_id FROM boards WHERE id = $1", [boardId]);
    if (!checkRes.rows[0] || checkRes.rows[0].owner_id !== userId) {
        throw new Error("Only board owner can delete it");
    }

    await pool.query("DELETE FROM boards WHERE id = $1", [boardId]);
};

export const checkBoardAccess = async (boardId: string, userId: string): Promise<boolean> => {
    const result = await pool.query(
        "SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2",
        [boardId, userId]
    );
    return result.rows.length > 0;
};

export const addBoardMember = async (
    boardId: string,
    userEmail: string,
    role: "owner" | "editor" | "viewer",
    requestingUserId: string
) => {
    const checkRes = await pool.query("SELECT owner_id FROM boards WHERE id = $1", [boardId]);
    if (!checkRes.rows[0] || checkRes.rows[0].owner_id !== requestingUserId) {
        throw new Error("Only board owner can add members");
    }

    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [userEmail]);
    if (!userRes.rows[0]) {
        throw new Error("User not found");
    }
    const userId = userRes.rows[0].id;

    const result = await pool.query(
        "INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (board_id, user_id) DO UPDATE SET role = $3 RETURNING *",
        [boardId, userId, role]
    );
    return result.rows[0];
};

export const removeBoardMember = async (boardId: string, userId: string, requestingUserId: string) => {
    const checkRes = await pool.query("SELECT owner_id FROM boards WHERE id = $1", [boardId]);
    if (!checkRes.rows[0] || checkRes.rows[0].owner_id !== requestingUserId) {
        throw new Error("Only board owner can remove members");
    }

    await pool.query("DELETE FROM board_members WHERE board_id = $1 AND user_id = $2", [boardId, userId]);
};

export const changeMemberRole = async (
    boardId: string,
    userId: string,
    newRole: "owner" | "editor" | "viewer",
    requestingUserId: string
) => {
    const checkRes = await pool.query("SELECT owner_id FROM boards WHERE id = $1", [boardId]);
    if (!checkRes.rows[0] || checkRes.rows[0].owner_id !== requestingUserId) {
        throw new Error("Only board owner can change roles");
    }

    const result = await pool.query(
        "UPDATE board_members SET role = $1 WHERE board_id = $2 AND user_id = $3 RETURNING *",
        [newRole, boardId, userId]
    );
    return result.rows[0];
};

export const getBoardMembers = async (boardId: string, requestingUserId: string) =>  {
    const hasAccess = await checkBoardAccess(boardId, requestingUserId)
    if (!hasAccess) {
        throw new Error("No access to this board")
    }
    const result = await pool.query(
        `SELECT bm.board_id, bm.user_id, bm.role, bm.created_at, u.email, u.display_name, u.avatar
        FROM board_members bm
        INNER JOIN users u ON u.id = bm.user_id
        WHERE bm.board_id = $1
        ORDER BY bm.created_at ASC`, [boardId]
    )
    return result.rows.map((row) => ({
        boardId: row.board_id,
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
        avatar: row.avatar,
        role: row.role,
        createdAt: row.created_at
    }))
};


