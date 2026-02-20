const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.ratings (
                rating_id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
                project_id uuid,
                rater_id uuid,
                rated_user_id uuid,
                rating integer CHECK (rating >= 1 AND rating <= 5),
                review text,
                created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Ratings table created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        pool.end();
    }
}
run();
