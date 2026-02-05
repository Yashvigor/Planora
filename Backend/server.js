const { sendWelcomeEmail, sendOTPEmail } = require('./utils/emailService');

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');

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
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check availability
        const checkUser = await client.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'User already exists' });
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
            user: { user_id: userId, name, email, role }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error during signup' });
    } finally {
        client.release();
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

        res.json({
            message: 'Login successful',
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                category: user.category,
                sub_category: user.sub_category,
                role: roleKey
            }
        });

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

// --- Google Authentication ---

// Verify Google Token & Check Profile
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        // Since the frontend uses useGoogleLogin which provides an access_token,
        // we fetch the user info directly from Google's userinfo endpoint.
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error_description || 'Invalid Google token');
        }

        const { email, name, sub: google_id } = payload;

        // Check if user exists
        const userResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            // New User - Create partial record
            const insertResult = await pool.query(
                'INSERT INTO Users (name, email, google_id) VALUES ($1, $2, $3) RETURNING user_id, name, email',
                [name, email, googleId]
            );
            return res.json({
                status: 'incomplete',
                message: 'Please complete your profile',
                user: insertResult.rows[0]
            });
        }

        const user = userResult.rows[0];

        // Check internal status (category/sub_category)
        if (!user.category || !user.sub_category) {
            return res.json({
                status: 'incomplete',
                message: 'Please complete your profile',
                user: { user_id: user.user_id, name: user.name, email: user.email }
            });
        }

        // Complete user
        res.json({
            status: 'success',
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.sub_category.toLowerCase().replace(/ /g, '_') // Map back to frontend role format
            }
        });

    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ error: 'Invalid Google token' });
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

app.listen(port, () => {
    console.log(`Server running on port ${port} `);
});
