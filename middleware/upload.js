const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = EXT_BY_MIME[file.mimetype] || path.extname(file.originalname) || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed'));
    }
    cb(null, true);
  },
});

function deleteUploadedFile(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const filePath = path.join(UPLOAD_DIR, path.basename(url));
  fs.unlink(filePath, () => {});
}

module.exports = { upload, UPLOAD_DIR, deleteUploadedFile };
