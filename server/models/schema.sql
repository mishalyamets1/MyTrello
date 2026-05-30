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
)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );

ALTER TABLE tasks ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE columns ADD COLUMN user_id TEXT REFERENCES users(id) 