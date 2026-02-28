const jwt = require('jsonwebtoken');

/**
 * 🔐 JWT Authentication Middleware
 * 
 * Intercepts requests to protected routes, extracts the 'Authorization' header,
 * and verifies the token. If valid, it attaches the user payload to the request.
 */
const authenticateToken = (req, res, next) => {
    // Expected format: 'Bearer <token>'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-planora-key');
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        return res.status(403).json({ error: 'Invalid or malformed token.' });
    }
};

module.exports = { authenticateToken };
