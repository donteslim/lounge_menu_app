const express = require('express');
const cors = require('cors');
const path = require('path');
const { ensureDb } = require('./db');

const authRoutes = require('./routes/auth');
const sectionRoutes = require('./routes/sections');
const productRoutes = require('./routes/products');
const uploadRoutes = require('./routes/upload');

ensureDb();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Lounge menu app running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin`);
});
