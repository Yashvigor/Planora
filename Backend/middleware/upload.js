const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * 📂 Multer Configuration for Dynamic File Uploads
 * 
 * Organizes files into sub-folders based on 'category'.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.body.category || 'General';
        const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
        const dest = path.join(uploadsRoot, category);

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

module.exports = { upload };
