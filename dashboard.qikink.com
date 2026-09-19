# Qikink API credentials (dashboard.qikink.com -> Integration -> Custom API)
QIKINK_CLIENT_ID=930074582855236
QIKINK_CLIENT_SECRET=paste_your_client_secret_here

# Qikink environment: "sandbox" for testing, "live" for real orders
QIKINK_ENV=sandbox

# Port for this server to run on
PORT=3000

# Comma-separated list of allowed frontend origins (your website URL)
ALLOWED_ORIGINS=http://localhost:5173,https://your-vyron-site.com

# A password YOU make up, used to protect the /admin panel and /api/products writes.
# Keep this secret — anyone with it can add/delete products on your store.
ADMIN_KEY=choose_a_strong_password_here
