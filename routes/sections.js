const express = require('express');
const crypto = require('crypto');
const { readDb, writeDb } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const db = readDb();
  const sections = [...db.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      ...section,
      products: db.products
        .filter((p) => p.sectionId === section.id)
        .sort((a, b) => a.order - b.order),
    }));
  res.json(sections);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Section name is required' });
  }

  const db = readDb();
  const maxOrder = db.sections.reduce((max, s) => Math.max(max, s.order), 0);
  const section = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: (description || '').trim(),
    order: maxOrder + 1,
    createdAt: Date.now(),
  };
  db.sections.push(section);
  writeDb(db);
  res.status(201).json(section);
});

router.put('/:id', requireAdmin, (req, res) => {
  const { name, description, order } = req.body || {};
  const db = readDb();
  const section = db.sections.find((s) => s.id === req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }
  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ error: 'Section name cannot be empty' });
    }
    section.name = name.trim();
  }
  if (description !== undefined) section.description = description.trim();
  if (order !== undefined && Number.isFinite(order)) section.order = order;

  writeDb(db);
  res.json(section);
});

router.delete('/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.sections.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Section not found' });
  }
  db.sections.splice(idx, 1);
  db.products = db.products.filter((p) => p.sectionId !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

module.exports = router;
