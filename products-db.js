// products-db.js
// File-based storage for products, same simple approach as orders.

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'products.json');

function readAll() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]', 'utf-8');
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(products) {
  fs.writeFileSync(DB_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

function addProduct(product) {
  const products = readAll();
  products.push(product);
  writeAll(products);
  return product;
}

function getProductById(id) {
  return readAll().find((p) => p.id === id);
}

function deleteProduct(id) {
  const products = readAll().filter((p) => p.id !== id);
  writeAll(products);
}

module.exports = { readAll, addProduct, getProductById, deleteProduct };
