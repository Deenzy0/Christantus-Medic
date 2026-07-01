# 🏥 Christantus Medical Consult

A complete, production-ready medical/pharmacy e-commerce and online consultation platform — built with **Node.js + Express + MongoDB** on the backend and **plain HTML/CSS/JavaScript** on the frontend (no build step required).

---

## 📦 What's Included

- **Storefront**: Home page, product shop with search/filter/sort/pagination, product detail pages, cart, checkout
- **Real Paystack payment integration** (test mode out of the box, switch to live keys when ready)
- **Authentication**: Register/login (JWT-based), customer dashboard, password change, profile editing
- **Consultation booking**: Patients can book a slot with a pharmacist; admins manage requests
- **Full Admin Panel**: Dashboard with stats, Products CRUD (with image upload), Orders management (status updates), Users management (roles, activate/deactivate), Consultations management
- **Security**: Password hashing (bcrypt), JWT auth, input validation, rate limiting, helmet, protected admin routes

---

## 🗂️ Folder Structure

```
christantus-medical/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── controllers/              # Route logic (auth, products, orders, payments, admin, consultations)
│   ├── middleware/                # JWT auth guard + global error handler
│   ├── models/                    # Mongoose schemas: User, Product, Order, Consultation
│   ├── routes/                    # Express routers
│   ├── uploads/                   # Product images uploaded via admin panel
│   ├── utils/                     # Token generation + database seed script
│   ├── .env.example               # Copy to .env and fill in your values
│   ├── package.json
│   └── server.js                  # App entry point
│
├── frontend/
│   ├── css/                       # One stylesheet per page/component
│   ├── js/                        # One script per page/component
│   ├── images/                    # (optional local images — demo uses Unsplash URLs)
│   ├── index.html                 # Homepage
│   ├── shop.html, product-detail.html, cart.html, checkout.html
│   ├── login.html, register.html, dashboard.html
│   ├── consultation.html, contact.html
│   ├── payment-callback.html, order-success.html
│   └── admin-*.html               # Admin panel pages
│
├── database/                      # (reserved — see "Database" section below)
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher ([download](https://nodejs.org))
- **MongoDB** — either installed locally ([download](https://www.mongodb.com/try/download/community)) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud cluster
- A **Paystack** account ([sign up free](https://paystack.com)) for test API keys — required for the payment flow to work

### 1. Extract the project
Unzip the project anywhere on your machine.

### 2. Set up the backend

```bash
cd christantus-medical/backend
npm install
```

Copy the example environment file and fill in your real values:

```bash
cp .env.example .env
```

Open `.env` in a text editor and set:

| Variable | What to put |
|---|---|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/christantus_medical` (local) or your Atlas connection string |
| `JWT_SECRET` | Any long random string (e.g. generate one at [randomkeygen.com](https://randomkeygen.com)) |
| `PAYSTACK_SECRET_KEY` | Your **test** secret key from the [Paystack dashboard](https://dashboard.paystack.com/#/settings/developer) → starts with `sk_test_` |
| `PAYSTACK_PUBLIC_KEY` | Your **test** public key → starts with `pk_test_` |
| `CLIENT_URL` | `http://localhost:3000` (or wherever you serve the frontend from) |

### 3. Seed the database (creates an admin account + sample products)

```bash
npm run seed
```

This creates:
- An **admin account** using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env` (defaults: `admin@christantusmedical.com` / `ChangeThisPassword123!`)
- **12 sample products** across multiple categories so the shop isn't empty on first run

### 4. Start the backend

```bash
npm start
```

You should see:
```
🏥  Christantus Medical Consult API
🚀  Server running in development mode on port 5000
```

Leave this running. For auto-restart on file changes during development, use `npm run dev` instead (uses `nodemon`).

### 5. Serve the frontend

The frontend is plain HTML/CSS/JS — no build step. You just need *any* static file server, because opening the HTML files directly via `file://` will break `fetch()` calls due to CORS.

**Option A — VS Code Live Server extension** (easiest): right-click `frontend/index.html` → "Open with Live Server".

**Option B — Node's `http-server`:**
```bash
cd christantus-medical/frontend
npx http-server -p 3000
```

**Option C — Python (already installed on most systems):**
```bash
cd christantus-medical/frontend
python3 -m http.server 3000
```

Then visit **http://localhost:3000** in your browser.

> ⚠️ Make sure the port you serve the frontend on matches `CLIENT_URL` in your backend `.env` (used for CORS and Paystack's redirect callback).

### 6. Log in

- **Customer**: click "Sign up" and create an account, or browse the shop as a guest (you'll be asked to log in at checkout).
- **Admin**: go to `/login.html` and use the admin credentials from step 3 (shown on the login page as a hint). You'll be redirected to the Admin Panel automatically.

---

## 💳 Testing Payments (Paystack Test Mode)

With test API keys in your `.env`, checkout → "Pay Online (Paystack)" will redirect to Paystack's real hosted checkout page running in **test mode** — no real money moves.

Use any of Paystack's official test cards, e.g.:

| Card Number | CVV | Expiry | PIN | OTP |
|---|---|---|---|---|
| `4084 0840 8408 4081` | `408` | any future date | `0000` | `123456` |

Full list of test cards: https://paystack.com/docs/payments/test-payments

After a successful test payment, Paystack redirects back to `payment-callback.html`, which verifies the transaction server-side and marks the order as paid.

### Going live
When you're ready for real payments:
1. Complete Paystack's business verification to get **live** API keys.
2. Replace `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` in `.env` with your `sk_live_...` / `pk_live_...` keys.
3. Set up a **webhook** in your Paystack dashboard pointing to `https://yourdomain.com/api/payments/webhook` — this is a backup confirmation path in case the user closes their browser before the redirect completes.
4. Set `NODE_ENV=production` and update `CLIENT_URL` to your real domain.

---

## 🗄️ Database

This project uses **MongoDB** with **Mongoose** — there's no separate SQL schema file to run, since Mongoose creates collections automatically based on the models in `backend/models/`. The `database/` folder is reserved if you'd like to add migration scripts, database dumps, or documentation as your project grows.

**Models:**
- `User` — name, email, hashed password, phone, address, role (`customer` / `pharmacist` / `admin`)
- `Product` — name, slug, description, category, brand, price, discountPrice, stock, SKU, image, requiresPrescription, dosageInfo
- `Order` — items, shipping address, totals, payment method/status, order status, status history
- `Consultation` — patient info, consultation type, preferred date/time, message, status, admin notes

---

## 🔐 Security Notes

- Passwords are hashed with **bcrypt** before storage — never stored in plain text.
- All admin routes require a valid JWT **and** `role: 'admin'` — enforced server-side, not just hidden in the UI.
- Order totals are **recalculated server-side** from the database at checkout — the frontend's displayed price is never trusted for the actual charge.
- Rate limiting is applied to all `/api/*` routes, with stricter limits on `/api/auth/login` and `/api/auth/register` to slow down brute-force attempts.
- `helmet` sets standard security-related HTTP headers.
- **Before deploying to production**: change `JWT_SECRET` and the default admin password, set `NODE_ENV=production`, and serve everything over HTTPS.

---

## 🛠️ Customization Tips

- **Branding**: update the business name/colors in `frontend/css/style.css` (CSS variables at the top) and the `<title>` tags.
- **Product images**: the seed script uses Unsplash demo images via `frontend/js/product-card.js`'s `DEMO_IMAGE_MAP`. Once you upload real product photos through the admin panel, they'll automatically replace the demo images for that product.
- **Shipping fee / free shipping threshold**: edit `CONFIG.FREE_SHIPPING_THRESHOLD` and `CONFIG.SHIPPING_FEE` in `frontend/js/config.js`, and the matching values in `backend/controllers/orderController.js`.
- **Contact form**: `contact.html` currently shows a confirmation message but doesn't send a real email. Wire it up to a backend route + an email provider (e.g. Nodemailer, Resend, SendGrid) if you want it to actually deliver messages.

---

## 📄 License

MIT — use this freely for your own pharmacy or healthcare business.
