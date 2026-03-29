/**
 * Planora Main Backend Server - Service Maintenance
 * 
 * This is the central Express application handling all REST API requests from the frontend.
 * It manages Database connections to Neon Serverless Postgres, file uploads via Multer,
 * User Authentication (Email/Password, Google OAuth, OTPs), and all business logic routes
 * for Projects, Documents, Messages, and Professionals (ExpertMap).
 */

const {
    sendWelcomeEmail,
    sendOTPEmail,
    sendVerificationEmail,
    sendAuctionWinEmail,
    sendDeactivatedEmail,
    sendReactivatedEmail
} = require('./utils/emailService');
const { geocodeAddress } = require('./utils/geocodingService');

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

// ??? DNS WORKAROUND: Global Resolver for Neon DB hostnames.
const { setupDNSOverride } = require('./middleware/dns');
setupDNSOverride();

// ?? Middleware Imports
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');
const { upload } = require('./middleware/upload');
const jwt = require('jsonwebtoken');



// ?? Initialize Google OAuth Client for SSO
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const server = http.createServer(app);

/**
 * 💾 Centrally store any uploaded file into the Documents table for cross-device access.
 * Returns the record that was created.
 */
async function storeInDocuments(client, { project_id, uploaded_by, name, file, category, source_type = 'document', source_id = null }) {
    if (!file) return null;

    // Read file content for DB storage (solves local storage isolation issue)
    const file_data = fs.readFileSync(file.path);
    const file_type = path.extname(file.originalname).substring(1).toUpperCase();
    const file_size = (file.size / 1024).toFixed(2) + ' KB';

    const local_path = `uploads/${category}/${file.filename}`;

    const result = await client.query(
        `INSERT INTO Documents 
         (project_id, uploaded_by, name, file_path, file_type, file_size, status, file_data, source_type, source_id, local_path_ref) 
         VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7, $8, $9, $10) 
         RETURNING *`,
        [project_id, uploaded_by, name || file.originalname, local_path, file_type, file_size, file_data, source_type, source_id, local_path]
    );

    const doc = result.rows[0];
    const internalPath = `api/documents/view/${doc.doc_id}`;

    // Update path to point to our central serving API
    await client.query('UPDATE Documents SET file_path = $1 WHERE doc_id = $2', [internalPath, doc.doc_id]);

    return { ...doc, file_path: internalPath };
}

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId.toString());
            console.log(`User ${userId} joined their notification channel.`);
        }
    });

    socket.on('disconnect', () => {
        // Handle disconnect if needed
    });
});

const port = process.env.PORT || 5000;

// ??? Global Middleware
app.use(compression());
app.use(cors()); // Allow Cross-Origin requests from the React frontend
app.use(express.json()); // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (form data)

// Serve uploaded files statically using __dirname for environment consistency
const uploadsPath = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

/**
 * 🛠️ Self-Healing Middleware for Missing Local Files
 * If a teammate has uploaded a file on their machine, but it doesn't exist here,
 * this interceptor fetches it from the database using its legacy path reference.
 */
app.get('/uploads/:category/:filename', async (req, res, next) => {
    const { category, filename } = req.params;
    const localRelPath = `uploads/${category}/${filename}`;
    const absPath = path.resolve(process.cwd(), localRelPath);

    // If it exists locally, just serve it
    if (fs.existsSync(absPath)) {
        return next();
    }

    // Try to recover from the database
    try {
        const result = await pool.query(
            'SELECT name, file_type, file_data FROM Documents WHERE local_path_ref = $1 OR file_path LIKE $2',
            [localRelPath, `%${filename}`]
        );

        if (result.rows.length > 0 && result.rows[0].file_data) {
            const doc = result.rows[0];
            const mimeTypes = {
                'PDF': 'application/pdf',
                'PNG': 'image/png',
                'JPG': 'image/jpeg',
                'JPEG': 'image/jpeg',
                'GIF': 'image/gif'
            };
            const contentType = mimeTypes[doc.file_type] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            console.warn(`[Auto-Recovery] Serving missing local file "${filename}" from central database.`);
            return res.send(doc.file_data);
        }
    } catch (err) {
        console.error('Document recovery lookup failed:', err);
    }

    next();
});

app.use('/uploads', express.static(uploadsPath, { dotfiles: 'allow' }));

/**
 * 🖼️ Universal File Serving API
 * Serves files from the database if available (for cross-device compatibility),
 * falling back to the local disk if they are legacy or large files.
 */
app.get('/api/documents/view/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Find document by ID, Name, or Path snippet (Robust lookup for legacy vs modern records)
        const result = await pool.query(
            `SELECT name, file_path, file_type, file_data 
             FROM documents 
             WHERE doc_id::text = $1 OR name = $1 OR file_path LIKE $2`,
            [id, `%${id}%`]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

        const doc = result.rows[0];

        // If file_data exists in database, serve it (Solves the "Cannot GET /uploads" issue)
        if (doc.file_data) {
            const mimeTypes = {
                'PDF': 'application/pdf',
                'PNG': 'image/png',
                'JPG': 'image/jpeg',
                'JPEG': 'image/jpeg',
                'GIF': 'image/gif',
                'DOCX': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'DOC': 'application/msword',
                'XLSX': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'XLS': 'application/vnd.ms-excel'
            };
            const contentType = mimeTypes[doc.file_type] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            // Ensure no download headers for inline viewing
            res.setHeader('Content-Disposition', 'inline');
            return res.send(doc.file_data);
        }

        // Fallback to local disk only if it's a relative path starting with uploads/
        if (doc.file_path && (doc.file_path.startsWith('uploads/') || doc.file_path.startsWith('api/documents/view/'))) {
            // Resolve actual path from DB if it was a legacy upload
            const relativePath = doc.file_path.startsWith('api/') ? `uploads/${doc.name}` : doc.file_path;
            const absolutePath = path.resolve(process.cwd(), relativePath);
            if (fs.existsSync(absolutePath)) {
                return res.sendFile(absolutePath);
            }
        }

        res.status(404).json({ error: 'File content missing from both database and disk' });
    } catch (err) {
        console.error('Error serving document:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Test Route
app.get('/', (req, res) => {
    res.send('Planora Backend Running');
});

// ??? Database Connection Pool (Neon PostgreSQL)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: true
});


// Enforce standard schema selection for all dynamically scaled Neon DB connections
pool.on('connect', client => {
    client.query('SET search_path TO public');
});

// Migration: Ensure land_auctions has rejection_reason
// Migration: Ensure necessary columns exist
// Migration: Ensure necessary columns exist in both users and pending tables
pool.query("ALTER TABLE pendingprofessionals ADD COLUMN IF NOT EXISTS personal_id_document_path TEXT")
    .then(() => console.log('? Database: pendingprofessionals table synced'))
    .catch(err => console.error('? Migration Error (pendingprofessionals):', err.message));

pool.query("ALTER TABLE land_auctions ADD COLUMN IF NOT EXISTS rejection_reason TEXT").catch(() => { });
pool.query("ALTER TABLE land_auctions ADD COLUMN IF NOT EXISTS current_highest_bid NUMERIC DEFAULT 0").catch(() => { });
pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE").catch(() => { });
pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE").catch(() => { });
pool.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS planning_completed BOOLEAN DEFAULT FALSE").catch(() => { });
pool.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS design_completed BOOLEAN DEFAULT FALSE").catch(() => { });
pool.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS execution_completed BOOLEAN DEFAULT FALSE").catch(() => { });
pool.query("ALTER TABLE land_auctions ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users(user_id)").catch(() => { });
pool.query("ALTER TABLE land_auctions ADD COLUMN IF NOT EXISTS winner_notified BOOLEAN DEFAULT FALSE").catch(() => { });


// Maintenance: Ingest local files and synchronize all paths to use the universal database URL
const normalizePaths = async () => {
    try {
        console.log('[Maintenance] Syncing document database and unifying paths...');

        // 1. INGESTION: Scan local uploads folder and ensure everything is backed up in DB
        const walkDir = (dir) => {
            let files = [];
            if (!fs.existsSync(dir)) return files;
            fs.readdirSync(dir).forEach(f => {
                const p = path.join(dir, f);
                if (fs.statSync(p).isDirectory()) files = [...files, ...walkDir(p)];
                else files.push(p);
            });
            return files;
        };

        const allFiles = walkDir(uploadsPath);
        for (const fullPath of allFiles) {
            const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
            const fileName = path.basename(fullPath);

            // Check if already in Documents
            const check = await pool.query('SELECT doc_id FROM Documents WHERE local_path_ref = $1 OR file_path LIKE $2', [relativePath, `%${fileName}`]);
            if (check.rows.length === 0) {
                try {
                    const data = fs.readFileSync(fullPath);
                    const size = (fs.statSync(fullPath).size / 1024).toFixed(2) + ' KB';
                    const type = path.extname(fullPath).substring(1).toUpperCase();

                    const ins = await pool.query(
                        `INSERT INTO Documents (name, file_path, file_type, file_size, status, file_data, local_path_ref) 
                         VALUES ($1, $2, $3, $4, 'Approved', $5, $6) RETURNING doc_id`,
                        [fileName, relativePath, type, size, data, relativePath]
                    );
                    const newId = ins.rows[0].doc_id;
                    const internalUrl = `api/documents/view/${newId}`;
                    await pool.query('UPDATE Documents SET file_path = $1 WHERE doc_id = $2', [internalUrl, newId]);
                    console.log(`[Maintenance] Successfully ingested and synchronized: ${fileName}`);
                } catch (e) {
                    console.error(`[Maintenance] Failed to ingest ${fileName}:`, e.message);
                }
            }
        }

        // 2. UNIFICATION: Update all feature tables to use the universal api/documents/view/:id URL
        const tables = [
            { name: 'users', cols: ['resume_path', 'degree_path', 'personal_id_document_path'], pk: 'user_id' },
            { name: 'lands', cols: ['documents_path'], pk: 'land_id' },
            { name: 'tasks', cols: ['image_path'], pk: 'task_id' },
            { name: 'siteprogress', cols: ['image_path'], pk: 'progress_id' },
            { name: 'architect_drawings', cols: ['file_path'], pk: 'drawing_id' }
        ];

        for (const t of tables) {
            for (const col of t.cols) {
                // Find records that have any legacy 'uploads/' paths
                const legacyItems = await pool.query(`SELECT * FROM ${t.name} WHERE ${col} LIKE '%uploads/%' OR ${col} LIKE '%\\uploads\\%'`);
                for (const item of legacyItems.rows) {
                    const legacyPath = item[col].replace(/\\/g, '/');
                    const fileName = path.basename(legacyPath);

                    // Match against the central Documents table
                    const docMatch = await pool.query('SELECT file_path FROM Documents WHERE local_path_ref = $1 OR file_path LIKE $2', [legacyPath, `%${fileName}`]);
                    if (docMatch.rows.length > 0) {
                        const newUrl = docMatch.rows[0].file_path;
                        await pool.query(`UPDATE ${t.name} SET ${col} = $1 WHERE ${t.pk} = $2`, [newUrl, item[t.pk]]);
                    }
                }
            }
        }

        // 3. SMART LEDGER MIGRATION: Ensure payments table has all required columns
        await pool.query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'adhoc',
            ADD COLUMN IF NOT EXISTS reference_id UUID,
            ADD COLUMN IF NOT EXISTS proof_image_path TEXT,
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);

        console.log('[Maintenance] Document synchronization and Ledger Migration complete.');
    } catch (err) {
        console.error('[Maintenance] Path normalization or Ledger Migration failed:', err);
    }
};

// Test DB Connection on startup
pool.connect()
    .then(client => {
        client.release();
        normalizePaths(); // Run path normalization
    })
    .catch(err => console.error('Database Connection error', err.stack));

// Helper to compute project progress based on phases (30-30-40 ratio)
const enrichProjectWithProgress = (project, team = [], tasks = [], payments = []) => {
    let physicalPercentage = 0;
    if (project.planning_completed) physicalPercentage += 30;
    if (project.design_completed) physicalPercentage += 30;
    if (project.execution_completed) physicalPercentage += 40;

    const totalSpent = (payments || [])
        .filter(p => String(p.project_id) === String(project.project_id) && p.status?.toLowerCase() === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const budget = parseFloat(project.budget || 0);
    const financialBurn = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

    return {
        ...project,
        team: team,
        total_spent: totalSpent,
        progress: {
            percentage: physicalPercentage,
            physical: physicalPercentage,
            financial: financialBurn,
            isOverBudget: financialBurn > physicalPercentage,
            planning: !!project.planning_completed,
            design: !!project.design_completed,
            execution: !!project.execution_completed
        },
        tasks: tasks
    };
};

// Helper to log activities
const logActivity = async (userId, projectId, action, details) => {
    try {
        await pool.query(
            'INSERT INTO activitylog (user_id, project_id, action, details) VALUES ($1::uuid, $2::uuid, $3, $4)',
            [userId, projectId, action, details]
        );
    } catch (err) {
        console.error('Activity Logging Error:', err);
    }
};

// Helper to create a notification
async function createNotification(userId, type, message, link = '', relatedId = null) {
    try {
        await pool.query(
            'INSERT INTO notifications (user_id, type, message, link, related_id) VALUES ($1::uuid, $2, $3, $4, $5)',
            [userId, type, message, link, relatedId]
        );

        // Emit real-time signal if user is connected
        io.to(userId.toString()).emit('new_notification', {
            type,
            message,
            link,
            related_id: relatedId,
            created_at: new Date()
        });
    } catch (err) {
        console.error('Error creating notification:', err);
    }
}

/**
 * ?? NOTIFICATION ROUTES
 * --------------------------------------------------------------------------
 */

// Get all notifications for a user
app.get('/api/notifications/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT n.id, n.type, n.message, n.link, n.is_read, n.created_at, n.related_id,
                    p.name AS project_name, p.description AS project_description, 
                    pa.assigned_role
             FROM notifications n
             LEFT JOIN projects p ON n.related_id IS NOT NULL AND n.related_id = p.project_id::text
             LEFT JOIN projectassignments pa ON pa.project_id = p.project_id AND pa.user_id = n.user_id
             WHERE n.user_id = $1 ORDER BY n.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error('Error updating notification:', err);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all as read
app.put('/api/notifications/user/:userId/read-all', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error updating notifications:', err);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

/**
 * ? ACTIVITY LOG ROUTES
 * --------------------------------------------------------------------------
 */

// Get activity logs for a user
app.get('/api/activity-log/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM activitylog WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching activity logs:', err);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

// Clear activity logs for a user
app.delete('/api/activity-log/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;

    // Check if user is Admin - Admins are not allowed to clear history
    try {
        const userRes = await pool.query('SELECT category FROM users WHERE user_id = $1', [req.user.id]);
        if (userRes.rows.length > 0 && userRes.rows[0].category === 'Admin') {
            return res.status(403).json({ error: 'Admins are not allowed to clear activity history.' });
        }

        await pool.query('DELETE FROM activitylog WHERE user_id = $1', [userId]);
        res.json({ message: 'Activity history cleared successfully' });
    } catch (err) {
        console.error('Error clearing activity logs:', err);
        res.status(500).json({ error: 'Failed to clear activity history' });
    }
});


/**
 * ?? USER AUTHENTICATION & ONBOARDING ROUTES
 * --------------------------------------------------------------------------
 */

/**
 * ?? Standard User Registration (Signup)
 * Endpoint: POST /api/signup
 * 
 * Flow:
 * 1. Validate incoming data.
 * 2. Check if the user (email) already exists to prevent duplicates.
 * 3. Enforce single-admin policy if the requested role is 'admin'.
 * 4. Securely hash the password using bcrypt.
 * 5. Map the frontend role string (e.g. 'architect') to strict Database Enums ('Planning', 'Architect').
 * 6. Insert new record into the users table and commit transaction.
 * 7. Dispatch an asynchronous Welcome Email.
 */
app.post('/api/signup', async (req, res) => {
    // ... validation and DB checks inside ...
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // ?? Complexity Protocol: Enforce case-sensitive requirements and specialized formatting
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{6,})/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters, contain 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' });
    }

    let client;
    try {
        // Use a transaction so if saving fails midway, we can ROLLBACK and avoid partial data
        client = await pool.connect();
        await client.query('BEGIN');

        // Check if user already exists in users
        const checkUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'User already exists' });
        }

        // Check if user already exists in PendingProfessionals
        const checkPending = await client.query('SELECT * FROM PendingProfessionals WHERE email = $1', [email]);
        if (checkPending.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'An account with this email is already pending approval.' });
        }

        // Administrative Check: System only permits one master admin
        if (role === 'admin') {
            const adminCheck = await client.query("SELECT * FROM users WHERE category = 'Admin'");
            if (adminCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'An admin account already exists. Only one admin is allowed.' });
            }
        }

        // ?? Cryptography: Generate salt and hash the plaintext password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // ??? Schema Mapping: Translate simplified frontend roles into DB-enforced schema structure
        const roleMapping = {
            'land_owner': { category: 'Land Owner', sub_category: 'Land Owner' },
            'architect': { category: 'Planning', sub_category: 'Architect' },
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
            'admin': { category: 'Admin', sub_category: 'Admin' },
            'bidder': { category: 'Bidder', sub_category: 'Bidder' }
        };

        const { category, sub_category } = roleMapping[role] || { category: 'Planning', sub_category: role };

        // Bidders, Land Owners, Contractors, and Admins are approved by default.
        const userStatus = (
            sub_category === 'Land Owner' ||
            sub_category === 'Contractor' ||
            category === 'Admin' ||
            category === 'Bidder' ||
            role === 'bidder'
        ) ? 'Approved' : 'Pending';

        let userId;

        if (userStatus === 'Approved') {
            // Save User Data (Returns auto-generated UUID)
            const isCompleted = category === 'Admin' || sub_category === 'Contractor' || sub_category === 'Land Owner' || sub_category === 'Bidder';
            const userInsert = await client.query(
                'INSERT INTO users (name, email, password_hash, category, sub_category, status, profile_completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id',
                [name, email, passwordHash, category, sub_category, userStatus, isCompleted]
            );
            userId = userInsert.rows[0].user_id;

            // Note: landowner/contractor role tables were removed; user data is in users table only.

        } else {
            // Professional: Pending Approval
            const userInsert = await client.query(
                'INSERT INTO PendingProfessionals (name, email, password_hash, category, sub_category, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [name, email, passwordHash, category, sub_category, userStatus]
            );
            userId = userInsert.rows[0].id;
        }

        // Finalize transaction
        await client.query('COMMIT');

        // Fire & Forget: Send welcome email in background
        sendWelcomeEmail(email, name).catch(console.error);

        // ??? SECURITY: Sign a JWT for the new user to enable secure, stateless sessions immediately after signup.
        const token = jwt.sign(
            { id: userId, email: email, role: role },
            process.env.JWT_SECRET || 'secret-planora-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            status: (category === 'Admin' || sub_category === 'Contractor' || sub_category === 'Land Owner' || sub_category === 'Bidder') ? 'success' : 'incomplete',
            token, // ?? Return token to client
            user: {
                id: userId,
                user_id: userId,
                name: name,
                email: email,
                role: role, // UI Routing key
                status: userStatus,
                profile_completed: (category === 'Admin' || sub_category === 'Land Owner' || sub_category === 'Contractor' || sub_category === 'Bidder')
            }
        });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Signup error:', err);
        res.status(500).json({
            error: 'Server error during signup. Check backend logs.',
            details: err.message,
            code: err.code
        });
    } finally {

        if (client) {
            client.release(); // Return connection back to the pool
        }
    }
});

// --- OTP Authentication Routes ---

/**
 * ?? Forgot Password - Generate & Send OTP
 * Endpoint: POST /api/auth/forgot-password
 * 
 * Flow:
 * 1. Verifies the requested email exists in the database.
 * 2. Generates a secure random 6-digit OTP.
 * 3. Sets an expiration time (10 minutes from creation).
 * 4. Saves OTP to user record and dispatches recovery email.
 */
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // Step 1: Check if user exists
        const userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Step 2-3: Generate 6-digit OTP & Expiry window
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Step 4: Update DB & Dispatch Email
        await pool.query('UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3', [otp, expiry, email]);
        await sendOTPEmail(email, otp);

        res.json({ message: 'OTP sent to your email' });
    } catch (err) {
        console.error('Forgot Password error:', err);
        res.status(500).json({ error: 'Server error sending OTP' });
    }
});

/**
 * ?? Verify OTP & Reset Password
 * Endpoint: POST /api/auth/reset-password
 * 
 * Flow:
 * 1. Checks submitted OTP against database record.
 * 2. Validates timestamp to ensure OTP hasn't expired (>10 mins).
 * 3. Hashes the new password and updates the database.
 * 4. Clears out the OTP to prevent replay attacks.
 */
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // ?? Security Alignment: Validate new credentials against complexity requirements
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{6,})/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters, contain 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];

        // Security Check 1: Match OTP string
        if (user.otp !== otp) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // Security Check 2: Verify against expiration timestamp
        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        // Apply new hashed password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Save new password and nullify the OTP columns to securely lock the recovery window
        await pool.query('UPDATE users SET password_hash = $1, otp = NULL, otp_expiry = NULL WHERE user_id = $2', [passwordHash, user.user_id]);

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });

    } catch (err) {
        console.error('Reset Password error:', err);
        res.status(500).json({ error: 'Server error during password reset' });
    }
});

/**
 * ?? Standard User Login
 * Endpoint: POST /api/login
 * 
 * Validates credentials via bcrypt, checks onboarding status, and returns a session payload.
 * Also performs backwards mapping from strictly typed database enumerations ('Land Owner', 'False Ceiling Worker')
 * to simplified routing strings used by the frontend dashboard paths.
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const roleMap = {
        'Land Owner': 'land_owner',
        'Architect': 'architect',
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
        'Admin': 'admin',
        'Bidder': 'bidder'
    };

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            // Check if they are a pending professional awaiting admin approval
            const pendingRes = await pool.query(
                'SELECT * FROM PendingProfessionals WHERE email = $1',
                [email]
            );
            if (pendingRes.rows.length > 0) {
                const pending = pendingRes.rows[0];
                // Validate their password first
                const isMatch = pending.password_hash
                    ? await bcrypt.compare(password, pending.password_hash)
                    : false;
                if (!isMatch) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // If rejected or pending, we still allow them to login so they can see the reason or resubmit
                // The frontend will handle routing them to the onboarding/rejection view

                // Return a token for them to access their data securely
                const token = jwt.sign(
                    { id: pending.id, email: pending.email, role: pending.sub_category ? roleMap[pending.sub_category] : 'user' },
                    process.env.JWT_SECRET || 'secret-planora-key',
                    { expiresIn: '24h' }
                );

                await logActivity(pending.id, null, 'Login', `Professional login as ${pending.sub_category} (${pending.status})`);

                return res.json({
                    message: 'Login successful',
                    status: 'incomplete', // Direct to onboarding
                    token,
                    user: {
                        id: pending.id,
                        name: pending.name,
                        email: pending.email,
                        category: pending.category,
                        sub_category: pending.sub_category,
                        role: pending.sub_category ? roleMap[pending.sub_category] : 'user',
                        status: pending.status,
                        rejection_reason: pending.rejection_reason
                    }
                });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Compare explicit plaintext against hashed DB record securely
        const isMatch = await bcrypt.compare(password, user.password_hash);
        // 🔒 Account Access Check: Prevent login if Disabled
        if (user.status === 'Disabled') {
            return res.status(403).json({
                error: 'Account Suspended',
                message: 'Your Planora workspace access has been temporarily restricted due to suspicious activities or non-compliance with platform standards. Please use the portal below to submit a formal clarification request.',
                rejection_reason: user.rejection_reason
            });
        }

        // Return user info (excluding securely shielded fields like password_hash or otp)
        // Reverse map sub_category strictly formatted DB enums to low-dash URL-friendly strings
        let roleKey = 'user';

        if (user.sub_category && roleMap[user.sub_category]) {
            roleKey = roleMap[user.sub_category];
        }

        // Determines if app should push user to wizard or main dashboard
        const isInherentlyComplete = user.category === 'Admin' || user.category === 'Bidder';
        const isComplete = user.profile_completed || isInherentlyComplete;

        // ??? Admin Verification Logic check
        // Land Owners and Admins are Approved by default. Professionals start as Pending.

        // ??? SECURITY: Sign a JWT for the user to enable secure, stateless sessions.
        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: roleKey },
            process.env.JWT_SECRET || 'secret-planora-key',
            { expiresIn: '24h' }
        );

        await logActivity(user.user_id, null, 'Login', `Login successful as ${user.sub_category}`);

        res.json({
            message: 'Login successful',
            status: isComplete ? 'success' : 'incomplete',
            token, // ?? Return token to client
            user: {
                id: user.user_id,
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                category: user.category,
                sub_category: user.sub_category,
                role: roleKey, // UI Routing key
                status: user.status,
                rejection_reason: user.rejection_reason,
                resume_path: user.resume_path,
                degree_path: user.degree_path,
                profile_completed: user.profile_completed
            }
        });

        if (!isComplete) {
            // Profile incomplete, will be routed to onboarding by frontend
        }

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

/**
 * 🚩 SUBMIT ACCOUNT APPEAL (For Suspended/Disabled Users)
 * Endpoint: POST /api/auth/appeal
 */
app.post('/api/auth/appeal', upload.single('document'), async (req, res) => {
    const { email, password, reason } = req.body;
    let documentPath = null;

    if (!email || !password || !reason) {
        return res.status(400).json({ error: 'Email, password, and appeal reason are required.' });
    }

    if (req.file) {
        documentPath = `uploads/appeals/${req.file.filename}`;
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid security credentials.' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid security credentials.' });

        if (user.status !== 'Disabled') {
            return res.status(400).json({ error: 'Account is active. Appeals are only for suspended workspaces.' });
        }

        // We use isAppeal=true in the column and also prefix rejection_reason for legacy compat
        await pool.query(
            'UPDATE users SET appeal_reason = $1, appeal_document_path = $2, rejection_reason = $3 WHERE user_id = $4',
            [reason, documentPath, `[APPEAL SUBMITTED] ${reason}`, user.user_id]
        );

        await logActivity(user.user_id, null, 'Appeal Submitted', 'Formal appeal submitted for account reinstatement.');

        res.json({ message: 'Your appeal has been submitted successfully and is awaiting review.' });
    } catch (err) {
        console.error('Error submitting appeal:', err);
        res.status(500).json({ error: 'Infrastructure failure during appeal submission.' });
    }
});

/**
 * ?? USER PROFILE MANAGEMENT
 * --------------------------------------------------------------------------
 */

/**
 * ?? Fetch User Profile Details
 * Endpoint: GET /api/user/:id
 * 
 * Retrieves the core profile information (Name, Email, Phone, Address, etc.)
 * based on the provided UUID. Used by the frontend 'Settings' or 'Profile' pages.
 */
app.get('/api/user/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // First try the main users table
        let result = await pool.query(`
            SELECT u.*, 
            (SELECT ROUND(AVG(rating), 1) FROM ratings WHERE rated_user_id = u.user_id) as avg_rating,
            (SELECT COUNT(*) FROM ratings WHERE rated_user_id = u.user_id) as total_ratings
            FROM users u WHERE u.user_id = $1
        `, [id]);

        // If not found, try PendingProfessionals
        if (result.rows.length === 0) {
            result = await pool.query('SELECT id as user_id, category, sub_category, name, email, mobile_number, status, rejection_reason, resume_path, degree_path, address, bio, created_at FROM PendingProfessionals WHERE id = $1', [id]);
        }

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

/**
 * ?? Update User Profile (Upload Documents & Info)
 * Endpoint: PUT /api/user/:id
 * 
 * Allows users to complete their profile logic.
 * Incorporates Multer middleware `upload.single('aadhar_card')` to securely intercept
 * and save file attachments before the controller logic executes.
 */
app.put('/api/user/:id', authenticateToken, upload.single('aadhar_card'), async (req, res) => {
    const { id } = req.params;
    const { name, mobile_number, birthdate, address, city, state, zip_code } = req.body;
    let personal_id_document_path = null;

    if (req.file) {
        // Store relative path: uploads/category/filename
        const category = req.body.category || 'General';
        personal_id_document_path = `uploads/${category}/${req.file.filename}`;
    }

    try {
        // Build dynamic query
        let query = 'UPDATE users SET name = COALESCE($1, name), mobile_number = COALESCE($2, mobile_number), birthdate = COALESCE($3, birthdate), address = COALESCE($4, address), city = COALESCE($5, city), state = COALESCE($6, state), zip_code = COALESCE($7, zip_code), updated_at = CURRENT_TIMESTAMP';
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

        await logActivity(id, null, 'Profile Update', `Updated personal profile details`);

        res.json({ message: 'Profile updated successfully', user: result.rows[0] });

    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Server error updating profile' });
    }
});

// Profile Sync for non-file updates (used by Settings)
app.put('/api/users/:userId/profile', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { phone, address, city, state, zip_code, birthdate, bio, latitude, longitude } = req.body;

    try {
        // Privileged roles (Land Owner, Contractor, Admin) should always remain Approved
        const userCheck = await pool.query('SELECT category, sub_category, status FROM users WHERE user_id = $1', [userId]);
        if (userCheck.rows.length === 0) return res.status(404).json({ error: 'User not found in records' });

        const user = userCheck.rows[0];
        const role = (user.sub_category || '').toLowerCase();
        const isExempt = ['admin', 'land_owner', 'contractor'].includes(role) || user.category === 'Admin';

        // Preserve Approved status if already granted
        const currentStatus = (user.status || '').toLowerCase();
        const newStatus = (isExempt || currentStatus === 'approved') ? 'Approved' : 'Pending';

        const result = await pool.query(
            `UPDATE users 
             SET mobile_number = COALESCE($1, mobile_number),
                 address = COALESCE($2, address),
                 city = COALESCE($3, city),
                 state = COALESCE($4, state),
                 zip_code = COALESCE($5, zip_code),
                 birthdate = COALESCE($6, birthdate),
                 bio = COALESCE($7, bio),
                 status = $8,
                 latitude = COALESCE($9, latitude),
                 longitude = COALESCE($10, longitude),
                 rejection_reason = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $11 RETURNING *`,
            [phone, address, city, state, zip_code, birthdate, bio, newStatus, latitude, longitude, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found in records' });
        }

        await logActivity(userId, null, 'Profile Detail Update', `Updated personal contact/address details`);
        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Error in profile sync:', err);
        res.status(500).json({
            error: 'Failed to sync profile',
            details: err.message,
            hint: 'Ensure your user ID is valid and properties are correct.'
        });
    }
});

/**
 * ?? Complete Professional Profile (Onboarding)
 * Endpoint: PUT /api/user/:id/complete-profile
 * 
 * Specifically for the Onboarding / Verification flow.
 * Handles multi-file uploads for Resume and Degree.
 */
app.put('/api/user/:id/complete-profile', authenticateToken, upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'degree', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 }
]), async (req, res) => {
    const { id } = req.params;
    const { phone, address, bio, experience_years, specialization, portfolio_url, birthdate, city, state, zip_code } = req.body;

    let resume_path = null;
    let degree_path = null;
    let personal_id_document_path = null;

    if (req.files) {
        const category = req.body.category || 'General';
        const uploadPromises = [];

        if (req.files['resume'] && req.files['resume'][0]) {
            uploadPromises.push(storeInDocuments(pool, {
                project_id: null, uploaded_by: id, name: 'Resume', file: req.files['resume'][0], category
            }).then(doc => resume_path = doc.file_path));
        }
        if (req.files['degree'] && req.files['degree'][0]) {
            uploadPromises.push(storeInDocuments(pool, {
                project_id: null, uploaded_by: id, name: 'Degree', file: req.files['degree'][0], category
            }).then(doc => degree_path = doc.file_path));
        }
        if (req.files['aadhar_card'] && req.files['aadhar_card'][0]) {
            uploadPromises.push(storeInDocuments(pool, {
                project_id: null, uploaded_by: id, name: 'Aadhar Card', file: req.files['aadhar_card'][0], category
            }).then(doc => personal_id_document_path = doc.file_path));
        }

        await Promise.all(uploadPromises);
    }

    try {
        // First check users
        let userCheck = await pool.query("SELECT user_id as id, category, sub_category, 'users' as source_table FROM users WHERE user_id = $1", [id]);

        // If not in users, check PendingProfessionals
        if (userCheck.rows.length === 0) {
            userCheck = await pool.query("SELECT id, category, sub_category, 'PendingProfessionals' as source_table FROM PendingProfessionals WHERE id = $1", [id]);
        }

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userCheck.rows[0];
        const isExempt = user.sub_category === 'Land Owner' || user.sub_category === 'Contractor' || user.category === 'Admin';
        const isProfessional = !isExempt;
        const tableName = user.source_table;
        const idColumn = tableName === 'users' ? 'user_id' : 'id';

        let query = `
            UPDATE ${tableName} 
            SET mobile_number = COALESCE($1, mobile_number),
                address = COALESCE($2, address),
                bio = COALESCE($3, bio),
                experience_years = COALESCE($4, experience_years::integer),
                specialization = COALESCE($5, specialization),
                portfolio_url = COALESCE($6, portfolio_url),
                birthdate = COALESCE($7, birthdate::date),
                city = COALESCE($8, city),
                state = COALESCE($9, state),
                zip_code = COALESCE($10, zip_code)
        `;

        // Preserve Approved status if already granted
        const currentStatus = (user.status || '').toLowerCase();
        const userStatusRes = (isExempt || currentStatus === 'approved') ? 'Approved' : 'Pending';

        if (tableName === 'users') {
            query += `, profile_completed = true, status = '${userStatusRes}', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP`;
        } else {
            query += `, status = 'Pending', rejection_reason = NULL, created_at = CURRENT_TIMESTAMP`;
        }

        const values = [phone, address, bio, experience_years || null, specialization, portfolio_url, birthdate || null, city || null, state || null, zip_code || null];
        let paramCount = 11;

        if (resume_path) {
            query += `, resume_path = $${paramCount}`;
            values.push(resume_path);
            paramCount++;
        }
        if (degree_path) {
            query += `, degree_path = $${paramCount}`;
            values.push(degree_path);
            paramCount++;
        }
        if (personal_id_document_path) {
            query += `, personal_id_document_path = $${paramCount}`;
            values.push(personal_id_document_path);
            paramCount++;
        }

        // Row 1064-1067 handled above now logic-wise
        // if (tableName === 'users' && isProfessional) {
        //     query += `, status = 'Pending'`;
        // }

        query += ` WHERE ${idColumn} = $${paramCount} RETURNING *`;
        values.push(id);

        const result = await pool.query(query, values);
        const updatedUser = result.rows[0];

        if (user.status === 'Rejected') {
            await logActivity(id, null, 'Re-submission', `User resubmitted verification documents after rejection as ${user.sub_category}`);
        } else {
            await logActivity(id, null, 'Profile Completed', `User completed profile as ${user.sub_category}`);
        }

        res.json({ message: 'Profile completed successfully', user: updatedUser });

    } catch (err) {
        console.error('Error completing profile:', err);
        res.status(500).json({ error: 'Failed to complete profile: ' + err.message });
    }
});


/**
 * ??? ADMINISTRATOR / SYSTEM MODERATION ROUTES
 * --------------------------------------------------------------------------
 */

/**
 * 🛠️ Admin: User Deletion
 * Handles removal from both users and PendingProfessionals datasets.
 */
app.delete('/api/admin/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Try deleting from users first
        const userDelete = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING email', [id]);

        if (userDelete.rowCount > 0) {
            logActivity(id, null, 'Account Deleted', `Admin deleted user index: ${id}`);
            return res.json({ message: 'User deleted from users table' });
        }

        // Check PendingProfessionals
        const pendingDelete = await pool.query('DELETE FROM PendingProfessionals WHERE id = $1 RETURNING email', [id]);

        if (pendingDelete.rowCount > 0) {
            return res.json({ message: 'Pending professional removed' });
        }

        res.status(404).json({ error: 'User record not found' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Deletion failed. Related records may exist.' });
    }
});

/**
 * 🔔 Admin: Get Verification Stats
 * Returns pending counts for Sidebar notifications.
 */
app.get('/api/admin/pending-counts', async (req, res) => {
    try {
        const userPendingInUsers = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'Pending' AND category != 'Admin'");
        const userPendingInPending = await pool.query("SELECT COUNT(*) FROM PendingProfessionals WHERE status = 'Pending'");
        const landPending = await pool.query("SELECT COUNT(*) FROM lands WHERE verification_status = 'Pending' OR verification_status IS NULL");
        const auctionPending = await pool.query("SELECT COUNT(*) FROM land_auctions WHERE status = 'pending_verification'");

        res.json({
            accounts: parseInt(userPendingInUsers.rows[0].count) + parseInt(userPendingInPending.rows[0].count),
            lands: parseInt(landPending.rows[0].count),
            auctions: parseInt(auctionPending.rows[0].count)
        });
    } catch (err) {
        console.error('Error fetching dashboard counts:', err);
        res.status(500).json({ error: 'Counts unavailable' });
    }
});

// Admin: Get all auction requests (Pending, Active, Completed, Rejected)
app.get('/api/admin/auctions/all', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                a.*, 
                l.name as land_title, l.location, l.area, 
                u.name as owner_name, u.email as owner_email,
                w.name as winner_name, w.email as winner_email
            FROM land_auctions a
            JOIN lands l ON a.land_id = l.land_id
            JOIN users u ON a.owner_id = u.user_id
            LEFT JOIN users w ON a.winner_id = w.user_id
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all auctions:', err);
        res.status(500).json({ error: 'Failed to fetch auction requests' });
    }
});

// Admin: Get all pending auctions (legacy mapping for counts if still used)
app.get('/api/admin/auctions/pending', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, l.name as land_title, l.location, l.area, u.name as owner_name, u.email as owner_email
            FROM land_auctions a
            JOIN lands l ON a.land_id = l.land_id
            JOIN users u ON a.owner_id = u.user_id
            WHERE a.status = 'pending_verification'
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching pending auctions:', err);
        res.status(500).json({ error: 'Failed to fetch pending auctions' });
    }
});

// Admin: Verify/Approve an auction
app.patch('/api/admin/auctions/:auctionId/verify', authenticateToken, async (req, res) => {
    const { auctionId } = req.params;
    const { status, rejection_reason } = req.body; // status: 'active' or 'rejected'

    try {
        const result = await pool.query(
            'UPDATE land_auctions SET status = $1, rejection_reason = $2 WHERE auction_id = $3 RETURNING *',
            [status, rejection_reason || null, auctionId]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
        const auction = result.rows[0];

        // Notify owner
        await pool.query(
            `INSERT INTO notifications (user_id, type, message, link, related_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                auction.owner_id,
                'auction_update',
                `Your auction listing for land ID ${auction.land_id} has been ${status === 'active' ? 'approved and is now LIVE' : 'rejected'}.`,
                '/dashboard/lands',
                auction.auction_id
            ]
        );

        // If manually marked as completed, trigger ownership transfer
        if (status === 'completed' && auction.winner_id) {
            await pool.query('UPDATE lands SET owner_id = $1 WHERE land_id = $2', [auction.winner_id, auction.land_id]);
            await pool.query('UPDATE projects SET land_owner_id = $1 WHERE land_id = $2', [auction.winner_id, auction.land_id]);
            console.log(`[Admin] Manual ownership transfer completed for Land ${auction.land_id}`);
        }

        res.json(auction);
    } catch (err) {
        console.error('Error verifying auction:', err);
        res.status(500).json({ error: 'Failed to verify auction' });
    }
});


// Fetch All Projects for Admin View (Replaces Activity Logs)
app.get('/api/admin/projects', authenticateToken, async (req, res) => {
    try {
        const projectsQuery = `
            SELECT p.*, p.name as title, l.name as land_name, l.location as location, u.name as owner_name, u.email as owner_email 
            FROM projects p
            LEFT JOIN lands l ON p.land_id = l.land_id
            LEFT JOIN users u ON p.land_owner_id = u.user_id
            ORDER BY p.created_at DESC
        `;
        const projectsRes = await pool.query(projectsQuery);
        const projects = projectsRes.rows;

        // Fetch assignments to attach to projects (Only accepted professionals)
        const assignmentsQuery = `
            SELECT pa.*, u.name, u.category, u.sub_category 
            FROM projectassignments pa
            JOIN users u ON pa.user_id = u.user_id
            WHERE pa.status = 'Accepted'
        `;
        const assignmentsRes = await pool.query(assignmentsQuery);
        const assignments = assignmentsRes.rows;

        // Fetch tasks to calculate site progress
        const tasksQuery = `
            SELECT project_id, status FROM tasks
        `;
        const tasksRes = await pool.query(tasksQuery);
        const tasks = tasksRes.rows;

        // Map everything together
        const enrichedProjects = projects.map(project => {
            const projectTeam = assignments.filter(a => a.project_id === project.project_id);
            const projectTasks = tasks.filter(t => t.project_id === project.project_id);
            return enrichProjectWithProgress(project, projectTeam, projectTasks);
        });

        res.json(enrichedProjects);
    } catch (err) {
        console.error('Error fetching admin projects:', err);
        res.status(500).json({ error: 'Server error fetching projects' });
    }
});

// Verify User (Accept/Reject)
app.put('/api/admin/verify/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, rejection_reason } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let user;

        // Try to find in PendingProfessionals
        const pendingCheck = await client.query('SELECT * FROM PendingProfessionals WHERE id = $1', [id]);

        if (pendingCheck.rows.length > 0) {
            const pendingUser = pendingCheck.rows[0];

            if (status === 'Approved') {
                // Migrate to users table
                const insertUser = await client.query(
                    `INSERT INTO users (user_id, name, email, password_hash, google_id, category, sub_category, mobile_number, address, city, state, zip_code, birthdate, bio, experience_years, specialization, portfolio_url, resume_path, degree_path, status, profile_completed)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, true) RETURNING *`,
                    [pendingUser.id, pendingUser.name, pendingUser.email, pendingUser.password_hash, pendingUser.google_id, pendingUser.category, pendingUser.sub_category, pendingUser.mobile_number, pendingUser.address, pendingUser.city, pendingUser.state, pendingUser.zip_code, pendingUser.birthdate, pendingUser.bio, pendingUser.experience_years, pendingUser.specialization, pendingUser.portfolio_url, pendingUser.resume_path, pendingUser.degree_path, status]
                );
                user = insertUser.rows[0];

                // Delete from PendingProfessionals
                await client.query('DELETE FROM PendingProfessionals WHERE id = $1', [id]);
            } else {
                // Reject: Update status and reason
                const updatePending = await client.query(
                    'UPDATE PendingProfessionals SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING *',
                    [status, rejection_reason || null, id]
                );
                user = updatePending.rows[0];
            }
        } else {
            // Already in users or existing legacy user
            const updateResult = await client.query(
                'UPDATE users SET status = $1, rejection_reason = $2, appeal_reason = NULL, appeal_document_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 RETURNING *',
                [status, rejection_reason || null, id]
            );

            if (updateResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }
            user = updateResult.rows[0];
        }

        // Note: role-specific tables (architect, mason, etc.) were removed. Status update in users table is sufficient.


        await client.query('COMMIT');

        // Dispatch Email Notification (don't block the request if it fails)
        try {
            await sendVerificationEmail(user.email, user.name, status, user.rejection_reason);
        } catch (emailErr) {
            console.error('Failed to send verification email inside verify route:', emailErr);
        }

        res.json({ message: `User status updated to ${status}`, user });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating user status:', err);
        res.status(500).json({ error: 'Server error updating status' });
    } finally {
        client.release();
    }
});

// 🔒 Admin: Disable Account
app.put('/api/admin/user/:id/disable', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 RETURNING *',
            ['Disabled', rejection_reason || 'Account suspended by administrator.', id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // 📡 Real-time Logout: Emit a socket event to force the user off the platform if online
        io.to(`user_${id}`).emit('account_status_changed', {
            status: 'Disabled',
            reason: rejection_reason
        });

        // 📧 Notify user about deactivation
        try {
            await sendDeactivatedEmail(user.email, user.name, rejection_reason);
        } catch (emailErr) {
            console.error('Failed to send disable notification email:', emailErr);
        }

        // 📜 Log it
        await logActivity(id, null, 'Account Suspended', `Admin disabled account. Reason: ${rejection_reason}`);

        res.json({ message: 'User disabled successfully', user });
    } catch (err) {
        console.error('Error disabling user:', err);
        res.status(500).json({ error: 'Server error disabling user' });
    }
});

// 🔓 Admin: Enable Account
app.put('/api/admin/user/:id/enable', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE users SET status = $1, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            ['Approved', id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // 📡 Notify Frontend that status has changed (Real-time updates if they are on a pending screen)
        io.to(`user_${id}`).emit('account_status_changed', { status: 'Approved' });

        // 📧 Send approval email
        try {
            await sendReactivatedEmail(user.email, user.name);
        } catch (emailErr) {
            console.error('Failed to send enable notification email:', emailErr);
        }

        // 📜 Log it
        await logActivity(id, null, 'Account Reinstated', 'Admin restored account access after manual review.');

        res.json({ message: 'User enabled successfully', user });
    } catch (err) {
        console.error('Error enabling user:', err);
        res.status(500).json({ error: 'Server error enabling user' });
    }
});

// ✉️ Submit Account Appeal
app.post('/api/user/appeal', authenticateToken, upload.single('appealDocument'), async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const { message } = req.body;
    let appeal_doc_path = null;

    if (!message) return res.status(400).json({ error: 'Appeal statement is required.' });

    try {
        const checkStatus = await pool.query('SELECT status FROM users WHERE user_id = $1', [userId]);
        if (checkStatus.rows.length > 0 && checkStatus.rows[0].status === 'Pending') {
            return res.status(400).json({ error: 'An appeal is already pending review. Please wait for an administrative response.' });
        }
        if (req.file) {
            // Use the established storeInDocuments utility if possible, 
            // but for simplicity here we just store the path in users table or rejection_reason
            appeal_doc_path = `/api/documents/view/${req.file.filename}`;
        }

        const appealCombined = `[APPEAL SUBMITTED] ${message}${appeal_doc_path ? ` | DOC: ${appeal_doc_path}` : ''}`;

        const result = await pool.query(
            "UPDATE users SET status = 'Pending', rejection_reason = $1, appeal_reason = $2, appeal_document_path = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4 RETURNING *",
            [appealCombined, message, appeal_doc_path, userId]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        await logActivity(userId, null, 'Appeal Submitted', 'User submitted a formal appeal for account deactivation.');

        res.json({ message: 'Appeal submitted successfully. Your account is now under re-review.' });
    } catch (err) {
        console.error('Error submitting appeal:', err);
        res.status(500).json({ error: 'Failed to process appeal.' });
    }
});


/**
 * ?? Google Single Sign-On (OAuth 2.0)
 * Endpoint: POST /api/auth/google
 * 
 * Flow:
 * 1. Takes the raw JWT 'token' provided by the Google Identity Services frontend script.
 * 2. Makes a server-to-server call to Google's API (`googleapis.com/oauth2/v3/userinfo`) to cryptographically verify it.
 * 3. Identifies whether this is a returning user or a brand new registration.
 * 4. Links the unique `google_id` to existing accounts if they share the same email.
 * 5. Resolves the login, returning a strict URL-mapped `roleKey` for frontend routing.
 */
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Google token is required' });
    }

    try {
        let payload;

        try {
            const response = await /** @type {any} */(axios).get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            payload = response.data;
        } catch (axiosError) {
            console.error('[Google Auth] Initial verification failed, trying alternative endpoint... Error:', axiosError.message);
            // Fallback to alternative endpoint just in case
            try {
                const response = await /** @type {any} */(axios).get('https://openidconnect.googleapis.com/v1/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                payload = response.data;
            } catch (fallbackError) {
                console.error('[Google Auth] Google API Error:', fallbackError.message, fallbackError.response?.data);

                let errorDesc = 'Invalid Google token';
                let detailsStr = fallbackError.message || 'Unknown network error';

                if (fallbackError.response && fallbackError.response.data) {
                    const data = fallbackError.response.data;
                    errorDesc = data.error_description || data.error || errorDesc;
                    detailsStr = JSON.stringify(data);
                }

                return res.status(401).json({
                    error: errorDesc,
                    details: detailsStr
                });
            }
        }

        const { email, name, sub: google_id } = payload;

        if (!email) {
            return res.status(401).json({ error: 'Failed to retrieve email from Google token' });
        }

        // Check if user exists in either table
        let userResult = await pool.query("SELECT *, 'users' as source_table FROM users WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            userResult = await pool.query("SELECT id as user_id, *, 'PendingProfessionals' as source_table FROM PendingProfessionals WHERE email = $1", [email]);
        }

        if (userResult.rows.length === 0) {
            // New User - Create partial record in users table
            const insertResult = await pool.query(
                'INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING user_id, name, email',
                [name, email, google_id]
            );

            const userId = insertResult.rows[0].user_id;

            const jwtToken = jwt.sign(
                { id: userId, email: email, role: 'user' },
                process.env.JWT_SECRET || 'secret-planora-key',
                { expiresIn: '24h' }
            );

            return res.json({
                status: 'incomplete',
                message: 'Please complete your profile',
                token: jwtToken,
                user: {
                    ...insertResult.rows[0],
                    id: userId,
                    profile_completed: false
                }
            });
        }

        const user = userResult.rows[0];

        // Link Google ID if missing
        if (!user.google_id) {
            await pool.query('UPDATE users SET google_id = $1 WHERE user_id = $2', [google_id, user.user_id]);
        }

        // Check internal status (category/sub_category)
        const isInherentlyComplete = user.sub_category === 'Land Owner' || user.sub_category === 'Contractor' || user.category === 'Admin' || user.category === 'Bidder';
        const isRejected = user.status === 'Rejected';

        if ((!user.profile_completed && !isInherentlyComplete) || isRejected) {
            const jwtToken = jwt.sign(
                { id: user.user_id, email: user.email, role: 'user' },
                process.env.JWT_SECRET || 'secret-planora-key',
                { expiresIn: '24h' }
            );

            return res.json({
                status: 'incomplete', // Direct to onboarding for re-submission or completion
                message: isRejected ? 'Your application was rejected. Please resubmit your documents.' : 'Please complete your profile',
                token: jwtToken,
                user: {
                    id: user.user_id,
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role: 'user',
                    status: user.status,
                    sub_category: user.sub_category,
                    rejection_reason: user.rejection_reason,
                    profile_completed: user.profile_completed
                }
            });
        }

        // Complete user - return with role format expected by frontend
        let roleKey = 'user';
        const roleMap = {
            'Land Owner': 'land_owner',
            'Architect': 'architect',
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
            'Admin': 'admin',
            'Bidder': 'bidder'
        };
        if (user.sub_category && roleMap[user.sub_category]) {
            roleKey = roleMap[user.sub_category];
        }

        const jwtToken = jwt.sign(
            { id: user.user_id, email: user.email, role: roleKey },
            process.env.JWT_SECRET || 'secret-planora-key',
            { expiresIn: '24h' }
        );

        return res.json({
            status: 'success',
            message: 'Login successful',
            token: jwtToken,
            user: {
                id: user.user_id,
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: roleKey,
                category: user.category,
                sub_category: user.sub_category,
                status: user.status,
                profile_completed: user.profile_completed,
                resume_path: user.resume_path,
                degree_path: user.degree_path,
                rejection_reason: user.rejection_reason
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

/**
 * ?? SYSTEM & USER MANAGEMENT ROUTES
 * --------------------------------------------------------------------------
 */

/**
 * ?? Fetch All users (Admin Master List)
 * Endpoint: GET /api/users
 * 
 * Used by the master Administrator to view every registered account
 * on the platform, sorted by creation date.
 */
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, name, email, category, status, personal_id_document_path, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * ?? Fetch Pending Verifications 
 * Endpoint: GET /api/users/verifications
 * 
 * Filters out 'Suspended' users. Used by Admin to review newly signed-up 
 * professionals who need their credentials and resumes checked before approval.
 */
app.get('/api/users/verifications', async (req, res) => {
    try {
        // Fetch BOTH: 
        // 1. Professionals in PendingProfessionals (new signups)
        // 2. Professionals in users table (already approved but visible for history)
        // 3. Any user with a pending appeal
        const result = await pool.query(
            `SELECT id AS user_id, name, email, category, sub_category, status, resume_path, degree_path, created_at, 'pending' as source_table
             FROM PendingProfessionals
             
             UNION ALL
             
             SELECT user_id, name, email, category, sub_category, status, resume_path, degree_path, created_at, 'users' as source_table
             FROM users
             WHERE (category NOT IN ('Land Owner', 'Admin', 'LAND OWNER', 'ADMIN', 'Bidder', 'BIDDER') 
               OR (status = 'Pending' AND appeal_reason IS NOT NULL))
             
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching verifications:', err);
        res.status(500).json({ error: 'Failed to fetch verification requests' });
    }
});

/**
 * ? Update User Moderation Status
 * Endpoint: PUT /api/users/:userId/status
 * 
 * Used by Admin to explicitly Approve, Reject, or Suspend an account.
 * Crucial for the platform's trust and safety model (e.g., rejecting fake contractors).
 */
app.put('/api/users/:userId/status', async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Suspended', 'Pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Look up the professional in PendingProfessionals first
        const pendingRes = await client.query(
            'SELECT * FROM PendingProfessionals WHERE id = $1',
            [userId]
        );

        if (pendingRes.rows.length === 0) {
            // Fallback: maybe they are already in users table (e.g. land owner, contractor)
            const userRes = await client.query(
                'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, name, status',
                [status, userId]
            );
            if (userRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }
            await client.query('COMMIT');
            return res.json({ message: `User ${status} successfully`, user: userRes.rows[0] });
        }

        const pending = pendingRes.rows[0];

        if (status === 'Approved') {
            // Migrate: INSERT into users, then DELETE from PendingProfessionals
            const insertRes = await client.query(
                `INSERT INTO users 
                    (name, email, password_hash, google_id, category, sub_category, status, 
                     mobile_number, address, bio, experience_years, specialization, 
                     portfolio_url, resume_path, degree_path, profile_completed)
                 VALUES ($1,$2,$3,$4,$5,$6,'Approved',$7,$8,$9,$10,$11,$12,$13,$14, true)
                 RETURNING user_id, name, email, category, sub_category, status`,
                [
                    pending.name,
                    pending.email,
                    pending.password_hash,
                    pending.google_id || null,
                    pending.category,
                    pending.sub_category,
                    pending.mobile_number || null,
                    pending.address || null,
                    pending.bio || null,
                    pending.experience_years || null,
                    pending.specialization || null,
                    pending.portfolio_url || null,
                    pending.resume_path || null,
                    pending.degree_path || null
                ]
            );

            // Remove from pending
            await client.query('DELETE FROM PendingProfessionals WHERE id = $1', [userId]);

            await client.query('COMMIT');

            const newUser = insertRes.rows[0];
            await logActivity(newUser.user_id, null, 'Account Approved', `Professional ${newUser.name} approved and moved to users table`);

            // Notify the professional if possible (by email match in future)
            res.json({ message: 'Professional approved and moved to system', user: newUser });

        } else {
            // Rejected / Suspended: just update status in PendingProfessionals
            await client.query(
                'UPDATE PendingProfessionals SET status = $1 WHERE id = $2',
                [status, userId]
            );
            await client.query('COMMIT');

            await logActivity(null, null, 'Status Update', `Pending professional ${pending.name} status set to ${status}`);
            res.json({ message: `Professional ${status}`, user: { user_id: userId, name: pending.name, status } });
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating user status:', err);
        res.status(500).json({ error: 'Failed to update user status', details: err.message });
    } finally {
        client.release();
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
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // ?? New Logic: Defer relational insert for professionals until Admin verification.
            // Contractors and Land Owners skip PendingProfessionals and are immediately Approved.
            const userStatus = (sub_category === 'Land Owner' || sub_category === 'Contractor' || category === 'Admin') ? 'Approved' : 'Pending';

            let finalUser;

            if (userStatus === 'Approved') {
                // 1. Update primary users table including status
                const isProfileCompleted = category === 'Admin' || sub_category === 'Contractor' || sub_category === 'Land Owner';

                await client.query(
                    'UPDATE users SET category = $1, sub_category = $2, status = $3, profile_completed = $4 WHERE user_id = $5',
                    [category, sub_category, userStatus, isProfileCompleted, userId]
                );

                // Fetch user to confirm and get name
                const userResult = await client.query('SELECT * FROM users WHERE user_id = $1', [userId]);
                finalUser = userResult.rows[0];

                // Note: landowner/contractor role tables removed; user data is in users table only.

            } else {
                // Fetch partial user from users
                const partialUserRes = await client.query('SELECT name, email, google_id FROM users WHERE user_id = $1', [userId]);
                if (partialUserRes.rows.length > 0) {
                    const partialUser = partialUserRes.rows[0];

                    // Insert into PendingProfessionals
                    const pendingInsert = await client.query(
                        'INSERT INTO PendingProfessionals (name, email, google_id, category, sub_category, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id as user_id, name, email, category, sub_category, status, false as profile_completed',
                        [partialUser.name, partialUser.email, partialUser.google_id, category, sub_category, userStatus]
                    );
                    finalUser = pendingInsert.rows[0];

                    // Delete from users table
                    await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
                } else {
                    // Fallback in case they were already moved (e.g. concurrent request)
                    const existingPending = await client.query('SELECT id as user_id, * FROM PendingProfessionals WHERE id = $1', [userId]);
                    finalUser = existingPending.rows[0];
                }
            }

            await client.query('COMMIT');

            const user = finalUser;

            // Send Welcome Email for new users (if not already sent)
            if (user && user.email) {
                sendWelcomeEmail(user.email, user.name).catch(console.error);
            }

            if (user) {
                logActivity(user.user_id, null, 'Profile Completed', `User ${user.name} completed profile as ${role}`);
            }

            res.json({
                message: 'Profile completed successfully',
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    category: user.category,
                    sub_category: user.sub_category,
                    status: user.status,
                    rejection_reason: user.rejection_reason,
                    resume_path: user.resume_path,
                    degree_path: user.degree_path,
                    profile_completed: user.profile_completed || false, // Use DB value instead of hardcoding false
                    role: user.sub_category === 'Land Owner' ? 'land_owner' :
                        user.sub_category === 'Contractor' ? 'contractor' :
                            category === 'Admin' ? 'admin' : role
                }
            });

        } catch (innerErr) {
            await client.query('ROLLBACK');
            throw innerErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Profile Completion Error:', err);
        res.status(500).json({ error: 'Failed to complete profile' });
    }
});

/**
 * ?? Update User Profile & Trigger Geocoding
 * Endpoint: PUT /api/users/:userId/profile
 * 
 * Handles deep profile updates. Crucially, if the user updates their text `address`,
 * this endpoint calls Google/Nominatim behind the scenes to magically convert
 * that address into strict `latitude`/`longitude` floats for the ExpertMap.
 */
app.put('/api/users/:userId/profile', async (req, res) => {
    const { userId } = req.params;
    const { name, phone, address, city, state, zip_code, birthdate, bio } = req.body;

    try {
        let latitude = req.body.latitude !== undefined ? parseFloat(req.body.latitude) : null;
        let longitude = req.body.longitude !== undefined ? parseFloat(req.body.longitude) : null;

        // Auto-geocode ONLY if address changed and no manual coordinates provided (Made non-breaking)
        if (latitude === null && address) {
            try {
                const fullAddress = `${address}, ${city || ''}, ${state || ''}, ${zip_code || ''}`.trim();
                const coords = await geocodeAddress(fullAddress);
                if (coords) {
                    latitude = coords.lat;
                    longitude = coords.lon;
                }
            } catch (geoErr) {
                console.warn('[Profile Update] Geocoding skipped:', geoErr.message);
            }
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `UPDATE users SET 
                    name = COALESCE($1, name),
                    mobile_number = COALESCE($2, mobile_number), 
                    address = COALESCE($3, address), 
                    city = COALESCE($4, city),
                    state = COALESCE($5, state),
                    zip_code = COALESCE($6, zip_code),
                    birthdate = COALESCE($7, birthdate),
                    bio = COALESCE($8, bio),
                    latitude = COALESCE($9, latitude), 
                    longitude = COALESCE($10, longitude), 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = $11 
                RETURNING *`,
                [
                    name || null,
                    phone || null,
                    address || null,
                    city || null,
                    state || null,
                    zip_code || null,
                    birthdate || null,
                    bio || null,
                    latitude,
                    longitude,
                    userId
                ]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }

            const updatedUser = result.rows[0];
            await client.query('COMMIT');

            // Log move/update if it's a significant profile change (not just location)
            if (name || address || bio) {
                try {
                    await logActivity(userId, null, 'Profile Update', 'User updated their profile information');
                } catch (e) { console.error('Log activity error:', e); }
            }

            res.json({ message: 'Profile updated successfully', user: updatedUser });

        } catch (innerErr) {
            await client.query('ROLLBACK');
            console.error('Inner profile update error:', innerErr);
            throw innerErr;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('[Profile Update Path] Internal Error:', err.message, err.stack);
        res.status(500).json({
            error: 'Failed to update profile',
            message: err.message
        });
    }
});

/**
 * ??? EXPERTMAP / PROFESSIONAL DISCOVERY ROUTES
 * --------------------------------------------------------------------------
 */


// Profile Synchronization - For first login and general updates
app.put('/api/user/:userId/sync-profile', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { address, city, state, zip_code, mobile_number, bio, specialization, experience_years, portfolio_url } = req.body;

    // Security: Only allow users to update their own profile
    if (req.user.id !== userId) {
        return res.status(403).json({ error: 'Permission denied. You can only update your own profile.' });
    }

    try {
        const result = await pool.query(
            `UPDATE users 
             SET address = COALESCE($1, address), 
                 city = COALESCE($2, city), 
                 state = COALESCE($3, state), 
                 zip_code = COALESCE($4, zip_code), 
                 mobile_number = COALESCE($5, mobile_number), 
                 bio = COALESCE($6, bio), 
                 specialization = COALESCE($7, specialization), 
                 experience_years = COALESCE($8, experience_years::integer), 
                 portfolio_url = COALESCE($9, portfolio_url), 
                 profile_completed = true, 
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $10 
             RETURNING user_id, name, email, category, sub_category, address, city, state, zip_code, mobile_number, bio, specialization, experience_years, portfolio_url, profile_completed`,
            [address, city, state, zip_code, mobile_number, bio, specialization, experience_years || null, portfolio_url, userId]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error syncing profile:', err);
        res.status(500).json({ error: 'Failed to sync profile' });
    }
});

/**
 * ?? Find Nearby Professionals (The ExpertMap Engine)
 * Endpoint: GET /api/professionals/nearby
 * 
 * Core Logic:
 * Uses the mathematical Haversine formula directly inside a PostgreSQL query to 
 * calculate the great-circle distance between the user's latitude/longitude and 
 * every professional in the database.
 * 
 * Performance: 
 * Doing this at the SQL layer is vastly more efficient than pulling all users 
 * into Node.js memory and calculating distances in JavaScript.
 */
app.get('/api/professionals/nearby', async (req, res) => {
    const { lat, lon, category, sub_category, radius = 50, userId } = req.query;

    const parseCoord = (val) => {
        const p = parseFloat(String(val));
        return isNaN(p) ? null : p;
    };
    const userLat = parseCoord(lat);
    const userLon = parseCoord(lon);
    const radiusKm = parseCoord(radius) || 50;
    const searchUserId = userId || req.user?.id || null;

    try {
        // Unified query that handles both coordinate-based and text-based (City/State) matching via scoring
        const query = `
            WITH all_pros AS (
                SELECT user_id as id, name, email, category, sub_category, status, latitude, longitude, city, state, address, experience_years, specialization, bio, resume_path, portfolio_url, 'users' as source 
                FROM users 
                WHERE (category NOT IN ('Land Owner', 'Admin', 'LAND OWNER', 'ADMIN'))
                UNION ALL
                SELECT id, name, email, category, sub_category, status, latitude, longitude, city, state, address, experience_years, specialization, bio, resume_path, portfolio_url, 'pending' as source 
                FROM PendingProfessionals
            ),
            scored_pros AS (
                SELECT p.*,
                       COALESCE((SELECT ROUND(AVG(rating), 1) FROM ratings WHERE rated_user_id = p.id), 0.0) as rating,
                       (SELECT ROUND(AVG(rating), 1) FROM ratings WHERE rated_user_id = p.id) as avg_rating,
                       (SELECT COUNT(*) FROM ratings WHERE rated_user_id = p.id) as total_ratings,
                       (CASE 
                         -- Direct Proximity Match
                         WHEN $1::numeric IS NOT NULL AND $2::numeric IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND 
                               (6371 * acos(GREATEST(-1.0, LEAST(1.0, cos(radians($1::numeric)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($2::numeric)) + sin(radians($1::numeric)) * sin(radians(p.latitude)))))) <= $3::numeric THEN 100
                         
                         -- Logic Fallback 1: Same City
                         WHEN $4::uuid IS NOT NULL AND p.city IS NOT NULL AND EXISTS (SELECT 1 FROM users cur WHERE cur.user_id = $4::uuid AND cur.city IS NOT NULL AND p.city ILIKE '%' || cur.city || '%') THEN 80
                         
                         -- Logic Fallback 2: Same State
                         WHEN $4::uuid IS NOT NULL AND p.state IS NOT NULL AND EXISTS (SELECT 1 FROM users cur WHERE cur.user_id = $4::uuid AND cur.state IS NOT NULL AND p.state ILIKE '%' || cur.state || '%') THEN 40
                         
                         -- Global Fallback
                         ELSE 10
                       END) as relevance_score,
                       CASE WHEN $1::numeric IS NOT NULL AND $2::numeric IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
                           6371 * acos(GREATEST(-1.0, LEAST(1.0, cos(radians($1::numeric)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($2::numeric)) + sin(radians($1::numeric)) * sin(radians(p.latitude)))))
                       ELSE NULL END AS distance
                FROM all_pros p
                WHERE ($5::text = 'All' OR p.category = $5::text OR p.sub_category = $5::text)
                AND ($6::text = 'All' OR p.sub_category = $6::text)
            )
            SELECT *, id as user_id FROM scored_pros
            WHERE relevance_score > 0
            ORDER BY relevance_score DESC, distance ASC NULLS LAST
            LIMIT 100
        `;

        const values = [userLat, userLon, radiusKm, searchUserId, category || 'All', sub_category || 'All'];
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('[Nearby API Error]:', err);
        res.status(500).json({ error: 'Failed discover professionals. Check coordinate formats.' });
    }
});

// Get ALL approved professionals (no location required)
app.get('/api/professionals/all', async (req, res) => {
    const { sub_category, category } = req.query;
    try {
        const result = await pool.query(`
            SELECT 
                u.user_id, u.name, u.email, u.category, u.sub_category, u.address, u.city, u.state,
                u.experience_years, u.specialization, u.bio, u.resume_path, u.portfolio_url, u.latitude, u.longitude,
                COALESCE((SELECT ROUND(AVG(rating), 1) FROM ratings WHERE rated_user_id = u.user_id), 0.0) as rating, NULL::float as distance
            FROM users u
            WHERE 
                u.status = 'Approved'
                AND u.category NOT IN ('Land Owner', 'Admin', 'LAND OWNER', 'ADMIN')
                AND ($1::text = 'All' OR u.category = $1 OR u.sub_category = $1)
                AND ($2::text = 'All' OR u.sub_category = $2)
            ORDER BY u.name ASC
            LIMIT 100
        `, [category || 'All', sub_category || 'All']);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all professionals:', err);
        res.status(500).json({ error: 'Failed to fetch professionals', details: err.message });
    }
});

/**
 * ?? Get Public Profile for a Professional
 * Endpoint: GET /api/professionals/:id/public
 * 
 * Used when a Land Owner clicks "View Profile" on the map. Returns non-sensitive
 * details and aggregates overall ratings via a SQL LEFT JOIN.
 */
app.get('/api/professionals/:id/public', async (req, res) => {
    const { id } = req.params;
    try {
        // Left join with ratings table to calculate average rating mathematically
        const result = await pool.query(
            `SELECT u.user_id, u.name, u.email, u.category, u.sub_category, u.bio, u.resume_path, 
                    u.portfolio_url, u.experience_years, u.specialization, u.latitude, u.longitude, u.address,
                    COALESCE((SELECT ROUND(AVG(rating), 1) FROM ratings WHERE rated_user_id = u.user_id), 0.0) as rating
             FROM users u
             WHERE u.user_id = $1`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Professional not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching public profile:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});



/**
 * ?? PROJECT ASSIGNMENT & TEAM ROUTES
 * --------------------------------------------------------------------------
 */

/**
 * ?? Assign Professional to Project
 * Endpoint: POST /api/projects/:projectId/assign
 * 
 * Invoked when "Hire for Project" is clicked on the ExpertMap.
 * Uses an ON CONFLICT UPSERT strategy: if the user was previously rejected or left,
 * we update their role rather than violating unique SQL constraints.
 */
app.post('/api/projects/:projectId/assign', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    try {
        const assignerId = req['user'] ? (req['user'].user_id || req['user'].id) : null;
        await pool.query(
            `INSERT INTO projectassignments (project_id, user_id, assigned_role, status, assigned_by) 
             VALUES ($1, $2, $3, 'Pending', $4) 
             ON CONFLICT (project_id, user_id) 
             DO UPDATE SET assigned_role = EXCLUDED.assigned_role, status = 'Pending', assigned_by = EXCLUDED.assigned_by`,
            [projectId, userId, role, assignerId]
        );

        const [userRes, pendingUserRes] = await Promise.all([
            pool.query('SELECT name FROM users WHERE user_id = $1', [userId]),
            pool.query('SELECT name FROM PendingProfessionals WHERE id = $1', [userId])
        ]);
        const userName = userRes.rows[0]?.name || pendingUserRes.rows[0]?.name || 'Professional';

        const [assignerRes, pendingAssignerRes] = await Promise.all([
            pool.query('SELECT name FROM users WHERE user_id = $1', [assignerId]),
            pool.query('SELECT name FROM PendingProfessionals WHERE id = $1', [assignerId])
        ]);
        const assignerName = assignerRes.rows[0]?.name || pendingAssignerRes.rows[0]?.name || 'An Associate';

        const projectRes = await pool.query('SELECT name FROM projects WHERE project_id = $1', [projectId]);
        const projectName = projectRes.rows[0]?.name || 'a project';

        await logActivity(assignerId, projectId, 'Team Assignment', `Assigned ${userName} as ${role}`);

        // Notify the professional
        await createNotification(
            userId,
            'invitation',
            `${assignerName} has invited you to join "${projectName}" as ${role}. Accept or decline this invitation.`,
            `/dashboard/notifications`,
            projectId // related_id
        );

        res.json({ message: 'Professional assigned successfully' });
    } catch (err) {
        console.error('Error assigning professional:', err);
        res.status(500).json({ error: 'Failed to assign professional' });
    }
});

/**
 * Update Project Assignment Status
 * Endpoint: PUT /api/projects/:projectId/assign/:userId/status
 */
app.put('/api/projects/:projectId/assign/:userId/status', authenticateToken, async (req, res) => {
    const { projectId, userId } = req.params;
    const { status } = req.body; // 'Accepted' or 'Rejected'

    try {
        // 1. Verify project still exists (Prevents "Phantom Assignments")
        const projectCheck = await pool.query('SELECT land_owner_id, name FROM projects WHERE project_id = $1', [projectId]);
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found. This project may have been deleted or cancelled by the owner.' });
        }

        const projectName = projectCheck.rows[0].name;
        const landOwnerId = projectCheck.rows[0].land_owner_id;

        // 2. Proceed with assignment update
        const updateResult = await pool.query(
            'UPDATE projectassignments SET status = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *',
            [status, projectId, userId]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const updated = updateResult.rows[0];

        const [userRes, pendingUserRes] = await Promise.all([
            pool.query('SELECT name FROM users WHERE user_id = $1', [userId]),
            pool.query('SELECT name FROM PendingProfessionals WHERE id = $1', [userId])
        ]);
        const userName = userRes.rows[0]?.name || pendingUserRes.rows[0]?.name || 'Professional';

        const actionUserId = req['user'] ? (req['user'].user_id || req['user'].id) : userId;
        await logActivity(actionUserId, projectId, 'Team Update', `${userName} ${status.toLowerCase()} the project invitation`);

        // Notify the project land owner
        if (landOwnerId) {
            await createNotification(
                landOwnerId,
                'invitation_response',
                `${userName} has ${status.toLowerCase()} the invitation for project "${projectName}" as ${updated.assigned_role || 'Team Member'}.`,
                `/dashboard/notifications`,
                projectId
            );
        }

        // Notify the actual assigner (Contractor) if different from land owner
        if (updated.assigned_by && updated.assigned_by !== landOwnerId) {
            await createNotification(
                updated.assigned_by,
                'invitation_response',
                `${userName} has ${status.toLowerCase()} the invitation for project "${projectName}" as ${updated.assigned_role || 'Team Member'}.`,
                `/dashboard/notifications`,
                projectId
            );
        }

        res.json(updated);
    } catch (err) {
        console.error('Error updating assignment status:', err);
        res.status(500).json({ error: 'Failed to update assignment status' });
    }
});


// Get Projects for a Professional
app.get('/api/professionals/:userId/projects', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                pa.assigned_role,
                pa.status as assignment_status,
                pa.assigned_at
            FROM projects p
            LEFT JOIN projectassignments pa ON p.project_id = pa.project_id AND pa.user_id = $1
            WHERE pa.user_id = $1 OR p.land_owner_id = $1
            ORDER BY COALESCE(pa.assigned_at, p.created_at) DESC
        `, [userId]);

        const projects = result.rows;

        // Fetch tasks to calculate progress for each
        const projectIds = projects.map(p => p.project_id);
        let tasks = [];
        if (projectIds.length > 0) {
            const tasksRes = await pool.query('SELECT task_id, project_id, status, title, description, image_path, created_at, submitted_at, approved_at FROM tasks WHERE project_id = ANY($1)', [projectIds]);
            tasks = tasksRes.rows;
        }

        // Fetch team and check if rated
        const enriched = await Promise.all(projects.map(async (p) => {
            try {
                const pTasks = tasks.filter(t => t.project_id === p.project_id);
                const enrichedP = enrichProjectWithProgress(p, [], pTasks);

                // Fetch fully resolved team for this project (including pending ones)
                const teamRes = await pool.query(`
                    SELECT 
                        COALESCE(u.user_id, pp.id) as user_id, 
                        COALESCE(u.name, pp.name) as name, 
                        COALESCE(u.email, pp.email) as email, 
                        COALESCE(u.category, pp.category) as category, 
                        COALESCE(u.sub_category, pp.sub_category) as sub_category,
                        pa.assigned_role, pa.status
                    FROM projectassignments pa
                    LEFT JOIN users u ON pa.user_id = u.user_id
                    LEFT JOIN PendingProfessionals pp ON pa.user_id = pp.id
                    WHERE pa.project_id = $1 AND (pa.status = 'Accepted' OR pa.status = 'Pending')
                `, [p.project_id]);
                enrichedP.team = teamRes.rows;

                // Check if current user (rater) has submitted any ratings for this project
                try {
                    const ratingCheck = await pool.query(
                        "SELECT EXISTS(SELECT 1 FROM ratings WHERE project_id = $1 AND rater_id = $2) as has_rated",
                        [p.project_id, userId]
                    );
                    enrichedP.has_rated = ratingCheck.rows[0].has_rated;
                } catch (e) {
                    console.error('Rating check error:', e);
                    enrichedP.has_rated = false;
                }

                return enrichedP;
            } catch (err) {
                console.error(`Error enriching project ${p.project_id}:`, err);
                return p; // Return base project if enrichment fails
            }
        }));

        res.json(enriched);

    } catch (err) {
        console.error('Error fetching professional projects:', err);
        res.status(500).json({ error: 'Failed to fetch professional projects' });
    }
});

// Get Project Team
app.get('/api/projects/:projectId/team', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { status } = req.query; // Optional filter
    try {
        let query = `
            SELECT 
                COALESCE(u.user_id, pp.id) as user_id, 
                COALESCE(u.name, pp.name) as name, 
                COALESCE(u.email, pp.email) as email, 
                COALESCE(u.category, pp.category) as category, 
                COALESCE(u.sub_category, pp.sub_category) as sub_category,
                pa.assigned_role, pa.status, pa.assigned_at
            FROM projectassignments pa
            LEFT JOIN users u ON pa.user_id = u.user_id
            LEFT JOIN PendingProfessionals pp ON pa.user_id = pp.id
            WHERE pa.project_id = $1
        `;
        const params = [projectId];

        if (status) {
            query += ` AND pa.status = $2`;
            params.push(String(status));
        } else {
            // Default behavior if no status provided
            query += ` AND (pa.status = 'Accepted' OR pa.status IS NULL OR pa.status = 'Pending')`;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching project team:', err);
        res.status(500).json({ error: 'Failed to fetch project team' });
    }
});

// Remove Team Member
app.delete('/api/projects/:projectId/team/:userId', authenticateToken, async (req, res) => {
    const { projectId, userId } = req.params;
    try {
        const delResult = await pool.query(
            'DELETE FROM projectassignments WHERE project_id = $1 AND user_id = $2 RETURNING *',
            [projectId, userId]
        );

        if (delResult.rowCount === 0) {
            return res.status(404).json({ error: 'User is not assigned to this project' });
        }

        const userRes = await pool.query('SELECT name FROM users WHERE user_id = $1', [userId]);
        const userName = userRes.rows[0]?.name || 'Professional';

        const removerId = req['user'] ? (req['user'].user_id || req['user'].id) : null;
        await logActivity(removerId, projectId, 'Team Member Removed', `Removed ${userName} from the project team`);
        res.json({ message: 'Team member removed successfully' });
    } catch (err) {
        console.error('Error removing team member:', err);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
});

/**
 * ??? CORE PROJECT MANAGEMENT ROUTES
 * --------------------------------------------------------------------------
 */

/**
 * ?? Create New Project
 * Endpoint: POST /api/projects
 * 
 * Invoked by Land Owners to initialize a workspace. Ties the project
 * strictly to their `owner_id`. Logs the action for auditing.
 */
app.post('/api/projects', authenticateToken, async (req, res) => {
    const { owner_id, name, type, location, description, budget, land_id } = req.body;

    try {
        // Enforce Land Verification Lock for Land Owners
        const userRes = await pool.query('SELECT sub_category FROM users WHERE user_id = $1', [owner_id]);

        if (userRes.rows.length > 0 && userRes.rows[0].sub_category === 'Land Owner') {
            const verifiedLandsRes = await pool.query("SELECT * FROM lands WHERE owner_id = $1 AND verification_status = 'Verified'", [owner_id]);
            if (verifiedLandsRes.rows.length === 0) {
                return res.status(403).json({ error: 'You must have at least one verified land document before creating a project. Please wait for Admin approval.' });
            }
        }

        // [Security] Prevent creating project on land currently in active auction
        if (land_id) {
            const auctionCheck = await pool.query("SELECT status FROM land_auctions WHERE land_id = $1 AND status = 'active'", [land_id]);
            if (auctionCheck.rows.length > 0) {
                return res.status(403).json({ error: 'This land is currently listed in an active auction. Development is restricted until the auction concludes.' });
            }
        }

        // [Validation] Prevent negative or invalid budget inputs
        const projectBudget = parseFloat(budget || 0);
        if (projectBudget < 0) {
            return res.status(400).json({ error: 'Project budget cannot be negative.' });
        }

        const projectRes = await pool.query(
            'INSERT INTO projects (land_owner_id, name, description, budget, status, land_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [owner_id, name, description, projectBudget, 'Planning', land_id || null]
        );
        const project = projectRes.rows[0];

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
        const deleteRes = await pool.query('DELETE FROM projects WHERE project_id = $1 RETURNING land_owner_id, name', [id]);
        if (deleteRes.rowCount === 0) return res.status(404).json({ error: 'Project not found' });
        const project = deleteRes.rows[0];

        logActivity(project.land_owner_id, null, 'Project Deleted', `Deleted project: ${project.name}`);
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
        const result = await pool.query('SELECT * FROM projects WHERE project_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

        const tasksRes = await pool.query('SELECT status FROM tasks WHERE project_id = $1', [id]);
        const project = enrichProjectWithProgress(result.rows[0], [], tasksRes.rows);
        res.json(project);
    } catch (err) {
        console.error('Error fetching project:', err);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Update Project Phases and Progress
app.patch('/api/projects/:id/phases', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { phase, completed } = req.body;
    const userId = req.user.id;

    if (!['planning', 'design', 'execution'].includes(phase)) {
        return res.status(400).json({ error: 'Invalid phase' });
    }

    try {
        const checkStatusRes = await pool.query('SELECT status FROM projects WHERE project_id = $1', [id]);
        if (checkStatusRes.rows.length > 0 && checkStatusRes.rows[0].status === 'Completed') {
            return res.status(403).json({ error: 'This project is marked as Completed and locked. No further phase updates are allowed.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Access Control: Check if user is owner or accepted team member
            const accessRes = await client.query(`
                SELECT p.land_owner_id, pa.status as assignment_status
                FROM projects p
                LEFT JOIN projectassignments pa ON p.project_id = pa.project_id AND pa.user_id = $1
                WHERE p.project_id = $2
            `, [userId, id]);

            if (accessRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Project not found' });
            }

            const { land_owner_id, assignment_status } = accessRes.rows[0];
            const isOwner = land_owner_id === userId;
            const isTeamMember = assignment_status === 'Accepted';

            if (!isOwner && !isTeamMember) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'You do not have permission to update phases for this project.' });
            }

            // ─── Phase Sequential Validation (Industrial Reliability) ───
            const checkRes = await client.query('SELECT planning_completed, design_completed, execution_completed FROM projects WHERE project_id = $1', [id]);
            const projState = checkRes.rows[0];

            // A. Prevent Skipping Forward
            if (phase === 'design' && completed && !projState.planning_completed) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Sequence Violation: Planning must be completed before starting Design.' });
            }
            if (phase === 'execution' && completed && (!projState.planning_completed || !projState.design_completed)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Sequence Violation: Both Planning and Design must be completed before finalizing Execution.' });
            }

            // B. Prevent Regression Inconsistency
            if (phase === 'planning' && !completed && (projState.design_completed || projState.execution_completed)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Integrity Violation: Cannot re-open Planning while subsequent phases (Design/Execution) are finalized.' });
            }
            if (phase === 'design' && !completed && projState.execution_completed) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Integrity Violation: Cannot re-open Design while the project is in finished Execution status.' });
            }

            const column = `${phase}_completed`;

            // Dynamic Status: If finishing execution, mark project Completed. 
            // If reopening ANY phase, move status back to In Progress.
            let projectStatusUpdate = "";
            if (phase === 'execution' && completed) {
                projectStatusUpdate = ", status = 'Completed'";
            } else if (!completed) {
                projectStatusUpdate = ", status = 'In Progress'";
            }

            const result = await client.query(
                `UPDATE projects SET ${column} = $1, updated_at = CURRENT_TIMESTAMP ${projectStatusUpdate} WHERE project_id = $2 RETURNING *`,
                [completed, id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Project not found' });
            }

            // Also fetch tasks to return a fully enriched project
            const tasksRes = await client.query('SELECT status FROM tasks WHERE project_id = $1', [id]);
            const project = enrichProjectWithProgress(result.rows[0], [], tasksRes.rows);

            // Log Activity
            const loggingUserId = req.user.id;
            await logActivity(loggingUserId, id, 'Phase Updated', `${phase.charAt(0).toUpperCase() + phase.slice(1)} phase ${completed ? 'completed' : 'reopened'}`);

            if (phase === 'execution' && completed) {
                await logActivity(loggingUserId, id, 'Project Completed', `Final execution phase finished. Project is now marked as Completed.`);
            }

            await client.query('COMMIT');
            res.json(project);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error updating project phase:', err);
        res.status(500).json({ error: 'Failed to update phase' });
    }
});

// Submit Project Ratings
app.post('/api/projects/:projectId/rate', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { rater_id, ratings } = req.body; // ratings: [{ rated_user_id: string, rating: number }]

    if (!ratings || !Array.isArray(ratings)) return res.status(400).json({ error: 'Ratings are required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const r of ratings) {
            await client.query(
                `INSERT INTO ratings (project_id, rater_id, rated_user_id, rating) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (project_id, rater_id, rated_user_id) 
                 DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP`,
                [projectId, rater_id, r.rated_user_id, r.rating]
            );
        }
        await client.query('COMMIT');
        res.json({ message: 'Ratings submitted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Rating submission error:', err);
        res.status(500).json({ error: 'Failed to submit ratings' });
    } finally {
        client.release();
    }
});

// Get User Projects (Owner)
app.get('/api/projects/user/:userId', async (req, res) => {
    const { userId } = req.params;
    console.log(`[Project API] Fetching projects for user: ${userId}`);
    try {
        const result = await pool.query(`
            SELECT DISTINCT p.* FROM projects p
            LEFT JOIN lands l ON p.land_id = l.land_id
            WHERE (p.land_owner_id = $1)
               OR p.project_id IN (SELECT project_id FROM projectassignments WHERE user_id = $1 AND status = 'Accepted')
            ORDER BY p.created_at DESC
        `, [userId]);

        const projects = result.rows;
        const projectIds = projects.map(p => p.project_id);

        let tasks = [];
        let payments = [];
        if (projectIds.length > 0) {
            const tasksRes = await pool.query(`
                SELECT t.task_id, t.project_id, t.status, t.title, t.description, t.image_path, t.created_at, t.assigned_to, u.name as assigned_to_name, t.approved_at, t.submitted_at
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.user_id
                WHERE t.project_id = ANY($1)
            `, [projectIds]);
            tasks = tasksRes.rows;

            const payRes = await pool.query('SELECT amount, project_id, status FROM payments WHERE project_id = ANY($1)', [projectIds]);
            payments = payRes.rows;
        }

        const enriched = await Promise.all(projects.map(async (p) => {
            const pTasks = tasks.filter(t => t.project_id === p.project_id);
            const pPayments = payments.filter(pm => pm.project_id === p.project_id);

            const teamRes = await pool.query(`
                SELECT 
                    COALESCE(u.user_id, pp.id) as user_id, 
                    COALESCE(u.name, pp.name) as name, 
                    COALESCE(u.category, pp.category) as category, 
                    COALESCE(u.sub_category, pp.sub_category) as sub_category,
                    pa.assigned_role, pa.status
                FROM projectassignments pa
                LEFT JOIN users u ON pa.user_id = u.user_id
                LEFT JOIN PendingProfessionals pp ON pa.user_id = pp.id
                WHERE pa.project_id = $1 AND (pa.status = 'Accepted' OR pa.status = 'Pending')
            `, [p.project_id]);

            const enrichedP = enrichProjectWithProgress(p, teamRes.rows, pTasks, pPayments);
            enrichedP.team = teamRes.rows;

            const ratingCheck = await pool.query("SELECT EXISTS(SELECT 1 FROM ratings WHERE project_id = $1 AND rater_id = $2) as has_rated", [p.project_id, userId]);
            enrichedP.has_rated = ratingCheck.rows[0].has_rated;

            return enrichedP;
        }));

        res.json(enriched);
    } catch (err) {
        console.error('Error fetching user projects:', err);
        res.status(500).json({ error: 'Failed', details: err.message });
    }
});


/**
 * ??? LAND MANAGEMENT ROUTES
 * --------------------------------------------------------------------------
 */

app.post('/api/lands', upload.single('document'), async (req, res) => {
    const { owner_id, name, location, area, type, latitude, longitude } = req.body;

    try {
        let documents_path = null;
        if (req.file) {
            const category = req.body.category || 'Lands';
            const doc = await storeInDocuments(pool, {
                project_id: null,
                uploaded_by: owner_id,
                name: `Land Proof: ${name}`,
                file: req.file,
                category
            });
            documents_path = doc.file_path;
        }

        const result = await pool.query(
            'INSERT INTO lands (owner_id, name, location, area, type, latitude, longitude, documents_path, verification_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [owner_id, name, location, area, type, latitude || null, longitude || null, documents_path, 'Pending']
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
        const result = await pool.query(`
            SELECT l.*, a.status as auction_status, a.rejection_reason as auction_rejection_reason, a.current_highest_bid
            FROM lands l
            LEFT JOIN land_auctions a ON l.land_id = a.land_id
            WHERE l.owner_id = $1 
              AND NOT EXISTS (
                  SELECT 1 FROM land_auctions la 
                  WHERE la.land_id = l.land_id 
                    AND la.status = 'completed' 
                    AND la.winner_id IS NOT NULL 
                    AND la.winner_id != $1
              )
            ORDER BY l.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user lands:', err);
        res.status(500).json({ error: 'Failed to fetch lands' });
    }
});

// Update Land
app.put('/api/lands/:id', upload.single('document'), async (req, res) => {
    const { id } = req.params;
    const { name, location, area, type } = req.body;

    try {
        let queryStr = 'UPDATE lands SET name = $1, location = $2, area = $3, type = $4, updated_at = CURRENT_TIMESTAMP';
        const values = [name, location, area, type];
        let paramCount = 5;

        if (req.file) {
            queryStr += `, documents_path = $${paramCount}`;
            values.push(req.file.path.replace(/\\/g, "/"));
            paramCount++;
        }

        queryStr += ` WHERE land_id = $${paramCount} RETURNING *`;
        values.push(id);

        const result = await pool.query(queryStr, values);

        if (result.rowCount === 0) return res.status(404).json({ error: 'Land not found' });

        await logActivity(result.rows[0].owner_id, null, 'Land Updated', `Updated details for ${result.rows[0].name}`);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating land:', err);
        res.status(500).json({ error: 'Failed to update land' });
    }
});

// Delete Land
app.delete('/api/lands/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await pool.query('DELETE FROM lands WHERE land_id = $1 RETURNING *', [id]);
        if (deleted.rowCount === 0) return res.status(404).json({ error: 'Land not found' });

        await logActivity(deleted.rows[0].owner_id, null, 'Land Deleted', `Removed land: ${deleted.rows[0].name}`);

        res.json({ message: 'Land deleted successfully' });
    } catch (err) {
        console.error('Error deleting land:', err);
        res.status(500).json({ error: 'Failed to delete land' });
    }
});

// =============================================================================
// ADMIN LAND VERIFICATION ROUTES
// =============================================================================

// Get ALL lands (Admin) enriched with owner info
app.get('/api/admin/lands', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.*,
                u.name as owner_name,
                u.email as owner_email
            FROM lands l
            LEFT JOIN users u ON l.owner_id = u.user_id
            ORDER BY l.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin lands:', err);
        res.status(500).json({ error: 'Failed to fetch lands' });
    }
});

// Admin approves or rejects land document
app.put('/api/admin/lands/:landId/verify', async (req, res) => {
    const { landId } = req.params;
    const { status, rejection_reason } = req.body; // status: 'Verified' | 'Rejected'

    if (!['Verified', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be Verified or Rejected' });
    }

    try {
        const updatedRes = await pool.query(
            'UPDATE lands SET verification_status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE land_id = $3 RETURNING *',
            [status, status === 'Rejected' ? (rejection_reason || 'No reason provided') : null, landId]
        );

        if (updatedRes.rowCount === 0) return res.status(404).json({ error: 'Land not found' });

        const updated = updatedRes.rows[0];
        await logActivity(updated.owner_id, null, `Land Document ${status}`, `Land "${updated.name}" document ${status.toLowerCase()} by admin`);
        res.json(updated);
    } catch (err) {
        console.error('Error verifying land:', err);
        res.status(500).json({ error: 'Failed to verify land' });
    }
});


/**

 * ?? Fetch Project Messages
 * Endpoint: GET /api/messages/:projectId
 * 
 * Retrieves secure, project-scoped chat history. Uses LEFT JOIN to pull
 * full display names for both the Sender and the Receiver.
 */
app.get('/api/messages/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                m.*,
                s.name AS sender_name,
                r.name AS receiver_name
            FROM messages m
            LEFT JOIN users s ON m.sender_id = s.user_id
            LEFT JOIN users r ON m.receiver_id = r.user_id
            WHERE m.project_id = $1
            ORDER BY m.created_at ASC
        `, [projectId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { project_id, sender_id, receiver_id, text } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO messages (project_id, sender_id, receiver_id, text, is_read) VALUES ($1, $2, $3, $4, false) RETURNING *',
            [project_id, sender_id, receiver_id, text]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * ?? SITE PROGRESS & MONITORING ROUTES
 * --------------------------------------------------------------------------
 */

/**
 * ?? Fetch Site Progress Timeline
 * Endpoint: GET /api/site-progress/:projectId
 * 
 * Used by all roles to view the chronological feed of site updates.
 */
app.get('/api/site-progress/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM siteprogress WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching site progress:', err);
        res.status(500).json({ error: 'Failed to fetch progress updates' });
    }
});

/**
 * ?? Upload Site Progress Update
 * Endpoint: POST /api/site-progress
 * 
 * Used primarily by SiteWorkers (Masons, Engineers) to upload photographic evidence
 * of completed tasks. Integrates `multer` to intercept image attachments before inserting rows.
 */
app.post('/api/site-progress', authenticateToken, upload.single('image'), async (req, res) => {
    const { project_id, updated_by, note, alert_type } = req.body;

    try {
        const checkStatusRes = await pool.query('SELECT status FROM projects WHERE project_id = $1', [project_id]);
        if (checkStatusRes.rows.length > 0 && checkStatusRes.rows[0].status === 'Completed') {
            return res.status(403).json({ error: 'This project is finalized. No further site progress updates are permitted.' });
        }
        let image_path = null;
        if (req.file) {
            const category = req.body.category || 'SiteProgress';
            const doc = await storeInDocuments(pool, {
                project_id,
                uploaded_by: updated_by,
                name: `Site Progress: ${note ? note.substring(0, 20) : 'Update'}`,
                file: req.file,
                category,
                source_type: 'site_progress'
            });
            image_path = doc.file_path;
        }

        const result = await pool.query(
            'INSERT INTO siteprogress (project_id, updated_by, note, image_path, alert_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [project_id, updated_by, note, image_path, alert_type || null, 'Pending']
        );
        await logActivity(updated_by, project_id, 'Site Progress Updated', note);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding site progress:', err);
        res.status(500).json({ error: 'Failed to add progress update' });
    }
});

/**
 * ??? Review Site Progress (Contractor Control)
 * Endpoint: PUT /api/site-progress/:progressId/review
 */
app.put('/api/site-progress/:progressId/review', authenticateToken, async (req, res) => {
    const { progressId } = req.params;
    const { status, rejection_reason, contractor_id } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            'UPDATE siteprogress SET status = $1, rejection_reason = $2 WHERE progress_id = $3 RETURNING *',
            [status, status === 'Rejected' ? (rejection_reason || null) : null, progressId]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Progress update not found' });

        const updated = result.rows[0];
        await logActivity(contractor_id || null, updated.project_id, 'Progress Reviewed', `Status: ${status}`);
        res.json(updated);
    } catch (err) {
        console.error('Error reviewing site progress:', err);
        res.status(500).json({ error: 'Failed to review progress' });
    }
});

// --- Project Phase Routes ---

app.get('/api/projects/:projectId/phases', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM projectphases WHERE project_id = $1 ORDER BY sequence_order ASC', [projectId]);
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
        // [Validation] Ensure start_date is before or equal to end_date
        if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ error: 'Start date cannot be after the end date.' });
        }

        const result = await pool.query(
            'INSERT INTO projectphases (project_id, title, status, start_date, end_date, sequence_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
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
            'UPDATE projectphases SET status = COALESCE($1, status), title = COALESCE($2, title), sequence_order = COALESCE($3, sequence_order) WHERE phase_id = $4 RETURNING *',
            [status || null, title || null, sequence_order !== undefined ? sequence_order : null, phaseId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Phase not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating project phase:', err);
        res.status(500).json({ error: 'Failed to update project phase' });
    }
});

// =============================================================================
// TASK MANAGEMENT ROUTES
// =============================================================================

// Assign a task to a team member (Contractor)
app.post('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { assigned_by, assigned_to, title, description, due_date } = req.body;

    if (!assigned_to || !title) {
        return res.status(400).json({ error: 'assigned_to and title are required' });
    }

    try {
        const checkStatusRes = await pool.query('SELECT status FROM projects WHERE project_id = $1', [projectId]);
        if (checkStatusRes.rows.length > 0 && checkStatusRes.rows[0].status === 'Completed') {
            return res.status(403).json({ error: 'This project is completed and locked. Task assignments are no longer permitted.' });
        }

        // [Validation] Prevent due dates in the past
        if (due_date && due_date.trim() !== "") {
            const selectedDate = new Date(due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                return res.status(400).json({ error: 'Task due date cannot be in the past.' });
            }
        }

        const result = await pool.query(
            'INSERT INTO tasks (project_id, assigned_by, assigned_to, title, description, due_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [projectId, assigned_by, assigned_to, title, description || '', due_date || null, 'Pending']
        );
        const task = result.rows[0];

        const assignerRes = await pool.query('SELECT name FROM users WHERE user_id = $1', [assigned_by]);
        const assignerName = assignerRes.rows[0]?.name || 'Contractor';

        await logActivity(assigned_by, projectId, 'Task Assigned', `Task "${title}" assigned to team member`);

        // Notify the assignee
        await createNotification(
            assigned_to,
            'task_assignment',
            `${assignerName} has assigned you a task: ${title}`,
            `/dashboard/tasks`,
            projectId
        );

        res.status(201).json(task);
    } catch (err) {
        console.error('Error assigning task:', err);
        res.status(500).json({ error: 'Failed to assign task' });
    }
});

// Get all tasks for a project
app.get('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(`
            SELECT t.*, u.name AS assignee_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.user_id
            WHERE t.project_id = $1
            ORDER BY t.created_at DESC
        `, [projectId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create a new task (Contractor)
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { project_id, assigned_by, assigned_to, title, description, due_date } = req.body;

    if (!project_id || !assigned_to || !title) {
        return res.status(400).json({ error: 'project_id, assigned_to and title are required' });
    }

    try {
        // [Security] Prevent assigning tasks to completed projects
        const projectCheck = await pool.query('SELECT status, land_id FROM projects WHERE project_id = $1', [project_id]);
        if (projectCheck.rows.length > 0) {
            if (projectCheck.rows[0].status === 'Completed') {
                return res.status(403).json({ error: 'Cannot assign tasks to a completed project' });
            }

            // [Security] Prevent tasks if land is currently being auctioned
            if (projectCheck.rows[0].land_id) {
                const landAuctionCheck = await pool.query("SELECT status FROM land_auctions WHERE land_id = $1 AND status = 'active'", [projectCheck.rows[0].land_id]);
                if (landAuctionCheck.rows.length > 0) {
                    return res.status(403).json({ error: 'Operations are suspended while this property is in an active auction.' });
                }
            }
        }

        // [Validation] Prevent due dates in the past
        if (due_date && due_date.trim() !== "") {
            const selectedDate = new Date(due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                return res.status(400).json({ error: 'Task due date cannot be in the past.' });
            }
        }

        const result = await pool.query(
            'INSERT INTO tasks (project_id, assigned_by, assigned_to, title, description, due_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [project_id, assigned_by, assigned_to, title, description || '', due_date || null, 'Pending']
        );
        const task = result.rows[0];

        const [assignerRes, pendingAssignerRes] = await Promise.all([
            pool.query('SELECT name FROM users WHERE user_id = $1', [assigned_by]),
            pool.query('SELECT name FROM PendingProfessionals WHERE id = $1', [assigned_by])
        ]);
        const assignerName = assignerRes.rows[0]?.name || pendingAssignerRes.rows[0]?.name || 'An Associate';

        await logActivity(assigned_by, project_id, 'Task Assigned', `Task "${title}" assigned to team member`);

        // Notify the assignee
        await createNotification(
            assigned_to,
            'task_assignment',
            `${assignerName} has assigned you a new task: "${title}"`,
            `/dashboard/tasks`,
            project_id
        );

        // Fetch project owner and contractor to notify them too (if they aren't the assigner)
        const projectInfo = await pool.query('SELECT land_owner_id FROM projects WHERE project_id = $1', [project_id]);
        const ownerId = projectInfo.rows[0]?.land_owner_id;

        const contractorRes = await pool.query(`SELECT user_id FROM projectassignments WHERE project_id = $1 AND assigned_role ILIKE 'contractor' AND status = 'Accepted'`, [project_id]);
        const contractorId = contractorRes.rows[0]?.user_id;

        const managersToNotify = new Set([ownerId, contractorId]);
        for (const managerId of managersToNotify) {
            if (managerId && String(managerId) !== String(assigned_by) && String(managerId) !== String(assigned_to)) {
                await createNotification(
                    managerId,
                    'task_update',
                    `${assignerName} has created a new task "${title}" for a team member.`,
                    `/dashboard/tasks`,
                    project_id
                );
            }
        }

        res.status(201).json(task);
    } catch (err) {
        console.error('Error assigning task:', err);
        res.status(500).json({ error: 'Failed to assign task' });
    }
});

// Get tasks assigned to a specific user (Worker/Professional)
app.get('/api/tasks/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                t.*, 
                p.name AS project_name, 
                l.location AS location,
                u.name AS assigner_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.project_id
            LEFT JOIN lands l ON p.land_id = l.land_id
            LEFT JOIN users u ON t.assigned_by = u.user_id
            WHERE t.assigned_to = $1 
            ORDER BY t.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user tasks:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get tasks that a project manager (Contractor or Landowner) needs to review (Submitted status)
app.get('/api/tasks/to-review/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        // Find tasks where:
        // 1. User is the one who assigned it
        // 2. User is the Landowner of the project
        // 3. User is the Contractor accepted on the project
        const result = await pool.query(`
            SELECT DISTINCT
                t.*, 
                p.name AS project_name, 
                l.location AS location,
                u.name AS assignee_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.project_id
            LEFT JOIN lands l ON p.land_id = l.land_id
            LEFT JOIN users u ON t.assigned_to = u.user_id
            LEFT JOIN projectassignments pa ON pa.project_id = t.project_id AND pa.assigned_role ILIKE 'contractor' AND pa.status = 'Accepted'
            WHERE (t.assigned_by = $1::uuid OR p.land_owner_id = $1::uuid OR pa.user_id = $1::uuid) 
              AND t.status = 'Submitted'
            ORDER BY t.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tasks to review:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get tasks that a contractor has assigned to others (Manage Assignments)
app.get('/api/tasks/assigned-by/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT DISTINCT
                t.*, 
                p.name AS project_name, 
                l.location AS location,
                u.name AS assignee_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.project_id
            LEFT JOIN lands l ON p.land_id = l.land_id
            LEFT JOIN users u ON t.assigned_to = u.user_id
            LEFT JOIN projectassignments pa ON pa.project_id = t.project_id AND pa.assigned_role ILIKE 'contractor' AND pa.status = 'Accepted'
            WHERE t.assigned_by = $1::uuid OR p.land_owner_id = $1::uuid OR pa.user_id = $1::uuid
            ORDER BY t.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('[Tasks Assigned-By Error]:', err);
        res.status(500).json({ error: 'Failed to fetch tasks assigned by you or your subordinates.' });
    }
});

// Worker submits completed task with site photo/document
app.put('/api/tasks/:taskId/submit', authenticateToken, upload.single('file'), async (req, res) => {
    const { taskId } = req.params;
    const { user_id } = req.body;

    try {
        const verifyRes = await pool.query('SELECT assigned_to, project_id, title FROM tasks WHERE task_id = $1::uuid', [taskId]);
        if (verifyRes.rowCount === 0) return res.status(404).json({ error: 'Task not found' });

        const task = verifyRes.rows[0];
        if (task.assigned_to !== user_id) return res.status(403).json({ error: 'Not authorized' });

        const category = req.body.category || 'General';
        // Store proof in central Documents table for database-backed sharing
        const doc = await storeInDocuments(pool, {
            project_id: task.project_id,
            uploaded_by: user_id,
            name: `Task Proof: ${task.title}`,
            file: req.file,
            category: category,
            source_type: 'task_proof',
            source_id: taskId
        });

        const result = await pool.query(
            'UPDATE tasks SET status = $1, image_path = $2, rejection_reason = NULL, submitted_at = CURRENT_TIMESTAMP WHERE task_id = $3::uuid RETURNING *',
            ['Submitted', doc.file_path, taskId]
        );

        await logActivity(user_id, task.project_id, 'Task Submitted', `Task "${task.title}" submitted with proof`);

        // Notify the assigner (Contractor/Landowner)
        const assigneeRes = await pool.query('SELECT name FROM users WHERE user_id = $1::uuid', [user_id]);
        const assigneeName = assigneeRes.rows[0]?.name || 'Professional';

        const taskInfoRes = await pool.query(`
            SELECT t.assigned_by, t.title, p.land_owner_id 
            FROM tasks t 
            JOIN projects p ON t.project_id = p.project_id 
            WHERE t.task_id = $1::uuid
            `, [taskId]);

        if (taskInfoRes.rows.length > 0) {
            const { assigned_by, title, land_owner_id, project_id } = taskInfoRes.rows[0];

            // 1. Notify the specific person who assigned the task
            await createNotification(
                assigned_by,
                'task_completion',
                `${assigneeName} has completed and submitted the task: "${title}".`,
                `/dashboard/tasks`,
                project_id
            );

            // 2. Notify Landowner if they weren't the assigner
            if (land_owner_id !== assigned_by) {
                await createNotification(
                    land_owner_id,
                    'task_completion',
                    `Professional ${assigneeName} has submitted work for "${title}".Review needed.`,
                    `/dashboard/tasks`,
                    project_id
                );
            }

            // 3. Notify Contractor if they weren't the assigner or landowner
            const contractorRes = await pool.query(`
                SELECT user_id FROM projectassignments 
                WHERE project_id = $1::uuid AND assigned_role ILIKE 'contractor' AND status = 'Accepted' 
                AND user_id != $2::uuid AND user_id != $3::uuid
            `, [project_id, assigned_by, land_owner_id]);

            if (contractorRes.rows.length > 0) {
                await createNotification(
                    contractorRes.rows[0].user_id,
                    'task_completion',
                    `Professional ${assigneeName} submitted work for "${title}".Review needed.`,
                    `/dashboard/tasks`,
                    project_id
                );
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error submitting task:', err);
        res.status(500).json({ error: 'Failed to submit task' });
    }
});

// Contractor reviews (approves/rejects) a submitted task
app.put('/api/tasks/:taskId/review', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { status, rejection_reason, reviewer_id } = req.body;
    let { due_date } = req.body;

    const actionUserId = req.user?.user_id || req.user?.id || reviewer_id;

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be Approved or Rejected' });
    }

    // [Validation] Prevent empty string dates from breaking Postgres cast and prevent past dates
    if (due_date && due_date.trim() !== "") {
        const selectedDate = new Date(due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            return res.status(400).json({ error: 'Correction deadline cannot be in the past.' });
        }
    } else {
        due_date = null; // Convert empty string to null for clean DB update
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const authCheck = await client.query(`
                SELECT t.assigned_by, p.land_owner_id, t.project_id, t.assigned_to, t.title, t.image_path, t.description,
                (SELECT 1 FROM projectassignments pa WHERE pa.project_id = t.project_id AND pa.user_id = $1::uuid AND pa.assigned_role ILIKE 'contractor' AND pa.status = 'Accepted') as is_contractor
                FROM tasks t
                JOIN projects p ON t.project_id = p.project_id
                WHERE t.task_id = $2::uuid
    `, [actionUserId, taskId]);

            if (authCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Task not found' });
            }

            const { assigned_by, land_owner_id, is_contractor, project_id, assigned_to, title, image_path, description } = authCheck.rows[0];
            const isManager = String(actionUserId) === String(assigned_by) || String(actionUserId) === String(land_owner_id) || !!is_contractor;

            if (!isManager) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'Unauthorized: Only project managers can review this task.' });
            }

            const result = await client.query(
                `UPDATE tasks SET 
                    status = $1::text, 
                    rejection_reason = $2::text, 
                    due_date = COALESCE($3::date, due_date), 
                    approved_at = CASE WHEN $1::text = 'Approved' THEN CURRENT_TIMESTAMP ELSE approved_at END 
                WHERE task_id = $4::uuid 
                RETURNING *`,
                [status, status === 'Rejected' ? (rejection_reason || 'No reason provided') : null, status === 'Rejected' ? (due_date || null) : null, taskId]
            );

            const task = result.rows[0];

            if (status === 'Approved') {
                await client.query(
                    'INSERT INTO siteprogress (project_id, updated_by, note, image_path, alert_type, status) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)',
                    [project_id, assigned_to, `Completed Task: ${title}. ${description || ''} `, image_path, 'Completion', 'Approved']
                );
            }

            await logActivity(actionUserId, project_id, `Task ${status} `, `Task "${title}" ${status.toLowerCase()} by manager`);

            const reviewerRes = await client.query('SELECT name FROM users WHERE user_id = $1::uuid', [actionUserId]);
            const reviewerName = reviewerRes.rows[0]?.name || 'Manager';

            const isRejected = status === 'Rejected';
            await createNotification(
                assigned_to,
                isRejected ? 'task_rejection' : 'task_approval',
                isRejected
                    ? `Task "${title}" was REJECTED by ${reviewerName}. Reason: "${rejection_reason || 'No reason specified'}". New Deadline: ${due_date || 'None'}.`
                    : `Your task "${title}" has been APPROVED by ${reviewerName}. Project progress updated.`,
                `/dashboard/tasks`,
                project_id
            );

            const contractorRes = await client.query(`SELECT user_id FROM projectassignments WHERE project_id = $1::uuid AND assigned_role ILIKE 'contractor' AND status = 'Accepted'`, [project_id]);
            const contractor_id = contractorRes.rows[0]?.user_id;

            if (land_owner_id && String(land_owner_id) !== String(actionUserId) && String(land_owner_id) !== String(assigned_to)) {
                await createNotification(
                    land_owner_id,
                    'task_update',
                    `Task "${title}" has been ${status.toLowerCase()} by ${reviewerName}.`,
                    `/dashboard/tasks`,
                    project_id
                );
            }

            if (contractor_id && String(contractor_id) !== String(actionUserId) && String(contractor_id) !== String(assigned_to)) {
                await createNotification(
                    contractor_id,
                    'task_update',
                    `Task "${title}" has been ${status.toLowerCase()} by ${reviewerName}.`,
                    `/dashboard/tasks`,
                    project_id
                );
            }

            // Sync with assigned_by if they are someone else (e.g. an architect who assigned a task)
            if (assigned_by && String(assigned_by) !== String(actionUserId) && String(assigned_by) !== String(land_owner_id) && String(assigned_by) !== String(contractor_id) && String(assigned_by) !== String(assigned_to)) {
                await createNotification(
                    assigned_by,
                    'task_update',
                    `Your assigned task "${title}" has been ${status.toLowerCase()} by ${reviewerName}.`,
                    `/dashboard/tasks`,
                    project_id
                );
            }

            await client.query('COMMIT');
            res.json(task);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error reviewing task:', err);
        res.status(500).json({ error: 'Failed to review task: ' + err.message });
    }
});

// Extend Task Deadline
app.patch('/api/tasks/:taskId/extend-deadline', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { new_due_date, reviewer_id } = req.body;

    const actionUserId = req.user?.user_id || req.user?.id || reviewer_id;

    // [Validation] Prevent due dates in the past
    if (new_due_date && new_due_date.trim() !== "") {
        const selectedDate = new Date(new_due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            return res.status(400).json({ error: 'Extended deadline cannot be in the past.' });
        }
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const authCheck = await client.query(`
                SELECT t.*, p.land_owner_id, p.name as project_name, u.name as assignee_name, u.email as assignee_email
                FROM tasks t
                JOIN projects p ON t.project_id = p.project_id
                JOIN users u ON t.assigned_to = u.user_id
                WHERE t.task_id = $1::uuid
    `, [taskId]);

            if (authCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Task not found' });
            }

            const task = authCheck.rows[0];
            const is_contractor = (await client.query(`
                SELECT 1 FROM projectassignments pa 
                WHERE pa.project_id = $1::uuid AND pa.user_id = $2::uuid AND pa.assigned_role ILIKE 'contractor' AND pa.status = 'Accepted'
    `, [task.project_id, actionUserId])).rows.length > 0;

            const isAuthorized = String(actionUserId) === String(task.assigned_by) || String(actionUserId) === String(task.land_owner_id) || is_contractor;

            if (!isAuthorized) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'Unauthorized to extend deadline' });
            }

            await client.query('UPDATE tasks SET due_date = $1::date WHERE task_id = $2::uuid', [new_due_date, taskId]);

            // Notify Assignee
            const notificationMsg = `Update: The deadline for your task "${task.title}" in project "${task.project_name}" has been extended to ${new Date(new_due_date).toLocaleDateString()}.`;
            await createNotification(task.assigned_to, 'task_update', notificationMsg, `/dashboard/tasks`, taskId);

            await client.query('COMMIT');
            res.json({ message: 'Deadline extended successfully', new_due_date });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error extending task deadline:', err);
        res.status(500).json({ error: 'Failed to extend deadline' });
    }
});

// Get Pending task count for a user (notifications)
app.get('/api/tasks/pending-count/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        if (!req.user || (req.user.user_id !== userId && req.user.id !== userId)) {
            // Basic security check or just use req.user.role directly
        }
        const role = req.user.role;
        let count = 0;

        const normalizedRole = String(role || '').toLowerCase();
        if (normalizedRole === 'contractor' || normalizedRole === 'land_owner' || normalizedRole === 'land owner') {
            const resSub = await pool.query(`
                SELECT COUNT(DISTINCT t.task_id) 
                FROM tasks t
                LEFT JOIN projects p ON t.project_id = p.project_id
                LEFT JOIN projectassignments pa ON pa.project_id = t.project_id AND pa.assigned_role ILIKE 'contractor' AND pa.status = 'Accepted'
                WHERE t.status = 'Submitted' 
                AND (t.assigned_by = $1::uuid OR p.land_owner_id = $1::uuid OR pa.user_id = $1::uuid)
            `, [userId]);
            count = parseInt(resSub.rows[0].count);
        } else {
            const resPend = await pool.query("SELECT COUNT(*) FROM tasks WHERE assigned_to = $1::uuid AND (status = 'Pending' OR status = 'Rejected')", [userId]);
            count = parseInt(resPend.rows[0].count);
        }

        res.json({ count });
    } catch (err) {
        console.error('Error fetching task count:', err);
        res.json({ count: 0 });
    }
});

// Delete a task (Contractor)
app.delete('/api/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = await pool.query('DELETE FROM tasks WHERE task_id = $1 RETURNING *', [taskId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});



// Update Document Status (Approve/Reject)
app.put('/api/documents/:docId/status', async (req, res) => {
    const { docId } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            'UPDATE Documents SET status = $1, rejection_reason = $2 WHERE doc_id = $3 RETURNING *',
            [status, rejection_reason || null, docId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const doc = result.rows[0];
        await logActivity(null, doc.project_id, 'Document Status Update', `Document "${doc.name}" updated to ${status} `);

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

    // Construct relative path for DB: uploads/category/filename
    const category = req.body.category || 'General';
    const filePath = req.file ? `uploads / ${category}/${req.file.filename}` : null;
    const fileSize = (req.file.size / 1024).toFixed(2) + ' KB';
    const fileType = path.extname(req.file.originalname).substring(1).toUpperCase();

    try {
        const doc = await storeInDocuments(pool, {
            project_id,
            uploaded_by,
            name: name || req.file.originalname,
            file: req.file,
            category: category
        });

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
        // Construct absolute path for disk operation using process.cwd()
        const absolutePath = path.resolve(process.cwd(), doc.file_path);

        // Remove file from disk
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }

        await pool.query('DELETE FROM Documents WHERE doc_id = $1', [id]);
        logActivity(doc.uploaded_by, doc.project_id, 'Document Deleted', `Deleted: ${doc.name}`);
        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Get Project Documents (Unified View)
app.get('/api/documents/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(`
            -- Real documents uploaded to Documents table (only main ones)
            SELECT doc_id, name, file_path, file_type, file_size, status, created_at, 'document' as source_type
            FROM Documents WHERE project_id = $1 AND source_type = 'document'
            
            UNION ALL
            
            -- Architect drawings
            SELECT drawing_id as doc_id, title as name, file_path, 'DRAWING' as file_type, 'N/A' as file_size, 'Approved' as status, created_at, 'drawing' as source_type
            FROM architect_drawings WHERE project_id = $1
            
            UNION ALL
            
            -- Task submission proofs
            SELECT task_id as doc_id, title as name, image_path as file_path, 'TASK_PROOF' as file_type, 'N/A' as file_size, 
                   CASE WHEN status = 'Submitted' THEN 'Pending' ELSE status END as status, 
                   created_at, 'task' as source_type
            FROM tasks WHERE project_id = $1 AND image_path IS NOT NULL
            
            UNION ALL
            
            -- Site progress photos
            SELECT progress_id as doc_id, note as name, image_path as file_path, 'SITE_PHOTO' as file_type, 'N/A' as file_size, 
                   status, created_at, 'progress' as source_type
            FROM siteprogress WHERE project_id = $1 AND image_path IS NOT NULL
            
            ORDER BY created_at DESC
        `, [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// --- Architect Drawings Routes ---

// Upload Drawing
app.post('/api/drawings', upload.single('file'), async (req, res) => {
    const { architect_id, project_id, title, description, category, is_team_project } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No drawing file uploaded' });

    try {
        const uploadCategory = category || 'Drawings';
        const doc = await storeInDocuments(pool, {
            project_id: project_id || null,
            uploaded_by: architect_id,
            name: title,
            file: req.file,
            category: uploadCategory,
            source_type: 'drawing'
        });

        const result = await pool.query(
            'INSERT INTO architect_drawings (architect_id, project_id, title, description, file_path, category, is_team_project) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [architect_id, project_id || null, title, description, doc.file_path, uploadCategory, is_team_project === 'true']
        );
        const drawing = result.rows[0];
        logActivity(architect_id, project_id || null, 'Drawing Uploaded', `Uploaded drawing: ${title}`);
        res.status(201).json(drawing);
    } catch (err) {
        console.error('Error uploading drawing:', err);
        res.status(500).json({ error: 'Failed to upload drawing' });
    }
});

// Get Architect Drawings
app.get('/api/drawings/:architectId', async (req, res) => {
    const { architectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM architect_drawings WHERE architect_id = $1 ORDER BY created_at DESC', [architectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching drawings:', err);
        res.status(500).json({ error: 'Failed to fetch drawings' });
    }
});

// Update Drawing
app.put('/api/drawings/:drawingId', async (req, res) => {
    const { drawingId } = req.params;
    const { title, description, category, is_team_project } = req.body;
    try {
        const result = await pool.query(
            'UPDATE architect_drawings SET title = $1, description = $2, category = $3, is_team_project = $4, updated_at = CURRENT_TIMESTAMP WHERE drawing_id = $5 RETURNING *',
            [title, description, category, is_team_project, drawingId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Drawing not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating drawing:', err);
        res.status(500).json({ error: 'Failed to update drawing' });
    }
});

// Delete Drawing
app.delete('/api/drawings/:drawingId', async (req, res) => {
    const { drawingId } = req.params;
    try {
        const findResult = await pool.query('SELECT * FROM architect_drawings WHERE drawing_id = $1', [drawingId]);
        if (findResult.rowCount === 0) return res.status(404).json({ error: 'Drawing not found' });

        const drawing = findResult.rows[0];
        const absolutePath = path.resolve(process.cwd(), drawing.file_path);

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }

        await pool.query('DELETE FROM architect_drawings WHERE drawing_id = $1', [drawingId]);
        res.json({ message: 'Drawing deleted successfully' });
    } catch (err) {
        console.error('Error deleting drawing:', err);
        res.status(500).json({ error: 'Failed to delete drawing' });
    }
});

// --- Activity Routes ---
app.get('/api/activity/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(`
            SELECT a.*, COALESCE(u.name, 'System User') AS user_name
            FROM activitylog a
            LEFT JOIN users u ON a.user_id = u.user_id
            WHERE a.project_id = $1
            ORDER BY a.created_at DESC
        `, [projectId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching activity:', err);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// --- Smart Ledger: Payment Routes ---

/**
 * ?? Create Modular Payment Request
 * Supports: Quote-Based, Wages, Material, and Ad-hoc.
 * Hierarchical Logic: 
 * - If payee hired by contractor -> contractor is payer.
 * - If payee hired by owner -> owner is payer.
 */
app.post('/api/payments', authenticateToken, upload.single('proof'), async (req, res) => {
    const {
        project_id, receiver_id, type, amount,
        reference_id, notes, wage_days, invoice_number, status
    } = req.body;
    const initiator_id = req.user.user_id || req.user.id;

    try {
        // [Hierarchy Step] Determine the responsible payer
        const assignmentRes = await pool.query(
            'SELECT assigned_by FROM projectassignments WHERE project_id = $1 AND user_id = $2',
            [project_id, receiver_id]
        );

        let target_payer_id = assignmentRes.rows.length > 0 ? assignmentRes.rows[0].assigned_by : null;
        if (!target_payer_id) {
            const projectRes = await pool.query('SELECT land_owner_id FROM projects WHERE project_id = $1', [project_id]);
            target_payer_id = projectRes.rows[0]?.land_owner_id;
        }

        // If the initiator belongs to a "Payer" role and is recording a payout...
        // we can override the status to 'paid' or whatever they specified.
        const isAuthorityInitiator = (initiator_id === target_payer_id);
        const finalStatus = status || (isAuthorityInitiator ? 'paid' : 'pending_review');

        let proof_path = null;
        if (req.file) {
            const doc = await storeInDocuments(pool, {
                project_id,
                uploaded_by: initiator_id,
                name: `Payment Proof: ${type.toUpperCase()} - ${invoice_number || 'Record'}`,
                file: req.file,
                category: 'Financial',
                source_type: 'payment_record'
            });
            proof_path = doc.file_path;
        }

        const result = await pool.query(
            `INSERT INTO payments 
            (project_id, sender_id, receiver_id, amount, type, status, reference_id, description, proof_image_path, notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                project_id,
                target_payer_id,
                receiver_id,
                amount,
                type || 'adhoc',
                finalStatus,
                reference_id || null,
                notes || `${type.toUpperCase()} - ${invoice_number || 'Ref'}`,
                proof_path,
                notes
            ]
        );
        const payment = result.rows[0];

        // Notifications
        if (finalStatus === 'pending_review') {
            const senderRes = await pool.query('SELECT name FROM users WHERE user_id = $1', [initiator_id]);
            await createNotification(
                target_payer_id,
                'payment_request',
                `${senderRes.rows[0]?.name || 'Professional'} submitted a request for ₹${parseFloat(amount).toLocaleString()}.`,
                '/dashboard/payments',
                project_id
            );
        } else if (finalStatus === 'paid') {
            await createNotification(
                receiver_id,
                'payment_received',
                `A payout of ₹${parseFloat(amount).toLocaleString()} has been recorded in your ledger. Status: PAID`,
                '/dashboard/payments',
                project_id
            );
        }

        await logActivity(initiator_id, project_id, isAuthorityInitiator ? 'Payment Recorded' : 'Payment Requested', `${type.toUpperCase()} for ₹${amount}`);
        res.status(201).json(payment);
    } catch (err) {
        console.error('Smart Ledger: Persistence Error:', err);
        res.status(500).json({ error: 'System failed to finalize ledger entry.' });
    }
});

/**
 * ?? Approve/Pay Ledger Instruction
 * PATCH /api/payments/:id
 */
app.patch('/api/payments/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, notes, amount } = req.body;
    const action_user_id = req.user.user_id || req.user.id;

    try {
        const result = await pool.query(
            `UPDATE payments 
             SET status = COALESCE($1, status), 
                 notes = COALESCE($2, notes), 
                 amount = COALESCE($3, amount),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE payment_id = $4 RETURNING *`,
            [status || null, notes || null, amount !== undefined ? amount : null, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Ledger entry not found.' });
        const updated = result.rows[0];

        // Notify the Payee (Professional/Worker)
        const actionName = status === 'paid' ? 'marked as PAID' : status.toLowerCase();
        await createNotification(
            updated.receiver_id,
            'payment_update',
            `Your payment request for ₹${parseFloat(updated.amount).toLocaleString()} has been ${actionName}.`,
            '/dashboard/payments',
            updated.project_id
        );

        await logActivity(action_user_id, updated.project_id, 'Payment Updated', `Instruction ID ${id} set to ${status}`);
        res.json(updated);
    } catch (err) {
        console.error('Smart Ledger: Update Error:', err);
        res.status(500).json({ error: 'Failed to update ledger instruction.' });
    }
});

/**
 * ?? Fetch Ledger History (Project or User Scoped)
 */
app.get('/api/payments/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { project_id } = req.query;

    try {
        let query;
        let params;

        if (project_id) {
            // [Security & Visibility] If project_id is provided, show ALL payments for that project.
            // Authority check: User must be either the owner or assigned to the project.
            const accessCheck = await pool.query(
                `SELECT 1 FROM projects WHERE project_id = $1 AND (land_owner_id = $2 OR project_id IN (SELECT project_id FROM projectassignments WHERE user_id = $2))`,
                [project_id, userId]
            );

            if (accessCheck.rowCount === 0) return res.status(403).json({ error: 'Access denied to this project ledger.' });

            query = `
                SELECT p.*, 
                       s.name as sender_name, s.category as sender_role,
                       r.name as receiver_name, r.category as receiver_role,
                       pr.name as project_name
                FROM payments p
                LEFT JOIN users s ON p.sender_id = s.user_id
                LEFT JOIN users r ON p.receiver_id = r.user_id
                JOIN projects pr ON p.project_id = pr.project_id
                WHERE p.project_id = $1
                ORDER BY p.created_at DESC
            `;
            params = [project_id];
        } else {
            // Show only user-related payments if no specific project selected
            query = `
                SELECT p.*, 
                       s.name as sender_name, s.category as sender_role,
                       r.name as receiver_name, r.category as receiver_role,
                       pr.name as project_name
                FROM payments p
                LEFT JOIN users s ON p.sender_id = s.user_id
                LEFT JOIN users r ON p.receiver_id = r.user_id
                JOIN projects pr ON p.project_id = pr.project_id
                WHERE (p.sender_id = $1 OR p.receiver_id = $1)
                ORDER BY p.created_at DESC
            `;
            params = [userId];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Smart Ledger: Fetch Error:', err);
        res.status(500).json({ error: 'Failed to access financial repository.' });
    }
});

// Summary Endpoint for Financial Progress
app.get('/api/payments/summary/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const statsRes = await pool.query(`
            SELECT 
                SUM(amount) as total_budget_applied,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_spent,
                SUM(CASE WHEN status = 'pending_review' THEN amount ELSE 0 END) as pending_review,
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_unpaid,
                SUM(CASE WHEN type = 'wage' AND status = 'paid' THEN amount ELSE 0 END) as wages_spent,
                SUM(CASE WHEN type = 'material' AND status = 'paid' THEN amount ELSE 0 END) as materials_spent,
                SUM(CASE WHEN (type = 'quote' OR type = 'adhoc') AND status = 'paid' THEN amount ELSE 0 END) as fees_spent
            FROM payments
            WHERE project_id = $1
        `, [projectId]);

        const projectBudgetRes = await pool.query('SELECT budget FROM projects WHERE project_id = $1', [projectId]);

        res.json({
            stats: statsRes.rows[0],
            total_budget: projectBudgetRes.rows[0]?.budget || 0
        });
    } catch (err) {
        console.error('Smart Ledger: Summary Error:', err);
        res.status(500).json({ error: 'Failed to generate financial report.' });
    }
});

// --- Admin Routes ---

// Get All Users (Strategic Directory: Professionals + Owners + Pending)
app.get('/api/admin/users', async (req, res) => {
    try {
        const usersQuery = `
            SELECT user_id, name, email, category, sub_category, status, profile_completed, 
                   rejection_reason, resume_path, degree_path, personal_id_document_path, created_at,
                   appeal_reason, appeal_document_path
            FROM users
        `;
        const pendingQuery = `
            SELECT id as user_id, name, email, category, sub_category, status, 
                   FALSE as profile_completed, rejection_reason, resume_path, degree_path, 
                   personal_id_document_path, created_at,
                   NULL as appeal_reason, NULL as appeal_document_path
            FROM PendingProfessionals
        `;

        const [usersRes, pendingRes] = await Promise.all([
            pool.query(usersQuery),
            pool.query(pendingQuery)
        ]);

        const allUsers = [...usersRes.rows, ...pendingRes.rows].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );
        res.json(allUsers);
    } catch (err) {
        console.error('Error fetching admin users repository:', err);
        res.status(500).json({ error: 'Failed to access the strategic entity directory.' });
    }
});

// Admin User Verification Action (Approve/Reject)
app.put('/api/admin/verify/:id', async (req, res) => {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check PendingProfessionals first
        const pendingCheck = await client.query('SELECT * FROM PendingProfessionals WHERE id = $1', [id]);

        if (pendingCheck.rows.length > 0) {
            const user = pendingCheck.rows[0];
            if (status === 'Approved') {
                // Relocate to main system users table
                await client.query(
                    'INSERT INTO users (name, email, password_hash, category, sub_category, status, profile_completed, resume_path, degree_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                    [user.name, user.email, user.password_hash, user.category, user.sub_category, 'Approved', true, user.resume_path, user.degree_path]
                );
                await client.query('DELETE FROM PendingProfessionals WHERE id = $1', [id]);
                await sendVerificationEmail(user.email, 'Approved');
            } else {
                await client.query('UPDATE PendingProfessionals SET status = $1, rejection_reason = $2 WHERE id = $3', [status, rejection_reason, id]);
                await sendVerificationEmail(user.email, 'Rejected', rejection_reason);
            }
        } else {
            // Update existing user status
            await client.query('UPDATE users SET status = $1, rejection_reason = $2 WHERE user_id = $3', [status, rejection_reason, id]);
        }

        await client.query('COMMIT');
        res.json({ message: `Entity successfully ${status.toLowerCase()} by administrative protocol.` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in /api/admin/verify:', err);
        res.status(500).json({ error: 'Failed to update entity status.' });
    } finally {
        client.release();
    }
});

// Admin Strategic Override: Disable/Enable Account
app.put('/api/admin/user/:id/:action', async (req, res) => {
    const { id, action } = req.params;
    const { reason } = req.body;
    const status = action === 'disable' ? 'Disabled' : 'Approved';
    const isEnable = action === 'enable';

    try {
        const result = await pool.query(
            `UPDATE users SET status = $1, rejection_reason = $2, 
             appeal_reason = CASE WHEN $3 = true THEN NULL ELSE appeal_reason END,
             appeal_document_path = CASE WHEN $3 = true THEN NULL ELSE appeal_document_path END
             WHERE user_id = $4 RETURNING name, email`,
            [status, action === 'disable' ? reason : null, isEnable, id]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (action === 'disable') sendDeactivatedEmail(user.email, user.name, reason).catch(console.error);
            else sendReactivatedEmail(user.email, user.name).catch(console.error);
        }

        res.json({ message: `User infrastructure ${action}d successfully.` });
    } catch (err) {
        console.error(`Error in /api/admin/user status override:`, err);
        res.status(500).json({ error: 'Strategic override failed.' });
    }
});

// Admin Land Submission Management
app.get('/api/admin/lands', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT l.*, u.name as owner_name, u.email as owner_email 
            FROM lands l 
            JOIN users u ON l.owner_id = u.user_id 
            ORDER BY l.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in /api/admin/lands:', err);
        res.status(500).json({ error: 'Failed to synchronize land repository.' });
    }
});

app.put('/api/admin/lands/:landId/verify', async (req, res) => {
    const { landId } = req.params;
    const { status, rejection_reason } = req.body;
    try {
        await pool.query('UPDATE lands SET status = $1, verification_status = $1, rejection_reason = $2 WHERE land_id = $3', [status, rejection_reason, landId]);
        res.json({ message: 'Land asset authorization updated.' });
    } catch (err) {
        console.error('Error verifying land assets:', err);
        res.status(500).json({ error: 'Authorization protocol failed.' });
    }
});

// Admin Global Project Command Center
app.get('/api/admin/projects', async (req, res) => {
    try {
        const projectRes = await pool.query(`
            SELECT p.*, u.name as owner_name, l.name as land_name, l.location
            FROM projects p 
            LEFT JOIN users u ON p.land_owner_id = u.user_id 
            LEFT JOIN lands l ON p.land_id = l.land_id
            ORDER BY p.created_at DESC
        `);

        const allProjects = [];
        for (const project of projectRes.rows) {
            // Fetch team members
            const teamRes = await pool.query(`
                SELECT u.user_id as id, u.name, u.category, u.sub_category 
                FROM projectassignments pa
                JOIN users u ON pa.user_id = u.user_id
                WHERE pa.project_id = $1 AND pa.status = 'Accepted'
            `, [project.project_id]);

            // Fetch tasks for progress metrics
            const tasksRes = await pool.query('SELECT status FROM tasks WHERE project_id = $1', [project.project_id]);

            allProjects.push(enrichProjectWithProgress(project, teamRes.rows, tasksRes.rows));
        }

        res.json(allProjects);
    } catch (err) {
        console.error('--- GLOBAL PROJECT AGGREGATION FAILURE ---');
        console.error('Error in /api/admin/projects:', err.message);
        console.error('SQL State:', err.code);
        console.error('Stack:', err.stack);
        res.status(500).json({
            error: 'Internal blueprint analysis error.',
            detail: err.message,
            sqlState: err.code
        });
    }
});

// Admin Market Authorization (Auctions)
app.get('/api/admin/auctions/pending', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, l.name as land_title, l.location, u.name as owner_name, u.email as owner_email 
            FROM land_auctions a
            JOIN lands l ON a.land_id = l.land_id
            JOIN users u ON a.owner_id = u.user_id
            WHERE a.status = 'pending_verification'
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching market authorization requests:', err);
        res.status(500).json({ error: 'Failed to access market request queue.' });
    }
});

app.put('/api/admin/auctions/:auctionId/verify', async (req, res) => {
    const { auctionId } = req.params;
    const { status, rejection_reason } = req.body;
    try {
        await pool.query('UPDATE land_auctions SET status = $1, rejection_reason = $2 WHERE auction_id = $3', [status, rejection_reason, auctionId]);
        res.json({ message: 'Market auction authorization status updated.' });
    } catch (err) {
        console.error('Auction authorization error:', err);
        res.status(500).json({ error: 'Failed to authorize auction.' });
    }
});

// Update Project Status (e.g., mark as Completed)
app.put('/api/projects/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Planning', 'Construction', 'Finishing', 'Completed', 'On Hold'].includes(status)) {
        return res.status(400).json({ error: 'Invalid project status' });
    }

    try {
        const checkStatusRes = await pool.query('SELECT status FROM projects WHERE project_id = $1', [id]);
        if (checkStatusRes.rows.length > 0 && checkStatusRes.rows[0].status === 'Completed' && status !== 'Completed') {
            return res.status(403).json({ error: 'Completed projects cannot be reopened once finalized.' });
        }

        const result = await pool.query(
            'UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE project_id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        const updated = result.rows[0];

        // Log the activity. We'll use the owner's ID for logging if available, or just null
        await logActivity(updated.land_owner_id || null, id, 'Project Status Update', `Project "${updated.name}" status changed to ${status}`);

        res.json({ message: `Project status updated to ${status}`, project: updated });
    } catch (err) {
        console.error('Error updating project status:', err);
        res.status(500).json({ error: 'Failed to update project status' });
    }
});

// Submit Ratings for Team Members
app.post('/api/projects/:id/rate', async (req, res) => {
    const { id } = req.params;
    const { rater_id, ratings } = req.body; // ratings should be an array of { rated_user_id, rating }

    if (!rater_id || !Array.isArray(ratings) || ratings.length === 0) {
        return res.status(400).json({ error: 'Rater ID and an array of ratings are required' });
    }

    const client = await pool.connect();
    try {
        // Ensure ratings table exists (Migration fallback)
        await client.query(`
            CREATE TABLE IF NOT EXISTS ratings (
                rating_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                project_id UUID,
                rater_id UUID,
                rated_user_id UUID,
                rating INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query('BEGIN');
        for (const r of ratings) {
            const { rated_user_id, rating } = r;
            if (!rated_user_id || !rating || rating < 1 || rating > 5) {
                throw new Error('Invalid rating data provided for a user');
            }

            await client.query(
                'INSERT INTO ratings (project_id, rater_id, rated_user_id, rating) VALUES ($1, $2, $3, $4)',
                [id, rater_id, rated_user_id, rating]
            );
        }

        await logActivity(rater_id, id, 'Team Rated', `Submitted ratings for project team`);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Ratings submitted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error submitting ratings:', err);
        res.status(500).json({ error: err.message || 'Failed to submit ratings' });
    } finally {
        client.release();
    }
});

// --- Interior Designer Real-Time Routes ---

// Get Materials by Professional
app.get('/api/materials/:professionalId', async (req, res) => {
    try {
        const { professionalId } = req.params;
        const result = await pool.query(
            'SELECT * FROM project_materials WHERE professional_id = $1 ORDER BY created_at DESC',
            [professionalId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching materials:', err);
        res.status(500).json({ error: 'Failed to fetch materials' });
    }
});

// Add New Material
app.post('/api/materials', async (req, res) => {
    try {
        const { professional_id, project_id, name, category, supplier, unit, unit_price, quantity, status, image_url, role } = req.body;
        const total_price = parseFloat(unit_price) * parseInt(quantity, 10);

        const result = await pool.query(
            `INSERT INTO project_materials 
            (professional_id, project_id, name, category, supplier, unit, unit_price, quantity, total_price, status, image_url, role) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [professional_id, project_id, name, category, supplier, unit, unit_price, quantity, total_price, status || 'in_stock', image_url, role || 'interior_designer']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating material:', err);
        res.status(500).json({ error: 'Failed to create material' });
    }
});

// Update Material
app.put('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, supplier, unit, unit_price, quantity, status, image_url, role } = req.body;
        const total_price = parseFloat(unit_price) * parseInt(quantity, 10);

        // If role doesn't exist, COALESCE to preserve the existing value
        const result = await pool.query(
            `UPDATE project_materials 
            SET name=$1, category=$2, supplier=$3, unit=$4, unit_price=$5, quantity=$6, total_price=$7, status=$8, image_url=$9, role=COALESCE($10, role)
            WHERE id=$11 RETURNING *`,
            [name, category, supplier, unit, unit_price, quantity, total_price, status, image_url, role, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Material not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating material:', err);
        res.status(500).json({ error: 'Failed to update material' });
    }
});

// Delete Material
app.delete('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM project_materials WHERE id=$1', [id]);
        res.json({ message: 'Material deleted successfully' });
    } catch (err) {
        console.error('Error deleting material:', err);
        res.status(500).json({ error: 'Failed to delete material' });
    }
});

// Get Active Projects for a Professional (where they are assigned)
app.get('/api/projects/professional/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const result = await pool.query(
            `SELECT p.project_id, p.name 
             FROM projectassignments pa
             JOIN projects p ON p.project_id = pa.project_id
             WHERE pa.user_id = $1 AND pa.status = 'Accepted' AND p.status != 'Completed'
             ORDER BY p.created_at DESC`,
            [uid]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching professional projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get Designs by Professional
app.get('/api/designs/:professionalId', async (req, res) => {
    try {
        const { professionalId } = req.params;
        const result = await pool.query(
            'SELECT * FROM professional_designs WHERE professional_id = $1 ORDER BY created_at DESC',
            [professionalId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching designs:', err);
        res.status(500).json({ error: 'Failed to fetch designs' });
    }
});

// Create Design (triggers approval workflow if project_type is 'Team')
app.post('/api/designs', async (req, res) => {
    const client = await pool.connect();
    try {
        const { professional_id, project_id, project_type, title, category, style, client_name, image_url } = req.body;

        if (!professional_id || !title) {
            return res.status(400).json({ error: 'professional_id and title are required' });
        }

        await client.query('BEGIN');

        // Personal projects are auto-approved. Team projects go into pending_review.
        const initialStatus = project_type === 'Team' ? 'pending_review' : 'approved';

        // Insert the design
        const { role } = req.body;
        const designResult = await client.query(
            `INSERT INTO professional_designs 
            (professional_id, project_id, title, category, style, client_name, image_url, status, project_type, role) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [professional_id, project_type === 'Team' ? project_id : null, title, category || 'Uncategorized', style || 'Standard', client_name || 'N/A', image_url || null, initialStatus, project_type, role || 'interior_designer']
        );
        const design = designResult.rows[0];

        // Workflow for Team Projects
        if (project_type === 'Team' && project_id) {
            // Find the project name
            const projRes = await client.query('SELECT name FROM projects WHERE project_id = $1', [project_id]);
            const project_name = projRes.rows[0]?.name || 'Unknown Project';

            // Find the contractor on that project
            const contractorRes = await client.query(
                `SELECT u.user_id, u.name
                 FROM projectassignments pa
                 JOIN users u ON u.user_id = pa.user_id
                 WHERE pa.project_id = $1 AND pa.status = 'Accepted'
                 AND u.category = 'contractor'
                 LIMIT 1`,
                [project_id]
            );

            if (contractorRes.rows.length > 0) {
                const contractor = contractorRes.rows[0];

                // Create a notification for the contractor
                await client.query(
                    `INSERT INTO notifications (user_id, type, message, link, related_id)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        contractor.user_id,
                        'design_review',
                        `New design "${title}" submitted for project "${project_name}" — awaiting your approval.`,
                        '/dashboard/tasks',
                        String(design.id)
                    ]
                );

                // Get the professional's name
                const designerRes = await client.query('SELECT name FROM users WHERE user_id = $1', [professional_id]);
                const designerName = designerRes.rows[0]?.name || 'An interior designer';

                // Create a Pending Review task for the contractor
                await client.query(
                    `INSERT INTO tasks (project_id, assigned_to, assigned_by, title, description, status)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        project_id,
                        contractor.user_id,
                        professional_id,
                        `Review Design: ${title}`,
                        `${designerName} submitted a new design "${title}" (${category || 'Uncategorized'} – ${style || 'Standard'}) for your review. Please approve or reject it.`,
                        'Pending'
                    ]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(design);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating design:', err);
        res.status(500).json({ error: 'Failed to create design' });
    } finally {
        client.release();
    }
});

// Update Design
app.put('/api/designs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, style, client_name, image_url, status, project_type, role } = req.body;
        const result = await pool.query(
            `UPDATE professional_designs 
            SET title=$1, category=$2, style=$3, client_name=$4, image_url=$5, status=COALESCE($6, status), project_type=COALESCE($7, project_type), role=COALESCE($8, role)
            WHERE id=$9 RETURNING *`,
            [title, category, style, client_name, image_url, status, project_type, role, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Design not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating design:', err);
        res.status(500).json({ error: 'Failed to update design' });
    }
});

// Delete Design
app.delete('/api/designs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM professional_designs WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Design not found' });
        res.json({ message: 'Design deleted successfully' });
    } catch (err) {
        console.error('Error deleting design:', err);
        res.status(500).json({ error: 'Failed to delete design' });
    }
});

// Approve or Reject a Design (contractor action)
app.patch('/api/designs/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body; // status: 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be approved or rejected' });
        }

        const result = await pool.query(
            'UPDATE professional_designs SET status=$1 WHERE id=$2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Design not found' });
        const design = result.rows[0];

        // Notify the interior designer of the decision
        const notifMsg = status === 'approved'
            ? `Your design "${design.title}" has been approved! ✅`
            : `Your design "${design.title}" was rejected. ${rejection_reason ? 'Reason: ' + rejection_reason : ''}`;

        await pool.query(
            `INSERT INTO notifications (user_id, type, message, link, related_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [design.professional_id, 'design_decision', notifMsg, '/dashboard/designs', String(id)]
        );

        res.json(design);
    } catch (err) {
        console.error('Error updating design status:', err);
        res.status(500).json({ error: 'Failed to update design status' });
    }
});

// Get Quotations by Professional
app.get('/api/quotations/:professionalId', async (req, res) => {
    try {
        const { professionalId } = req.params;
        const result = await pool.query(
            'SELECT * FROM professional_quotations WHERE professional_id = $1 ORDER BY created_at DESC',
            [professionalId]
        );

        // Fetch items for each quotation
        const quotations = result.rows;
        for (let quote of quotations) {
            const itemsRes = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [quote.id]);
            quote.items = itemsRes.rows;
        }

        res.json(quotations);
    } catch (err) {
        console.error('Error fetching quotations:', err);
        res.status(500).json({ error: 'Failed to fetch quotations' });
    }
});

// Create Quotation with Items (triggers approval workflow if project_type is 'Team')
app.post('/api/quotations', async (req, res) => {
    const client = await pool.connect();
    try {
        const { professional_id, project_id, project_type, client_id, title, valid_until, items } = req.body;

        if (!professional_id || !title || !items || !items.length) {
            return res.status(400).json({ error: 'professional_id, title, and at least one item are required' });
        }

        await client.query('BEGIN');

        // Calculate total amount
        let total_amount = 0;
        items.forEach(item => {
            const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
            total_amount += itemTotal;
        });

        // Personal projects are 'Personal'. Team projects go into pending_review.
        const initialStatus = project_type === 'Team' ? 'pending_review' : 'Personal';

        // Insert quotation
        const quoteRes = await client.query(
            `INSERT INTO professional_quotations 
            (professional_id, project_id, client_id, title, total_amount, status, valid_until) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [professional_id, project_type === 'Team' ? project_id : null, client_id || null, title, total_amount, initialStatus, valid_until ? new Date(valid_until) : null]
        );
        const newQuote = quoteRes.rows[0];

        // Insert items
        newQuote.items = [];
        for (let item of items) {
            const quantity = parseFloat(item.quantity) || 1;
            const unitPrice = parseFloat(item.unit_price) || 0;
            const totalPrice = quantity * unitPrice;

            const itemRes = await client.query(
                `INSERT INTO quotation_items 
                (quotation_id, description, quantity, unit_price, total_price) 
                VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [newQuote.id, item.description, quantity, unitPrice, totalPrice]
            );
            newQuote.items.push(itemRes.rows[0]);
        }

        // Workflow for Team Projects - Notify Landowner
        if (project_type === 'Team' && project_id) {
            // Find the project name and land owner
            const projRes = await client.query('SELECT name, land_owner_id FROM projects WHERE project_id = $1', [project_id]);
            const project = projRes.rows[0];
            const project_name = project?.name || 'Unknown Project';
            const land_owner_id = project?.land_owner_id;

            if (land_owner_id) {
                // Get the professional's name
                const proRes = await client.query('SELECT name FROM users WHERE user_id = $1', [professional_id]);
                const proName = proRes.rows[0]?.name || 'A professional';

                // Create a notification for the landowner
                await client.query(
                    `INSERT INTO notifications (user_id, type, message, link, related_id)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        land_owner_id,
                        'quotation_review',
                        `${proName} submitted a new quotation "${title}" for project "${project_name}" — awaiting your approval.`,
                        '/dashboard/quotations',
                        String(newQuote.id)
                    ]
                );

                // Create a Pending Review task for the landowner (Optional but helpful for visibility)
                await client.query(
                    `INSERT INTO tasks (project_id, assigned_to, assigned_by, title, description, status)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        project_id,
                        land_owner_id,
                        professional_id,
                        `Review Quotation: ${title}`,
                        `${proName} submitted a new quotation "${title}" (INR ${total_amount.toLocaleString()}) for your review. Please approve or reject it.`,
                        'Pending'
                    ]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(newQuote);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating quotation:', err);
        res.status(500).json({ error: 'Failed to create quotation' });
    } finally {
        client.release();
    }
});

// Get Single Quotation with Items
app.get('/api/quotations/view/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM professional_quotations WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });

        const quote = result.rows[0];
        const itemsRes = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [id]);
        quote.items = itemsRes.rows;

        // Optionally fetch project name
        if (quote.project_id) {
            const projRes = await pool.query('SELECT name FROM projects WHERE project_id = $1', [quote.project_id]);
            quote.project_name = projRes.rows[0]?.name;
        }

        res.json(quote);
    } catch (err) {
        console.error('Error fetching quotation details:', err);
        res.status(500).json({ error: 'Failed to fetch quotation details' });
    }
});

// Get Quotations received by a Land Owner (for review)
app.get('/api/quotations/received/:landOwnerId', authenticateToken, async (req, res) => {
    try {
        const { landOwnerId } = req.params;
        const result = await pool.query(
            `SELECT q.*, p.name as project_name, u.name as professional_name
             FROM professional_quotations q
             JOIN projects p ON q.project_id = p.project_id
             JOIN users u ON q.professional_id = u.user_id
             WHERE p.land_owner_id = $1 AND q.status = 'pending_review'
             ORDER BY q.created_at DESC`,
            [landOwnerId]
        );

        const quotations = result.rows;
        for (let quote of quotations) {
            const itemsRes = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [quote.id]);
            quote.items = itemsRes.rows;
        }

        res.json(quotations);
    } catch (err) {
        console.error('Error fetching received quotations:', err);
        res.status(500).json({ error: 'Failed to fetch received quotations' });
    }
});

// Update Quotation Status (Approve/Reject)
app.patch('/api/quotations/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body; // status: 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be accepted or rejected' });
        }

        const result = await pool.query(
            'UPDATE professional_quotations SET status=$1 WHERE id=$2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
        const quote = result.rows[0];

        // Find the landowner name for notification
        const ownerRes = await pool.query('SELECT name FROM users WHERE user_id = $1', [req.user.id]);
        const ownerName = ownerRes.rows[0]?.name || 'The client';

        // Notify the professional of the decision
        const notifMsg = status === 'accepted'
            ? `${ownerName} has accepted your quotation "${quote.title}"! ✅`
            : `${ownerName} rejected your quotation "${quote.title}". ${rejection_reason ? 'Reason: ' + rejection_reason : ''}`;

        await pool.query(
            `INSERT INTO notifications (user_id, type, message, link, related_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [quote.professional_id, 'quotation_decision', notifMsg, '/dashboard/quotations', String(id)]
        );

        res.json(quote);
    } catch (err) {
        console.error('Error updating quotation status:', err);
        res.status(500).json({ error: 'Failed to update quotation status' });
    }
});

// --- Land Auction & Bidding Routes ---

// Create a new auction
app.post('/api/auctions', authenticateToken, async (req, res) => {
    const { land_id, owner_id, base_price, reserve_price, duration_hours, duration_minutes } = req.body;
    const totalMinutes = (parseInt(duration_hours) || 0) * 60 + (parseInt(duration_minutes) || 0);
    const endTime = new Date(Date.now() + (totalMinutes || 1440) * 60 * 1000);

    try {
        // Security Check: Ensure the land is verified before allowing an auction
        const landRes = await pool.query('SELECT verification_status, name FROM lands WHERE land_id = $1', [land_id]);
        if (landRes.rows.length === 0) return res.status(404).json({ error: 'Land not found' });

        if (landRes.rows[0].verification_status !== 'Verified') {
            return res.status(403).json({
                error: `Land "${landRes.rows[0].name}" is not yet verified by an administrator. Auctions can only be started for verified properties.`
            });
        }

        const result = await pool.query(
            'INSERT INTO land_auctions (land_id, owner_id, base_price, reserve_price, end_time, current_highest_bid, status) VALUES ($1, $2, $3, $4, $5, $3, $6) RETURNING *',
            [land_id, owner_id, base_price, reserve_price || null, endTime, 'pending_verification']
        );
        const auction = result.rows[0];

        // Broadcast new auction
        io.emit('new_auction', auction);

        logActivity(owner_id, null, 'Auction Started', `Listed land ID ${land_id} for auction with base price ₹${base_price}`);
        res.status(201).json(auction);
    } catch (err) {
        console.error('Error creating auction:', err);
        res.status(500).json({ error: 'Failed to create auction' });
    }
});

// Get auction marketplace statistics
app.get('/api/auctions/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM land_auctions WHERE status = 'active' AND end_time > CURRENT_TIMESTAMP) as live_auctions,
                (SELECT COUNT(DISTINCT bidder_id) FROM bids) as total_bidders
        `);
        // If total_bidders is 0, we can add a base for "premium" vibe or just return real data
        const stats = result.rows[0];
        res.json({
            live_auctions: parseInt(stats.live_auctions || 0),
            total_bidders: parseInt(stats.total_bidders || 0)
        });
    } catch (err) {
        console.error('Error fetching auction stats:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get all auctions (active or recently completed)
app.get('/api/auctions', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                a.*, 
                l.name as land_title, 
                l.location, 
                l.area, 
                u.name as owner_name,
                (SELECT COUNT(DISTINCT bidder_id) FROM bids WHERE auction_id = a.auction_id) as bidders
            FROM land_auctions a
            JOIN lands l ON a.land_id = l.land_id
            JOIN users u ON a.owner_id = u.user_id
            WHERE a.status = 'active' AND a.end_time > CURRENT_TIMESTAMP
            ORDER BY a.end_time ASC
            LIMIT 20
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching auctions:', err);
        res.status(500).json({ error: 'Failed to fetch auctions' });
    }
});

// Get recent bidding activity for the marketplace feed
app.get('/api/auctions/recent-activity', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.bid_id, 
                b.amount, 
                b.created_at, 
                u.name as bidder_name,
                u.user_id as bidder_id,
                l.name as land_title
            FROM bids b
            JOIN users u ON b.bidder_id = u.user_id
            JOIN land_auctions a ON b.auction_id = a.auction_id
            JOIN lands l ON a.land_id = l.land_id
            ORDER BY b.created_at DESC
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching recent bids:', err);
        res.status(500).json({ error: 'Failed to fetch recent bids' });
    }
});

// Place a bid
app.post('/api/auctions/:auctionId/bid', authenticateToken, async (req, res) => {
    const { auctionId } = req.params;
    const { bidder_id, amount } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if auction is still active
        const auctionRes = await client.query('SELECT * FROM land_auctions WHERE auction_id = $1 FOR UPDATE', [auctionId]);
        if (auctionRes.rows.length === 0) throw new Error('Auction not found');
        const auction = auctionRes.rows[0];

        if (auction.status !== 'active' || new Date(auction.end_time) < new Date()) {
            throw new Error('Auction has ended');
        }

        // [Security] Owners cannot bid on their own auctions
        if (parseInt(bidder_id) === parseInt(auction.owner_id)) {
            throw new Error('As the property owner, you are not permitted to place bids on this auction.');
        }

        if (parseFloat(amount) <= parseFloat(auction.current_highest_bid)) {
            throw new Error('Bid must be higher than the current highest bid');
        }

        // Check bidder's wallet balance (Mock check for now)
        // const walletRes = await client.query('SELECT balance FROM wallets WHERE user_id = $1', [bidder_id]);
        // if (walletRes.rows.length > 0 && parseFloat(walletRes.rows[0].balance) < parseFloat(amount)) {
        //     throw new Error('Insufficient wallet balance to place this bid');
        // }

        // Record the bid
        const bidResult = await client.query(
            'INSERT INTO bids (auction_id, bidder_id, amount) VALUES ($1, $2, $3) RETURNING *',
            [auctionId, bidder_id, amount]
        );
        const newBid = bidResult.rows[0];

        // Update auction highest bid
        await client.query(
            'UPDATE land_auctions SET current_highest_bid = $1 WHERE auction_id = $2',
            [amount, auctionId]
        );

        // Update previous bids to 'outbid' status
        await client.query(
            'UPDATE bids SET status = \'outbid\' WHERE auction_id = $1 AND bid_id != $2',
            [auctionId, newBid.bid_id]
        );

        await client.query('COMMIT');

        // Fetch bidder name for broadcast
        const bidderRes = await pool.query('SELECT name FROM users WHERE user_id = $1', [bidder_id]);
        const bidderName = bidderRes.rows[0]?.name || 'Anonymous';

        // Broadcast bid update to ALL connected clients with bidder info
        const bidUpdate = {
            auction_id: auctionId,
            highest_bid: amount,
            bidder_id: bidder_id,
            bidder_name: bidderName,
            bid: newBid
        };
        io.emit('bid_update', bidUpdate);

        logActivity(bidder_id, null, 'Bid Placed', `Placed bid of ${amount} on auction ${auctionId}`);
        res.status(201).json(bidUpdate);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error placing bid:', err);
        res.status(400).json({ error: err.message || 'Failed to place bid' });
    } finally {
        client.release();
    }
});

// Finalize Auctions that have ended
async function finalizeEndedAuctions() {
    // console.log('[Maintenance] Checking for ended auctions to finalize or notify...'); // Reduced noise
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find active auctions that have passed their end time, OR completed ones that haven't been notified
        const auctionsRes = await client.query(`
            SELECT a.*, l.name as land_title, u.email as owner_email, u.name as owner_name
            FROM land_auctions a
            JOIN lands l ON a.land_id = l.land_id
            JOIN users u ON a.owner_id = u.user_id
            WHERE (a.status = 'active' AND a.end_time <= CURRENT_TIMESTAMP AND a.winner_id IS NULL)
               OR (a.status = 'completed' AND COALESCE(a.winner_notified, FALSE) = FALSE)
        `);

        for (const auction of auctionsRes.rows) {
            let topBid;

            if (auction.status === 'completed' && auction.winner_id) {
                // Already has a winner, just fetch details for notification/email
                const bidRes = await client.query(
                    'SELECT b.*, u.name as bidder_name, u.email as bidder_email FROM bids b JOIN users u ON b.bidder_id = u.user_id WHERE b.auction_id = $1 AND b.bidder_id = $2 ORDER BY b.amount DESC LIMIT 1',
                    [auction.auction_id, auction.winner_id]
                );
                if (bidRes.rows.length > 0) topBid = bidRes.rows[0];
            } else {
                // Find top bidder for active but ended auction
                const bidRes = await client.query(
                    'SELECT b.*, u.name as bidder_name, u.email as bidder_email FROM bids b JOIN users u ON b.bidder_id = u.user_id WHERE b.auction_id = $1 ORDER BY b.amount DESC LIMIT 1',
                    [auction.auction_id]
                );
                if (bidRes.rows.length > 0) topBid = bidRes.rows[0];
            }

            if (topBid) {
                // Update auction winner status immediately
                await client.query(
                    'UPDATE land_auctions SET winner_id = $1, status = \'completed\' WHERE auction_id = $2',
                    [topBid.bidder_id, auction.auction_id]
                );

                // 🔥 TRANSFER LEGAL LAND AUTHORITY (How it works in real life)
                await client.query(
                    'UPDATE lands SET owner_id = $1, updated_at = CURRENT_TIMESTAMP WHERE land_id = $2',
                    [topBid.bidder_id, auction.land_id]
                );

                // 🔥 TRANSFER ASSOCIATED PROJECT AUTHORITY
                await client.query(
                    'UPDATE projects SET land_owner_id = $1, updated_at = CURRENT_TIMESTAMP WHERE land_id = $2',
                    [topBid.bidder_id, auction.land_id]
                );

                // Create Notifications
                await createNotification(topBid.bidder_id, 'auction_win', `Congratulations! You won the auction for "${auction.land_title}" with a bid of ₹${parseFloat(topBid.amount).toLocaleString()}! You now hold full legal authority over this asset.`, '/dashboard/lands', auction.auction_id);
                await createNotification(auction.owner_id, 'auction_end', `Your auction for "${auction.land_title}" has ended. Assets successfully transferred to: ${topBid.bidder_name} for a final bid of ₹${parseFloat(topBid.amount).toLocaleString()}.`, '/dashboard/lands', auction.auction_id);

                try {
                    console.log(`[Auction] Sending win email for "${auction.land_title}" to winner: ${topBid.bidder_email}`);
                    const emailRes = await sendAuctionWinEmail(topBid.bidder_email, topBid.bidder_name, auction.land_title, topBid.amount);

                    // Mark as notified immediately after notification attempt
                    await client.query('UPDATE land_auctions SET winner_notified = TRUE WHERE auction_id = $1', [auction.auction_id]);

                    if (emailRes) {
                        console.log(`[Auction] ✅ Win email successfully sent to ${topBid.bidder_email}`);
                    }
                } catch (e) {
                    console.error('[Auction] ❌ Email delivery failed:', e.message);
                    // Still mark as notified to avoid dashboard spam
                    await client.query('UPDATE land_auctions SET winner_notified = TRUE WHERE auction_id = $1', [auction.auction_id]);
                }
            } else if (auction.status === 'active') {
                // No bids - mark as closed
                await client.query('UPDATE land_auctions SET status = \'closed\' WHERE auction_id = $1', [auction.auction_id]);
                console.log(`[Auction] No bids for ${auction.land_title}, marked as closed.`);
            }
        }

        await client.query('COMMIT');
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('[Maintenance] Auction finalization error:', err);
    } finally {
        if (client) client.release();
    }
}
// ??? Global Sanity Check: Fix any orphaned auctions that were completed but never transferred or notified
async function runAuctionSanitySync() {
    console.log('[Sanity] Syncing missed auction transfers...');
    try {
        const result = await pool.query(`
            SELECT a.*, COALESCE(a.winner_id, top_bid.bidder_id) as true_winner 
            FROM land_auctions a
            LEFT JOIN (
                SELECT auction_id, bidder_id, amount 
                FROM bids b1 
                WHERE amount = (SELECT MAX(amount) FROM bids b2 WHERE b2.auction_id = b1.auction_id)
            ) top_bid ON a.auction_id = top_bid.auction_id
            JOIN lands l ON a.land_id = l.land_id
            WHERE a.status = 'completed' AND l.owner_id = a.owner_id AND (a.winner_id IS NOT NULL OR top_bid.bidder_id IS NOT NULL)
        `);

        for (const auction of result.rows) {
            console.log(`[Sanity] Transferring authority for skipped auction: ${auction.auction_id}`);
            await pool.query('UPDATE lands SET owner_id = $1 WHERE land_id = $2', [auction.true_winner, auction.land_id]);
            await pool.query('UPDATE projects SET land_owner_id = $1 WHERE land_id = $2', [auction.true_winner, auction.land_id]);
        }
    } catch (err) {
        console.error('[Sanity] Sync Error:', err);
    }
}

// Run maintenance tasks every 30 seconds for high responsiveness
setInterval(() => {
    finalizeEndedAuctions();
    runAuctionSanitySync();
}, 30 * 1000);

// Also run immediately on startup
setTimeout(() => {
    finalizeEndedAuctions();
    runAuctionSanitySync();
}, 2000);

// ??? Global Error Handling Middleware (Imported from middleware/error.js)
app.use(errorHandler);

server.listen(port, () => {
    console.log(`Server successfully started on port ${port} with Socket.io enabled.`);
});

