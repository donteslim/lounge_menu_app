const express = require('express');
const crypto = require('crypto');
const { readDb, writeDb } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function validatePrices(mainPrice, discountPrice) {
  if (mainPrice === undefined || mainPrice === null || Number.isNaN(Number(mainPrice))) {
    return 'Main price is required and must be a number';
  }
  if (Number(mainPrice) < 0) {
    return 'Main price cannot be negative';
  }
  if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
    if (Number.isNaN(Number(discountPrice))) {
      return 'Discount price must be a number';
    }
    if (Number(discountPrice) < 0) {
      return 'Discount price cannot be negative';
    }
    if (Number(discountPrice) >= Number(mainPrice)) {
      return 'Discount price must be less than the main price';
    }
  }
  return null;
}

router.post('/', requireAdmin, (req, res) => {
  const { sectionId, name, mainPrice, discountPrice, description } = req.body || {};
  if (!sectionId) {
    return res.status(400).json({ error: 'sectionId is required' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }
  const priceError = validatePrices(mainPrice, discountPrice);
  if (priceError) {
    return res.status(400).json({ error: priceError });
  }

  const db = readDb();
  const section = db.sections.find((s) => s.id === sectionId);
  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const maxOrder = db.products
    .filter((p) => p.sectionId === sectionId)
    .reduce((max, p) => Math.max(max, p.order), 0);

  const product = {
    id: crypto.randomUUID(),
    sectionId,
    name: name.trim(),
    mainPrice: Number(mainPrice),
    discountPrice:
      discountPrice === undefined || discountPrice === null || discountPrice === ''
        ? null
        : Number(discountPrice),
    description: (description || '').trim(),
    order: maxOrder + 1,
  };
  db.products.push(product);
  writeDb(db);
  res.status(201).json(product);
});

router.put('/:id', requireAdmin, (req, res) => {
  const { name, mainPrice, discountPrice, description, sectionId, order } = req.body || {};
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const effectiveMainPrice = mainPrice !== undefined ? mainPrice : product.mainPrice;
  const effectiveDiscountPrice =
    discountPrice !== undefined ? discountPrice : product.discountPrice;
  const priceError = validatePrices(effectiveMainPrice, effectiveDiscountPrice);
  if (priceError) {
    return res.status(400).json({ error: priceError });
  }

  if (sectionId !== undefined) {
    const section = db.sections.find((s) => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Target section not found' });
    }
    product.sectionId = sectionId;
  }
  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ error: 'Product name cannot be empty' });
    }
    product.name = name.trim();
  }
  if (mainPrice !== undefined) product.mainPrice = Number(mainPrice);
  if (discountPrice !== undefined) {
    product.discountPrice = discountPrice === null || discountPrice === '' ? null : Number(discountPrice);
  }
  if (description !== undefined) product.description = description.trim();
  if (order !== undefined && Number.isFinite(order)) product.order = order;

  writeDb(db);
  res.json(product);
});

router.delete('/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  db.products.splice(idx, 1);
  writeDb(db);
  res.json({ success: true });
});

module.exports = router;
