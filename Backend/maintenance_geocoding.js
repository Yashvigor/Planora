const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: true
});

const geocodeAddress = async (address) => {
    if (!address) return null;
    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: { q: address, format: 'json', limit: 1 },
            headers: { 'User-Agent': 'Planora-Construction-App/1.0' }
        });
        if (response.data && response.data.length > 0) {
            return { lat: parseFloat(response.data[0].lat), lon: parseFloat(response.data[0].lon) };
        }
        return null;
    } catch (err) {
        console.error('Geocoding error:', err.message);
        return null;
    }
};

async function fixCoordinates() {
    try {
        console.log("Checking for users without coordinates...");
        const users = await pool.query("SELECT user_id, name, address, city, state, zip_code FROM users WHERE latitude IS NULL OR longitude IS NULL");
        console.log(`Found ${users.rows.length} users in 'users' table lacking coordinates.`);

        for (const u of users.rows) {
            const fullAddress = `${u.address || ''}, ${u.city || ''}, ${u.state || ''}, ${u.zip_code || ''}`.trim().replace(/^, +|, +$/g, '');
            if (fullAddress.length > 3) {
                console.log(`Geocoding ${u.name}: ${fullAddress}`);
                const coords = await geocodeAddress(fullAddress);
                if (coords) {
                    await pool.query("UPDATE users SET latitude = $1, longitude = $2 WHERE user_id = $3", [coords.lat, coords.lon, u.user_id]);
                    console.log(`✅ Updated ${u.name}`);
                } else {
                    console.log(`❌ Failed to geocode ${u.name}`);
                }
            }
        }

        const pending = await pool.query("SELECT id, name, address, city, state, zip_code FROM PendingProfessionals WHERE latitude IS NULL OR longitude IS NULL");
        console.log(`Found ${pending.rows.length} pending professionals lacking coordinates.`);

        for (const p of pending.rows) {
            const fullAddress = `${p.address || ''}, ${p.city || ''}, ${p.state || ''}, ${p.zip_code || ''}`.trim().replace(/^, +|, +$/g, '');
            if (fullAddress.length > 3) {
                console.log(`Geocoding Pending ${p.name}: ${fullAddress}`);
                const coords = await geocodeAddress(fullAddress);
                if (coords) {
                    await pool.query("UPDATE PendingProfessionals SET latitude = $1, longitude = $2 WHERE id = $3", [coords.lat, coords.lon, p.id]);
                    console.log(`✅ Updated Pending ${p.name}`);
                }
            }
        }

        console.log("Maintenance complete.");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

fixCoordinates();
