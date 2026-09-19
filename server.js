// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ordersRouter = require('./routes/orders');
const productsRouter = require('./routes/products');
const path = require('path');

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'VYRON backend is running.' });
});

app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);
app.use('/admin', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VYRON backend listening on port ${PORT}`);
  console.log(`Qikink environment: ${process.env.QIKINK_ENV || 'sandbox'}`);
});
