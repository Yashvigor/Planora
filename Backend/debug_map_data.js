const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function debugData() {
    try {
        console.log('--- Debugging Map Data ---');

        // 1. Check for Architects
        const res = await pool.query("SELECT user_id, name, email, city, address, latitude, longitude FROM Users WHERE sub_category = 'Architect'");
        console.log(`\nFound ${res.rows.length} Architects:`);
        res.rows.forEach(r => {
            console.log(`- ${r.name} (${r.email}): City='${r.city}', Lat=${r.latitude}, Lon=${r.longitude}`);
        });

        // 2. Check for ANY user with coordinates
        const res2 = await pool.query("SELECT count(*) FROM Users WHERE latitude IS NOT NULL");
        console.log(`\nTotal users with coordinates: ${res2.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debugData();
