CREATE TABLE columns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    done BOOLEAN DEFAULT FALSE,
    column_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (column_id) REFERENCES columns(id)
);
INSERT INTO columns (id, title) VALUES ('inbox', 'INBOX');

ALTER TABLE tasks ALTER COLUMN column_id SET DEFAULT 'inbox';

select * from columns;
                  ALTER TABLE tasks
DROP CONSTRAINT tasks_column_id_fkey;

ALTER TABLE tasks
    ADD CONSTRAINT tasks_column_id_fkey
        FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE;

SELECT * FROM tasks;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );

ALTER TABLE tasks ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE columns ADD COLUMN user_id TEXT REFERENCES users(id);

ALTER TABLE tasks ADD COLUMN position integer;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY column_id, user_id ORDER BY created_at, id) - 1 AS pos
    FROM tasks
)
UPDATE tasks
SET position = ranked.pos
FROM ranked
WHERE tasks.id = ranked.id;

CREATE INDEX tasks_column_pos_idx ON tasks (user_id, column_id, position);

ALTER TABLE columns ADD COLUMN position integer;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at, id) - 1 AS pos
    FROM columns
    WHERE id <> 'inbox'
)
UPDATE columns
SET position = ranked.pos
FROM ranked
WHERE columns.id = ranked.id;

CREATE INDEX columns_user_pos_idx ON columns (user_id, position);

CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE TABLE board_members (
    board_id  TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor',
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (board_id, user_id),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
);

ALTER TABLE columns ADD COLUMN board_id TEXT REFERENCES boards(id) ON DELETE CASCADE;
ALTER TABLE TASKS ADD COLUMN board_id TEXT REFERENCES boards(id) ON DELETE CASCADE;

CREATE INDEX idx_boards_owner_id ON boards(owner_id);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);
CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);

-- Создать дефолтные доски
INSERT INTO boards (id, title, owner_id)
SELECT 'default_' || id, 'My Board', id FROM users
ON CONFLICT DO NOTHING;

-- Добавить владельцев в board_members
INSERT INTO board_members (board_id, user_id, role)
SELECT b.id, b.owner_id, 'owner' FROM boards b
ON CONFLICT DO NOTHING;

-- Обновить существующие колонки (если их board_id пуст)
UPDATE columns SET board_id = (
    SELECT id FROM boards WHERE owner_id = columns.user_id LIMIT 1
) WHERE board_id IS NULL;

-- Обновить существующие задачи (если их board_id пуст)
UPDATE tasks SET board_id = (
    SELECT board_id FROM columns WHERE columns.id = tasks.column_id LIMIT 1
) WHERE board_id IS NULL;

ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN avatar TEXT;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
INSERT INTO columns (id, title, user_id, board_id)
SELECT 'archive_' || b.id, 'ARCHIVE', b.owner_id, b.id
FROM boards b
WHERE NOT EXISTS (
    SELECT 1 FROM columns c WHERE c.id = 'archive_' || b.id
);

ALTER TABLE tasks ADD COLUMN assignee_id TEXT REFERENCES users(id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP;
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';
-- опционально: только допустимые значения
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
    CHECK (priority IN ('low', 'medium', 'high'));