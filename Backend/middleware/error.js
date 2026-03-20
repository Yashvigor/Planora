/**
 * 🛠️ Global Error Handling Middleware
 * Catch-all for any errors passed via next(err).
 * Ensures consistency in API responses even during server-side failures.
 */
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
};

module.exports = { errorHandler };
