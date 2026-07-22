import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '1234',
    database: process.env.DB_NAME ?? 'postgres',
})

export default pool;