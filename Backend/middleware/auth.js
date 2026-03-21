const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vjWLpTxam85A@ep-spring-block-am4uwdq8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Please coordinate with headquarters.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-planora-key');
        
        // Correcting property mismatch: jwt.sign uses { id: ... } not user_id
        // Handle both id and user_id for compatibility with existing code
        const currentUserId = decoded.id || decoded.user_id;

        // Populate both fields to ensure downstream usage in req.user remains stable
        req.user = { 
            ...decoded, 
            id: currentUserId, 
            user_id: currentUserId 
        };

        // Validate user existence and status across both potential tables (Approved/Pending)
        let userCheck = await pool.query('SELECT status FROM users WHERE user_id = $1', [currentUserId]);
        
        if (userCheck.rows.length === 0) {
            // Check if the user is a professional still in the onboarding/pending phase
            userCheck = await pool.query('SELECT status FROM PendingProfessionals WHERE id = $1', [currentUserId]);
        }
        
        if (userCheck.rows.length === 0) {
            return res.status(401).json({ error: 'Infrastructure access record not found.' });
        }

        if (userCheck.rows[0].status === 'Disabled') {
            // 🛡️ Strategic Exception: Allow users to submit appeals even if deactivated
            if (req.path === '/user/appeal' || req.originalUrl === '/api/user/appeal') {
                return next();
            }

            return res.status(403).json({ 
                error: 'ACCESS SUSPENDED. Your account has been deauthorized due to suspicious activity. Please submit an official appeal for reinstatement.',
                isDeactivated: true
            });
        }

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Authorization session expired. Re-authenticate.' });
        }
        return res.status(403).json({ error: 'Invalid security clearance.' });
    }
};

module.exports = { authenticateToken };
