const multer = require('multer');

/**
 * 📂 Multer Configuration — Memory Storage (Database-Only)
 * 
 * Files are held in memory (as Buffer) and then stored directly
 * into the PostgreSQL database. No disk writes occur.
 * This ensures all teammates and deployment environments can
 * access files without needing a shared filesystem.
 */
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB max file size
    }
});

module.exports = { upload };
