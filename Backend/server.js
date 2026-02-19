const { sendWelcomeEmail, sendOTPEmail } = require('./utils/emailService');
const { geocodeAddress } = require('./utils/geocodingService');

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
    res.send('Planora Backend Running');
});

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL');
        client.release();
    })
    .catch(err => console.error('Connection error', err.stack));

// Ensure uploads directory exists
const baseUploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir);
}

// Helper to log activities
const logActivity = async (userId, projectId, action, details) => {
    try {
        await pool.query(
            'INSERT INTO ActivityLog (user_id, project_id, action, details) VALUES ($1, $2, $3, $4)',
            [userId, projectId, action, details]
        );
    } catch (err) {
        console.error('Activity Logging Error:', err);
    }
};

// Multer Configuration with Dynamic Categorical Folders
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // We expect category/sub_category to be passed in body or determined by user
        // For simplicity, we'll use a 'category' field from body or default to 'General'
        const category = req.body.category || 'General';
        const dest = path.join('uploads', category);

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // Check availability
        const checkUser = await client.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'User already exists' });
        }

        // Check if admin already exists
        if (role === 'admin') {
            const adminCheck = await client.query("SELECT * FROM Users WHERE category = 'Admin'");
            if (adminCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'An admin account already exists. Only one admin is allowed.' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Map role to category and sub_category for DB schema
        const roleMapping = {
            'land_owner': { category: 'Land Owner', sub_category: 'Land Owner' },
            'architect': { category: 'Planning', sub_category: 'Architect' },
            'structural_engineer': { category: 'Planning', sub_category: 'Structural Engineer' },
            'civil_engineer': { category: 'Planning', sub_category: 'Civil Engineer' },
            'interior_designer': { category: 'Design and Finish', sub_category: 'Interior Designer' },
            'false_ceiling': { category: 'Design and Finish', sub_category: 'False Ceiling Worker' },
            'fabrication': { category: 'Design and Finish', sub_category: 'Fabrication Worker' },
            'contractor': { category: 'Planning', sub_category: 'Contractor' },
            'mason': { category: 'SiteWork', sub_category: 'Mason' },
            'electrician': { category: 'SiteWork', sub_category: 'Electrician' },
            'plumber': { category: 'SiteWork', sub_category: 'Plumber' },
            'carpenter': { category: 'SiteWork', sub_category: 'Carpenter' },
            'tile_fixer': { category: 'SiteWork', sub_category: 'Tile Worker' },
            'painter': { category: 'SiteWork', sub_category: 'Painter' },
            'admin': { category: 'Admin', sub_category: 'Admin' }
        };

        const { category, sub_category } = roleMapping[role] || { category: 'Planning', sub_category: role };

        // Insert into Users
        const userInsert = await client.query(
            'INSERT INTO Users (name, email, password_hash, category, sub_category) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
            [name, email, passwordHash, category, sub_category]
        );
        const userId = userInsert.rows[0].user_id;

        // Role-specific table insertion (Mapping)
        // Note: Full role-specific table insertion can be added here if needed.
        // For now, ensuring basic signup works with Users table.

        await client.query('COMMIT');

        // Send Welcome Email
        sendWelcomeEmail(email, name).catch(console.error);

        res.status(201).json({
            message: 'User registered successfully',
            status: 'incomplete', // New users always need to complete profile
            user: { user_id: userId, name, email, role }
        });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error during signup. Check backend logs.' });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// --- OTP Authentication Routes ---

// Forgot Password - Send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // Check if user exists
        const userResult = await pool.query('SELECT user_id FROM Users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Update DB
        await pool.query('UPDATE Users SET otp = $1, otp_expiry = $2 WHERE email = $3', [otp, expiry, email]);

        // Send Email
        await sendOTPEmail(email, otp);

        res.json({ message: 'OTP sent to your email' });
    } catch (err) {
        console.error('Forgot Password error:', err);
        res.status(500).json({ error: 'Server error sending OTP' });
    }
});

// Verify OTP & Login
// Verify OTP & Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields are required' });

    try {
        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];

        // Verify OTP
        if (user.otp !== otp) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // Verify Expiry
        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        await pool.query('UPDATE Users SET password_hash = $1, otp = NULL, otp_expiry = NULL WHERE user_id = $2', [passwordHash, user.user_id]);

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });

    } catch (err) {
        console.error('Reset Password error:', err);
        res.status(500).json({ error: 'Server error during password reset' });
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
        // Reverse map sub_category to role key for frontend compatibility
        let roleKey = 'user';
        const roleMap = {
            'Land Owner': 'land_owner',
            'Architect': 'architect',
            'Structural Engineer': 'structural_engineer',
            'Civil Engineer': 'civil_engineer',
            'Interior Designer': 'interior_designer',
            'False Ceiling Worker': 'false_ceiling',
            'Fabrication Worker': 'fabrication',
            'Mason': 'mason',
            'Contractor': 'contractor',
            'Electrician': 'electrician',
            'Plumber': 'plumber',
            'Carpenter': 'carpenter',
            'Tile Worker': 'tile_fixer',
            'Painter': 'painter',
            'Admin': 'admin'
        };

        if (user.sub_category && roleMap[user.sub_category]) {
            roleKey = roleMap[user.sub_category];
        }

        const isComplete = user.profile_completed;

        res.json({
            message: 'Login successful',
            status: isComplete ? 'success' : 'incomplete',
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                category: user.category,
                sub_category: user.sub_category,
                role: roleKey
            }
        });

        if (!isComplete) {
            console.log(`[Auth] User ${user.email} profile incomplete. Category: ${user.category}, Sub: ${user.sub_category}, Lat: ${user.latitude}`);
        }

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// --- User Profile Routes ---

// Get User Profile
app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT user_id, category, sub_category, name, email, mobile_number, personal_id_document_path, birthdate, status, address, city, state, zip_code, created_at FROM Users WHERE user_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Also fetch role specific details if needed? 
        // For now, returning User table details is sufficient for Personal Details section.
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// Update User Profile (including Aadhar upload)
app.put('/api/user/:id', upload.single('aadhar_card'), async (req, res) => {
    const { id } = req.params;
    const { name, mobile_number, birthdate, address, city, state, zip_code } = req.body;
    let personal_id_document_path = null;

    if (req.file) {
        personal_id_document_path = req.file.path.replace(/\\/g, "/"); // normalize path
    }

    try {
        // Build dynamic query
        let query = 'UPDATE Users SET name = COALESCE($1, name), mobile_number = COALESCE($2, mobile_number), birthdate = COALESCE($3, birthdate), address = COALESCE($4, address), city = COALESCE($5, city), state = COALESCE($6, state), zip_code = COALESCE($7, zip_code), updated_at = CURRENT_TIMESTAMP';
        const values = [name, mobile_number, birthdate, address, city, state, zip_code];

        let paramCount = 8;
        if (personal_id_document_path) {
            query += `, personal_id_document_path = $${paramCount} `;
            values.push(personal_id_document_path);
            paramCount++;
        }

        query += ` WHERE user_id = $${paramCount} RETURNING * `;
        values.push(id);

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user: result.rows[0] });

    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Server error updating profile' });
    }
});

// --- Admin / Verification Routes ---

// Get All Users (for Admin/LandOwner to verify)
app.get('/api/admin/users', async (req, res) => {
    try {
        // Fetch all users, order by created_at desc
        const result = await pool.query('SELECT user_id, name, email, category, sub_category, status, created_at FROM Users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

// Verify User (Accept/Reject)
app.put('/api/admin/verify/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query('UPDATE Users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *', [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: `User status updated to ${status} `, user: result.rows[0] });
    } catch (err) {
        console.error('Error updating user status:', err);
        res.status(500).json({ error: 'Server error updating status' });
    }
});

// Delete User
app.delete('/api/admin/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM Users WHERE user_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Server error deleting user' });
    }
});

// Verify Google Token & Check Profile
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Google token is required' });
    }

    try {
        console.log(`[Google Auth] Received auth request for token: ${token.substring(0, 10)}...`);

        let payload;

        try {
            const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            payload = response.data;
        } catch (axiosError) {
            console.error('[Google Auth] Initial verification failed, trying alternative endpoint...');
            // Fallback to alternative endpoint just in case
            try {
                const response = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                payload = response.data;
            } catch (fallbackError) {
                console.error('[Google Auth] Google API Error:', fallbackError.response?.data || fallbackError.message);
                const googleError = fallbackError.response?.data || {};
                return res.status(401).json({
                    error: googleError.error_description || googleError.error || 'Invalid Google token',
                    details: googleError
                });
            }
        }

        const { email, name, sub: google_id } = payload;
        console.log(`[Google Auth] Verified user: ${email} (${google_id})`);

        if (!email) {
            return res.status(401).json({ error: 'Failed to retrieve email from Google token' });
        }

        // Check if user exists
        const userResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            console.log(`[Google Auth] New user detected: ${email}`);
            // New User - Create partial record
            const insertResult = await pool.query(
                'INSERT INTO Users (name, email, google_id) VALUES ($1, $2, $3) RETURNING user_id, name, email',
                [name, email, google_id]
            );
            return res.json({
                status: 'incomplete',
                message: 'Please complete your profile',
                user: insertResult.rows[0]
            });
        }

        const user = userResult.rows[0];

        // Link Google ID if missing
        if (!user.google_id) {
            console.log(`[Google Auth] Linking Google ID for existing user: ${email}`);
            await pool.query('UPDATE Users SET google_id = $1 WHERE user_id = $2', [google_id, user.user_id]);
        }

        // Check internal status (category/sub_category)
        if (!user.profile_completed) {
            console.log(`[Google Auth] Profile incomplete for user: ${email}`);
            return res.json({
                status: 'incomplete',
                message: 'Please complete your profile',
                user: { user_id: user.user_id, name: user.name, email: user.email }
            });
        }

        // Complete user - return with role format expected by frontend
        let roleKey = 'user';
        const roleMap = {
            'Land Owner': 'land_owner',
            'Architect': 'architect',
            'Structural Engineer': 'structural_engineer',
            'Civil Engineer': 'civil_engineer',
            'Interior Designer': 'interior_designer',
            'False Ceiling Worker': 'false_ceiling',
            'Fabrication Worker': 'fabrication',
            'Mason': 'mason',
            'Contractor': 'contractor',
            'Electrician': 'electrician',
            'Plumber': 'plumber',
            'Carpenter': 'carpenter',
            'Tile Worker': 'tile_fixer',
            'Painter': 'painter',
            'Admin': 'admin'
        };

        if (user.sub_category && roleMap[user.sub_category]) {
            roleKey = roleMap[user.sub_category];
        }

        console.log(`[Google Auth] Successful login: ${email} as ${roleKey}`);
        res.json({
            status: 'success',
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: roleKey
            }
        });

    } catch (err) {
        console.error('[Google Auth] Unexpected Error:', err);
        res.status(500).json({
            error: 'Internal server error during Google Auth',
            details: err.message,
            stack: err.stack
        });
    }
});

// --- User Management & Verifications ---

// Get all users (Admin)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, name, email, category, status, personal_id_document_path, created_at FROM Users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all users for verification (Admin only)
app.get('/api/users/verifications', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT user_id, name, email, category, status, created_at FROM Users WHERE status != $1 ORDER BY created_at DESC',
            ['Suspended']
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching verifications:', err);
        res.status(500).json({ error: 'Failed to fetch verification requests' });
    }
});

// Update User Status (Approve/Reject)
app.put('/api/users/:userId/status', async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Suspended', 'Pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            'UPDATE Users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, name, status',
            [status, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        await logActivity(user.user_id, null, 'Status Update', `User status updated to ${status}`);

        res.json({ message: `User ${status} successfully`, user });
    } catch (err) {
        console.error(' Error updating user status:', err);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Complete Google Profile
app.post('/api/auth/google/complete', async (req, res) => {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ error: 'User ID and Role are required' });

    // Role Mapping (Sync with signup route)
    const roleMapping = {
        'land_owner': { category: 'Land Owner', sub_category: 'Land Owner' },
        'architect': { category: 'Planning', sub_category: 'Architect' },
        'structural_engineer': { category: 'Planning', sub_category: 'Structural Engineer' },
        'civil_engineer': { category: 'Planning', sub_category: 'Civil Engineer' },
        'interior_designer': { category: 'Design and Finish', sub_category: 'Interior Designer' },
        'false_ceiling': { category: 'Design and Finish', sub_category: 'False Ceiling Worker' },
        'fabrication': { category: 'Design and Finish', sub_category: 'Fabrication Worker' },
        'contractor': { category: 'Planning', sub_category: 'Contractor' },
        'mason': { category: 'SiteWork', sub_category: 'Mason' },
        'electrician': { category: 'SiteWork', sub_category: 'Electrician' },
        'plumber': { category: 'SiteWork', sub_category: 'Plumber' },
        'carpenter': { category: 'SiteWork', sub_category: 'Carpenter' },
        'tile_fixer': { category: 'SiteWork', sub_category: 'Tile Worker' },
        'painter': { category: 'SiteWork', sub_category: 'Painter' },
        'admin': { category: 'Admin', sub_category: 'Admin' }
    };

    const { category, sub_category } = roleMapping[role] || { category: 'Planning', sub_category: role };

    try {
        await pool.query(
            'UPDATE Users SET category = $1, sub_category = $2 WHERE user_id = $3',
            [category, sub_category, userId]
        );

        // Fetch user to confirm
        const userResult = await pool.query('SELECT * FROM Users WHERE user_id = $1', [userId]);
        const user = userResult.rows[0];

        // Send Welcome Email for new users (if not already sent)
        sendWelcomeEmail(user.email, user.name).catch(console.error);

        logActivity(userId, null, 'Profile Completed', `User ${user.name} completed profile as ${role}`);

        res.json({
            message: 'Profile completed successfully',
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: role
            }
        });
    } catch (err) {
        console.error('Profile Completion Error:', err);
        res.status(500).json({ error: 'Failed to complete profile' });
    }
});

// Update User Profile (including Address & Geocoding)
app.put('/api/users/:userId/profile', async (req, res) => {
    const { userId } = req.params;
    const { phone, address, city, state, zip_code, birthdate, bio } = req.body;

    // (removed)

    try {
        let latitude = null;
        let longitude = null;

        // Auto-geocode if address is provided, unless lat/lon are explicitly provided
        if (req.body.latitude && req.body.longitude) {
            latitude = parseFloat(req.body.latitude);
            longitude = parseFloat(req.body.longitude);
            // (removed)
        } else if (address) {
            const fullAddress = `${address}, ${city || ''}, ${state || ''}, ${zip_code || ''}`.trim();
            const coords = await geocodeAddress(fullAddress);
            if (coords) {
                latitude = coords.lat;
                longitude = coords.lon;
                // (removed)
            } else {
                // (removed)
            }
        }

        const result = await pool.query(
            `UPDATE Users SET 
                mobile_number = COALESCE($1, mobile_number), 
                address = COALESCE($2, address), 
                city = COALESCE($3, city),
                state = COALESCE($4, state),
                zip_code = COALESCE($5, zip_code),
                birthdate = COALESCE($6, birthdate),
                bio = COALESCE($7, bio),
                latitude = COALESCE($8, latitude), 
                longitude = COALESCE($9, longitude), 
                updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $10 
            RETURNING *`,
            [
                phone || null,
                address || null,
                city || null,
                state || null,
                zip_code || null,
                birthdate || null,
                bio || null,
                latitude || null,
                longitude || null,
                userId
            ]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        // (removed)
        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('[Profile Update] Error:', err);
        res.status(500).json({
            error: 'Failed to update profile',
            message: err.message,
            stack: err.stack
        });
    }
});

// Find Nearby Professionals
app.get('/api/professionals/nearby', async (req, res) => {
    const { lat, lon, category, sub_category, radius = 50 } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const userLat = parseFloat(lat);
    const userLon = parseFloat(lon);
    const radiusKm = parseFloat(radius);

    try {
        // (removed)

        // Haversine formula in SQL
        // 6371 is Earth radius in km
        const query = `
            SELECT 
                user_id, name, email, category, sub_category, address, city, state, experience_years, specialization, bio, resume_path, portfolio_url, latitude, longitude,
                (
                    6371 * acos(
                        cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
                        sin(radians($1)) * sin(radians(latitude))
                    )
                ) AS distance
            FROM Users
            WHERE 
                latitude IS NOT NULL AND longitude IS NOT NULL
                AND ($3::text = 'All' OR category = $3)
                AND ($4::text = 'All' OR sub_category = $4)
                AND (
                    6371 * acos(
                        cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
                        sin(radians($1)) * sin(radians(latitude))
                    )
                ) < $5
            ORDER BY distance ASC
            LIMIT 50;
        `;

        const values = [userLat, userLon, category || 'All', sub_category || 'All', radiusKm];
        const result = await pool.query(query, values);

        // (removed)
        res.json(result.rows);

    } catch (err) {
        console.error('Error fetching nearby professionals:', err);
        res.status(500).json({ error: 'Server error fetching professionals', details: err.message });
    }
});

// Get Public Profile for a Professional
app.get('/api/professionals/:id/public', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT user_id, name, email, category, sub_category, bio, resume_path, portfolio_url, experience_years, specialization, latitude, longitude, address FROM Users WHERE user_id = $1',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Professional not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching public profile:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Complete Profile (Onboarding)
app.put('/api/user/:id/complete-profile', upload.single('resume'), async (req, res) => {
    const { id } = req.params;
    // (removed)
    const { name, phone, address, gender, bio, category, sub_category, portfolio_url, experience_years, specialization } = req.body;
    let resume_path = null;

    if (req.file) {
        resume_path = req.file.path.replace(/\\/g, "/");
    }

    try {
        let latitude = null;
        let longitude = null;
        if (address) {
            const coords = await geocodeAddress(address);
            if (coords) {
                latitude = coords.lat;
                longitude = coords.lon;
            }
        }

        const result = await pool.query(
            `UPDATE Users SET 
                name = COALESCE($1, name), 
                mobile_number = COALESCE($2, mobile_number), 
                address = COALESCE($3, address), 
                bio = COALESCE($4, bio), 
                category = COALESCE($5, category), 
                sub_category = COALESCE($6, sub_category), 
                portfolio_url = COALESCE($7, portfolio_url), 
                experience_years = COALESCE($8, experience_years), 
                specialization = COALESCE($9, specialization),
                latitude = COALESCE($10, latitude),
                longitude = COALESCE($11, longitude),
                resume_path = COALESCE($12, resume_path),
                updated_at = CURRENT_TIMESTAMP,
                profile_completed = TRUE 
            WHERE user_id = $13 RETURNING *`,
            [
                name || null,
                phone || null,
                address || null,
                bio || null,
                category || null,
                sub_category || null,
                portfolio_url || null,
                experience_years && !isNaN(parseInt(experience_years)) ? parseInt(experience_years) : null,
                specialization || null,
                latitude || null,
                longitude || null,
                resume_path || null,
                id
            ]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        await logActivity(id, null, 'Profile Completed', `User completed profile as ${sub_category}`);
        res.json({ message: 'Profile completed successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Profile Completion Error:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ error: 'Failed to complete profile', details: err.message });
    }
});

// Assign Professional to Project
app.post('/api/projects/:projectId/assign', async (req, res) => {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    try {
        await pool.query(
            'INSERT INTO ProjectAssignments (project_id, user_id, assigned_role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET assigned_role = $3, updated_at = CURRENT_TIMESTAMP',
            [projectId, userId, role]
        );

        const userRes = await pool.query('SELECT name FROM Users WHERE user_id = $1', [userId]);
        const userName = userRes.rows[0]?.name || 'Professional';

        await logActivity(null, projectId, 'Team Assignment', `Assigned ${userName} as ${role}`);
        res.json({ message: 'Professional assigned successfully' });
    } catch (err) {
        console.error('Error assigning professional:', err);
        res.status(500).json({ error: 'Failed to assign professional' });
    }
});

// Get Project Team
app.get('/api/projects/:projectId/team', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.name, u.email, u.category, u.sub_category, pa.assigned_role, pa.status, pa.assigned_at 
             FROM Users u 
             JOIN ProjectAssignments pa ON u.user_id = pa.user_id 
             WHERE pa.project_id = $1`,
            [projectId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching project team:', err);
        res.status(500).json({ error: 'Failed to fetch project team' });
    }
});

// --- Project Routes ---

// Create Project
app.post('/api/projects', async (req, res) => {
    const { owner_id, name, type, location, description, budget } = req.body;
    // (removed)

    try {
        const result = await pool.query(
            'INSERT INTO Projects (owner_id, name, type, location, description, budget) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [owner_id, name, type, location, description, budget]
        );
        const project = result.rows[0];
        logActivity(owner_id, project.project_id, 'Project Created', `Initialized project: ${name}`);
        res.status(201).json(project);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Delete Project
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM Projects WHERE project_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        const project = result.rows[0];
        logActivity(project.owner_id, null, 'Project Deleted', `Deleted project: ${project.name}`);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Get Single Project
app.get('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Projects WHERE project_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching project:', err);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Get User Projects (Owner)
app.get('/api/projects/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Projects WHERE owner_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// --- Land Routes ---

// Add New Land
app.post('/api/lands', async (req, res) => {
    const { owner_id, name, location, area, type, latitude, longitude } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Lands (owner_id, name, location, area, type, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [owner_id, name, location, area, type, latitude, longitude]
        );
        const land = result.rows[0];
        logActivity(owner_id, null, 'Land Registered', `Registered land: ${name}`);
        res.status(201).json(land);
    } catch (err) {
        console.error('Error registering land:', err);
        res.status(500).json({ error: 'Failed to register land' });
    }
});

// Get User Lands
app.get('/api/lands/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Lands WHERE owner_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user lands:', err);
        res.status(500).json({ error: 'Failed to fetch lands' });
    }
});

// Delete Land
app.delete('/api/lands/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM Lands WHERE land_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Land not found' });
        res.json({ message: 'Land deleted successfully' });
    } catch (err) {
        console.error('Error deleting land:', err);
        res.status(500).json({ error: 'Failed to delete land' });
    }
});

// --- Messaging Routes ---

app.get('/api/messages/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(`
            SELECT m.*, s.name as sender_name, r.name as receiver_name 
            FROM Messages m
            LEFT JOIN Users s ON m.sender_id = s.user_id
            LEFT JOIN Users r ON m.receiver_id = r.user_id
            WHERE m.project_id = $1
            ORDER BY m.created_at ASC
        `, [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', async (req, res) => {
    const { project_id, sender_id, receiver_id, text } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Messages (project_id, sender_id, receiver_id, text) VALUES ($1, $2, $3, $4) RETURNING *',
            [project_id, sender_id, receiver_id, text]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// --- Site Progress Routes ---

app.get('/api/site-progress/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM SiteProgress WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching site progress:', err);
        res.status(500).json({ error: 'Failed to fetch progress updates' });
    }
});

app.post('/api/site-progress', upload.single('image'), async (req, res) => {
    const { project_id, updated_by, note, alert_type } = req.body;
    let image_path = req.file ? req.file.path.replace(/\\/g, "/") : null;

    try {
        const result = await pool.query(
            'INSERT INTO SiteProgress (project_id, updated_by, note, image_path, alert_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [project_id, updated_by, note, image_path, alert_type]
        );
        logActivity(updated_by, project_id, 'Site Progress Updated', note);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding site progress:', err);
        res.status(500).json({ error: 'Failed to add progress update' });
    }
});

// --- Project Phase Routes ---

app.get('/api/projects/:projectId/phases', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM ProjectPhases WHERE project_id = $1 ORDER BY sequence_order ASC', [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching project phases:', err);
        res.status(500).json({ error: 'Failed to fetch project phases' });
    }
});

app.post('/api/projects/:projectId/phases', async (req, res) => {
    const { projectId } = req.params;
    const { title, status, start_date, end_date, sequence_order } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO ProjectPhases (project_id, title, status, start_date, end_date, sequence_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [projectId, title, status || 'Pending', start_date, end_date, sequence_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating project phase:', err);
        res.status(500).json({ error: 'Failed to create project phase' });
    }
});

app.patch('/api/phases/:phaseId', async (req, res) => {
    const { phaseId } = req.params;
    const { status, title, sequence_order } = req.body;
    try {
        const result = await pool.query(
            'UPDATE ProjectPhases SET status = COALESCE($1, status), title = COALESCE($2, title), sequence_order = COALESCE($3, sequence_order) WHERE phase_id = $4 RETURNING *',
            [status, title, sequence_order, phaseId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Phase not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating project phase:', err);
        res.status(500).json({ error: 'Failed to update project phase' });
    }
});

// --- Document Routes ---

// Update Document Status (Approve/Reject)
app.put('/api/documents/:docId/status', async (req, res) => {
    const { docId } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            'UPDATE Documents SET status = $1 WHERE doc_id = $2 RETURNING doc_id, project_id, name, status',
            [status, docId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const doc = result.rows[0];
        await logActivity(null, doc.project_id, 'Document Status Update', `Document "${doc.name}" updated to ${status}`);

        res.json({ message: `Document ${status} successfully`, doc });
    } catch (err) {
        console.error('Error updating document status:', err);
        res.status(500).json({ error: 'Failed to update document status' });
    }
});

// Upload Document
app.post('/api/documents', upload.single('file'), async (req, res) => {
    const { project_id, uploaded_by, name } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path.replace(/\\/g, "/");
    const fileSize = (req.file.size / 1024).toFixed(2) + ' KB';
    const fileType = path.extname(req.file.originalname).substring(1).toUpperCase();

    try {
        const result = await pool.query(
            'INSERT INTO Documents (project_id, uploaded_by, name, file_path, file_type, file_size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [project_id, uploaded_by, name || req.file.originalname, filePath, fileType, fileSize]
        );
        const doc = result.rows[0];
        logActivity(uploaded_by, project_id, 'Document Uploaded', `Uploaded: ${doc.name}`);
        res.status(201).json(doc);
    } catch (err) {
        console.error('Error uploading document:', err);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// Delete Document
app.delete('/api/documents/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const docResult = await pool.query('SELECT * FROM Documents WHERE doc_id = $1', [id]);
        if (docResult.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

        const doc = docResult.rows[0];
        // Remove file from disk
        if (fs.existsSync(doc.file_path)) {
            fs.unlinkSync(doc.file_path);
        }

        await pool.query('DELETE FROM Documents WHERE doc_id = $1', [id]);
        logActivity(doc.uploaded_by, doc.project_id, 'Document Deleted', `Deleted: ${doc.name}`);
        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Get Project Documents
app.get('/api/documents/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Documents WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// --- Activity Routes ---
app.get('/api/activity/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(`
            SELECT a.*, u.name as user_name 
            FROM ActivityLog a
            LEFT JOIN Users u ON a.user_id = u.user_id
            WHERE a.project_id = $1
            ORDER BY a.created_at DESC
        `, [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching activity:', err);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// --- Payment Routes ---

// Create/Update Manual Payment (Simplified)
app.post('/api/payments', async (req, res) => {
    const { project_id, client_id, invoice_number, amount, due_date, notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Payments (project_id, client_id, invoice_number, amount, due_date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [project_id, client_id, invoice_number, amount, due_date, notes]
        );
        const payment = result.rows[0];
        logActivity(client_id, project_id, 'Payment Record Created', `Invoice: ${invoice_number}, Amount: ${amount}`);
        res.status(201).json(payment);
    } catch (err) {
        console.error('Error creating payment record:', err);
        res.status(500).json({ error: 'Failed to create payment record' });
    }
});

app.patch('/api/payments/:id', async (req, res) => {
    const { id } = req.params;
    const { status, notes, amount } = req.body;
    try {
        const result = await pool.query(
            'UPDATE Payments SET status = COALESCE($1, status), notes = COALESCE($2, notes), amount = COALESCE($3, amount) WHERE payment_id = $4 RETURNING *',
            [status, notes, amount, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Payment record not found' });
        const payment = result.rows[0];
        logActivity(payment.client_id, payment.project_id, 'Payment Updated', `Status: ${status}`);
        res.json(payment);
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

// Get User Payments
app.get('/api/payments/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Payments WHERE client_id = $1 OR vendor_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching payments:', err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// --- Admin Routes ---

// Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, name, email, category, sub_category, status, created_at FROM Users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update User Status
app.patch('/api/users/:userId/status', async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected', 'Suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            'UPDATE Users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [status, userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user status:', err);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Get Projects assigned to a professional
app.get('/api/professionals/:userId/projects', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT p.*, pa.assigned_role, pa.status as assignment_status 
             FROM Projects p 
             JOIN ProjectAssignments pa ON p.project_id = pa.project_id 
             WHERE pa.user_id = $1`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching professional projects:', err);
        res.status(500).json({ error: 'Failed to fetch assigned projects' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port} `);
});
