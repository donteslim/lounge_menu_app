const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.post('/', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
