// db.js
// Very small file-based "database" for orders. Good enough to get started;
// swap this out for a real database (Postgres/MongoDB) once you outgrow it.

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'orders.json');

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

function saveOrder(order) {
  const orders = readAll();
  orders.push(order);
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  return order;
}

function getOrderByLocalId(localOrderId) {
  return readAll().find((o) => o.localOrderId === localOrderId);
}

function getOrdersByEmail(email) {
  return readAll().filter(
    (o) => (o.email || '').toLowerCase() === (email || '').toLowerCase()
  );
}

module.exports = { readAll, saveOrder, getOrderByLocalId, getOrdersByEmail };
