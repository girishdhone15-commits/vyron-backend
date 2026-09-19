// routes/orders.js
const express = require('express');
const router = express.Router();
const { createQikinkOrder } = require('../qikink');
const { saveOrder, getOrderByLocalId, getOrdersByEmail } = require('../db');
const { getProductById } = require('../products-db');

// Only letters, digits, underscore; max 15 chars — matches Qikink's rule.
function makeOrderNumber() {
  const raw = 'VY' + Date.now().toString(36).toUpperCase();
  return raw.slice(0, 15);
}

/**
 * POST /api/orders
 * Body shape expected from the frontend checkout form:
 * {
 *   customer: { name, email, mobile },
 *   shippingAddress: { address1, city, state, pincode, country_code },
 *   items: [ { productId, quantity } ],
 *   paymentMethod: "cod" | "upi" | "card"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { customer, shippingAddress, items, paymentMethod } = req.body;

    if (!customer || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({
        error:
          'Missing required fields: customer, shippingAddress, and items are all required.',
      });
    }

    const resolvedItems = [];
    for (const item of items) {
      const product = getProductById(item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product not found: ${item.productId}` });
      }
      resolvedItems.push({ product, quantity: item.quantity || 1 });
    }

    const totalOrderValue = resolvedItems.reduce(
      (sum, { product, quantity }) => sum + product.price * quantity,
      0
    );

    const orderNumber = makeOrderNumber();

    const line_items = resolvedItems.map(({ product, quantity }) => {
      const lineItem = {
        search_from_my_products: 0,
        print_type_id: String(product.printTypeId || 1),
        quantity: String(quantity),
        price: String(product.price),
        sku: product.blankSku,
      };

      const isPrinted = product.printTypeId && Number(product.printTypeId) !== 1;
      if (isPrinted) {
        lineItem.designs = [
          {
            design_code: product.designCode,
            width_inches: String(product.widthInches),
            height_inches: String(product.heightInches),
            placement_sku: product.placementSku,
            design_link: product.imageUrl,
            mockup_link: product.mockupImageUrl || product.imageUrl,
          },
        ];
      }

      return lineItem;
    });

    const qikinkPayload = {
      order_number: orderNumber,
      qikink_shipping: '1',
      gateway: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      total_order_value: String(totalOrderValue),
      line_items,
      shipping_address: {
        first_name: customer.name.split(' ')[0] || customer.name,
        last_name: customer.name.split(' ').slice(1).join(' ') || '',
        address1: shippingAddress.address1,
        phone: customer.mobile,
        email: customer.email,
        city: shippingAddress.city,
        zip: shippingAddress.pincode,
        province: shippingAddress.state,
        country_code: shippingAddress.country_code || 'IN',
      },
    };

    const result = await createQikinkOrder(qikinkPayload);

    saveOrder({
      localOrderId: orderNumber,
      date: new Date().toISOString(),
      email: customer.email,
      customer,
      shippingAddress,
      items: resolvedItems.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        quantity,
        price: product.price,
      })),
      paymentMethod,
      totalOrderValue,
      qikinkStatus: result.ok ? 'sent' : 'failed',
      qikinkResponse: result.data,
    });

    if (!result.ok) {
      return res.status(502).json({
        error: 'Order saved, but Qikink rejected it.',
        qikinkError: result.data,
        localOrderId: orderNumber,
      });
    }

    return res.status(201).json({
      message: 'Order placed successfully.',
      localOrderId: orderNumber,
      qikinkOrderId: result.data.order_id,
      qikinkResponse: result.data,
    });
  } catch (err) {
    console.error('Order creation failed:', err.message);
    return res.status(500).json({ error: 'Something went wrong placing the order.' });
  }
});

router.get('/:orderId', (req, res) => {
  const order = getOrderByLocalId(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

router.get('/', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Pass ?email= to look up orders.' });
  }
  res.json(getOrdersByEmail(email));
});

module.exports = router;
