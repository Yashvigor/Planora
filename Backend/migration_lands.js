const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

const createLandsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.lands (
                land_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
                owner_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE,
                name VARCHAR(200) NOT NULL,
                location TEXT NOT NULL,
                area NUMERIC(10,2),
                type VARCHAR(50),
                latitude NUMERIC(10,8),
                longitude NUMERIC(11,8),
                documents_path TEXT,
                status VARCHAR(50) DEFAULT 'Available',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Lands table created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await pool.end();
    }
};

createLandsTable();
