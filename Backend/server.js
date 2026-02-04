const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'planora',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Database connection error:', err.stack));

// Role Mapping Helper
const getRoleDetails = (roleKey) => {
    const map = {
        'land_owner': { category: 'Land Owner', subCategory: 'Land Owner', table: 'LandOwner' },
        'architect': { category: 'Planning', subCategory: 'Architect', table: 'Architect' },
        'structural_engineer': { category: 'Planning', subCategory: 'Structural Engineer', table: 'StructuralEngineer' },
        'civil_engineer': { category: 'Planning', subCategory: 'Civil Engineer', table: 'CivilEngineer' },
        'interior_designer': { category: 'Design and Finish', subCategory: 'Interior Designer', table: 'InteriorDesigner' },
        'false_ceiling': { category: 'Design and Finish', subCategory: 'False Ceiling Worker', table: 'FalseCeilingWorker' },
        'fabrication': { category: 'Design and Finish', subCategory: 'Fabrication Worker', table: 'FabricationWorker' },
        'mason': { category: 'SiteWork', subCategory: 'Mason', table: 'Mason' },
        'electrician': { category: 'SiteWork', subCategory: 'Electrician', table: 'Electrician' },
        'plumber': { category: 'SiteWork', subCategory: 'Plumber', table: 'Plumber' },
        'carpenter': { category: 'SiteWork', subCategory: 'Carpenter', table: 'Carpenter' },
        'tile_fixer': { category: 'SiteWork', subCategory: 'Tile Worker', table: 'TileWorker' },
        'painter': { category: 'SiteWork', subCategory: 'Painter', table: 'Painter' },
        'admin': { category: 'Admin', subCategory: 'Admin', table: null }
    };
    return map[roleKey] || null;
};

// Routes

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const roleDetails = getRoleDetails(role);
    if (!roleDetails) {
        return res.status(400).json({ error: 'Invalid role selected' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if user exists
        const userCheck = await client.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert into Users table
        const userInsertQuery = `
            INSERT INTO Users (category, sub_category, name, email, password_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, category, name, email;
        `;
        const userValues = [roleDetails.category, roleDetails.subCategory, name, email, passwordHash];
        const userResult = await client.query(userInsertQuery, userValues);
        const newUser = userResult.rows[0];

        // Insert into specific Role Table (if applicable)
        if (roleDetails.table) {
            // Mapping known matching columns. 
            // Most sub-tables have: user_id, name. Some have building_type etc but we don't have that data yet.
            const roleInsertQuery = `
                INSERT INTO ${roleDetails.table} (user_id, name)
                VALUES ($1, $2)
            `;
            await client.query(roleInsertQuery, [newUser.user_id, name]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.user_id,
                name: newUser.name,
                email: newUser.email,
                role: role,
                category: newUser.category
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    } finally {
        client.release();
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user info (excluding password)
        res.json({
            message: 'Login successful',
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                category: user.category,
                sub_category: user.sub_category
                // Ideally return a JWT token here for auth
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
