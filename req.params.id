// routes/products.js
const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const {
  readAll,
  addProduct,
  getProductById,
  deleteProduct,
} = require('../products-db');

// Simple shared-secret check so random people on the internet can't add
// products to your store. Set ADMIN_KEY in .env and send it as the
// "x-admin-key" header from the admin form.
function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid or missing admin key.' });
  }
  next();
}

// GET /api/products — public, used by the storefront to show products
router.get('/', (req, res) => {
  res.json(readAll());
});

router.get('/:id', (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
});

/**
 * POST /api/products — admin only, adds a new product.
 * Body:
 * {
 *   name, price, mrp, category, description,
 *   imageUrl,           // shown on the website AND used as the print design
 *   mockupImageUrl,     // optional — a separate mockup image for Qikink; defaults to imageUrl
 *   blankSku,           // the underlying blank garment SKU from Qikink (e.g. "MVnHs-Wh-S")
 *   printTypeId,        // e.g. 1 = plain / no print, 5 = DTF etc. Defaults to 1.
 *   placementSku,       // "fr" | "bk" | "lp" | "rp" | "rs" | "ls" — required if printing a design
 *   widthInches, heightInches  // required the FIRST time this design_code is used
 * }
 *
 * If printTypeId is left as plain (1) or omitted, no design fields are needed —
 * it's just a blank garment sold as-is. If you set a printed printTypeId,
 * imageUrl/placementSku/widthInches/heightInches become required, since
 * that's what Qikink needs to register a brand-new design.
 */
router.post('/', requireAdminKey, (req, res) => {
  const {
    name,
    price,
    mrp,
    category,
    description,
    imageUrl,
    mockupImageUrl,
    blankSku,
    printTypeId,
    placementSku,
    widthInches,
    heightInches,
  } = req.body;

  if (!name || !price || !blankSku) {
    return res.status(400).json({
      error: 'name, price, and blankSku are required fields.',
    });
  }

  const isPrinted = Number(printTypeId) && Number(printTypeId) !== 1;

  if (isPrinted && (!imageUrl || !placementSku || !widthInches || !heightInches)) {
    return res.status(400).json({
      error:
        'For a printed product, imageUrl, placementSku, widthInches and heightInches are all required (Qikink needs these to register the new design).',
    });
  }

  const id = randomUUID();

  const product = addProduct({
    id,
    name,
    price: Number(price),
    mrp: Number(mrp || price),
    category: category || 'Uncategorized',
    description: description || '',
    imageUrl: imageUrl || '',
    blankSku,
    printTypeId: Number(printTypeId) || 1,
    designCode: isPrinted ? `D${id.replace(/-/g, '').slice(0, 15)}` : null,
    mockupImageUrl: mockupImageUrl || imageUrl || '',
    placementSku: placementSku || null,
    widthInches: widthInches || null,
    heightInches: heightInches || null,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(product);
});

router.delete('/:id', requireAdminKey, (req, res) => {
  deleteProduct(req.params.id);
  res.json({ message: 'Deleted.' });
});

module.exports = router;
