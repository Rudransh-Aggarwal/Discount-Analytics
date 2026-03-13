# Discount Advisory Dashboard

An ML-powered full-stack web app that recommends optimal discount strategies for products based on historical sales data. Upload your own product CSV, browse live products from DummyJSON, run discount simulations, and get data-driven pricing recommendations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Chart.js, React Router v6 |
| Backend | Node.js 18+, Express, MongoDB, JWT auth |
| ML Service | Python 3.11, FastAPI, scikit-learn (Random Forest) |
| Database | MongoDB (local or MongoDB Atlas) |
| External API | DummyJSON (free, no key needed) |

---

## Project Structure

```
discount-advisory/
│
├── frontend/                   # React app (port 3000)
│   ├── public/
│   └── src/
│       ├── pages/
│       │   ├── Home.js         # Analytics dashboard
│       │   ├── Login.js        # Auth
│       │   ├── Signup.js       # Auth
│       │   ├── ProductList.js  # Live product catalog (DummyJSON)
│       │   ├── ProductDetail.js# Product + ML advisory
│       │   ├── Simulator.js    # Manual discount simulator
│       │   └── DataUpload.js   # CSV upload + bulk predictions
│       ├── components/
│       │   ├── Navbar.js
│       │   └── ProtectedRoute.js
│       └── utils/
│           ├── api.js          # Axios config + all API calls
│           └── AuthContext.js  # JWT auth state
│
├── backend/                    # Node.js API (port 5000)
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Sale.js
│   ├── routes/
│   │   ├── auth.js             # /api/auth/register, /login, /me
│   │   ├── discount.js         # /api/discount-advice-direct, /simulate-discount
│   │   ├── products.js         # /api/products
│   │   └── sales.js            # /api/sales
│   ├── server.js
│   ├── seed.js                 # Loads CSV data into MongoDB
│   └── .env.example
│
├── ml-service/                 # Python FastAPI (port 5001)
│   ├── model.py                # Random Forest training + prediction logic
│   ├── api.py                  # FastAPI endpoints
│   └── requirements.txt
│
└── dataset/
    ├── products.csv            # 75 products (training data)
    ├── sales_data.csv          # 3,600 sales records (training data)
    └── sample_upload.csv       # Sample file to test the Upload CSV feature
```

---

## Prerequisites

Make sure the following are installed before you begin:

- **Node.js** v18 or higher — https://nodejs.org
- **Python** 3.9 or higher — https://python.org
- **MongoDB** Community Edition (local) — https://www.mongodb.com/try/download/community
  - Or use a free **MongoDB Atlas** cloud cluster — https://cloud.mongodb.com
- **Git** — https://git-scm.com

Verify your versions:
```bash
node -v       # should be v18+
python --version  # should be 3.9+
mongod --version  # if running locally
```

---

## Running Locally

You need **3 terminals** running simultaneously.

### Step 1 — Clone the repo

```bash
git clone https://github.com/yourusername/discount-advisory.git
cd discount-advisory
```

---

### Step 2 — ML Service setup

```bash
cd ml-service
pip install -r requirements.txt
```

Train the model (only needs to be done once — creates `trained_model.pkl`):
```bash
python model.py
```

Start the ML service:
```bash
python api.py
# ✓ Uvicorn running on http://0.0.0.0:5001
```

> **Keep this terminal running.**

---

### Step 3 — Backend setup

Open a new terminal:

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Open `backend/.env` and fill in the values:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/discount_advisory
JWT_SECRET=any_long_random_string_at_least_32_chars
ML_SERVICE_URL=http://localhost:5001
CORS_ORIGIN=http://localhost:3000
```

> If using **MongoDB Atlas** instead of local MongoDB, replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/discount_advisory`

Seed the database (loads `dataset/products.csv` and `dataset/sales_data.csv` into MongoDB):
```bash
node seed.js
# ✓ Seeded 75 products
# ✓ Seeded 3600 sales records
```

Start the backend:
```bash
npm run dev
# ✓ Connected to MongoDB
# ✓ Backend running on port 5000
```

> **Keep this terminal running.**

---

### Step 4 — Frontend setup

Open a third terminal:

```bash
cd frontend
npm install
```

Start the React app:
```bash
npm start
# ✓ Compiled successfully
# ✓ App running at http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## First Time Setup

1. Go to http://localhost:3000/signup
2. Create an account — pick any role (Admin / Analyst / Viewer)
3. You're redirected to the Home dashboard automatically

---

## Pages & Features

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Analytics dashboard — live charts from DummyJSON API |
| Products | `/products` | Browse 100 real products with images, search, filters |
| Product Detail | `/product/:id` | ML advisory + 7-level discount simulation for any product |
| Simulator | `/simulator` | Manually pick any product + discount and get instant prediction |
| Upload CSV | `/upload` | Upload your own product data and get bulk ML recommendations |
| Login | `/login` | Sign in |
| Signup | `/signup` | Create account |

---

## Testing the CSV Upload Feature

A sample CSV file is included at `dataset/sample_upload.csv` to test the Upload feature:

```csv
name,price,category,brand,current_discount,stock
Wireless Headphones,2999,Electronics,Sony,10,50
Running Shoes,3499,Footwear,Nike,5,120
Cotton T-Shirt,799,Clothing,H&M,0,200
Python Programming Book,599,Books,OReilly,0,80
Yoga Mat,1299,Sports,Decathlon,15,60
Scented Candle,499,Home,IKEA,0,150
Face Serum,1199,Beauty,Minimalist,20,90
Gaming Laptop,75000,Electronics,Asus,8,25
Denim Jacket,2499,Clothing,Levis,12,75
Basketball Shoes,4999,Footwear,Adidas,0,40
```

**How to use:**
1. Go to **Upload CSV** in the navbar
2. Drag and drop `dataset/sample_upload.csv` onto the upload area, or click to browse
3. The ML service runs predictions for all products automatically
4. View the analytics charts, KPI cards, and recommendations table
5. Click **Download Results CSV** to export the full advisory report

**Required columns:** `name`, `price`, `category`

**Optional columns:** `brand`, `current_discount`, `stock`

**Supported category values:** `Electronics`, `Clothing`, `Footwear`, `Books`, `Sports`, `Home`, `Beauty`

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password, role }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns JWT |
| GET | `/api/auth/me` | — | Get current user (requires Bearer token) |

### Discount — `/api`

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| GET | `/api/discount-advice-direct` | `?productId=&price=&category=` | Get ML recommendation for a product |
| POST | `/api/simulate-discount` | `{ product_id, price, category, discount }` | Predict units + revenue for a specific discount |

### ML Service — `http://localhost:5001`

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/predict` | `{ product_id, price, discount, category }` | Predict units sold |
| POST | `/advise` | `{ product_id, price, category }` | Get best discount across all levels |
| GET | `/health` | — | Check if model is loaded |
| POST | `/retrain` | — | Retrain model from scratch |

---

## ML Model Details

- **Algorithm:** Random Forest Regressor (100 trees)
- **Training data:** 3,600 sales records across 75 products and 7 categories
- **Features:** `price`, `discount %`, `category`
- **Target:** `units_sold`
- **Advisory logic:** Simulates discounts at 0%, 5%, 10%, 15%, 20%, 25%, 30% — picks the level with the highest projected revenue (`effective_price × predicted_units`)

---

## Common Errors

**`ECONNREFUSED` on login/signup**
→ Your backend is not running. Start it with `npm run dev` in the `backend/` folder.

**`ML service unavailable`**
→ Your Python service is not running. Run `python api.py` in the `ml-service/` folder.

**`MONGO_URI is not set`**
→ You haven't created `backend/.env`. Run `cp .env.example .env` and fill in the values.

**`ModuleNotFoundError` in Python**
→ Dependencies not installed. Run `pip install -r requirements.txt` in `ml-service/`.

**`Model not found, training now...`**
→ Normal on first run. The model trains automatically, or run `python model.py` manually first.

**Charts not loading on Home page**
→ DummyJSON API is a free public API — if it's temporarily down, wait a moment and refresh.

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Backend port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs — min 32 chars |
| `ML_SERVICE_URL` | Yes | URL of the Python ML service |
| `CORS_ORIGIN` | Yes | Frontend URL allowed by CORS |

### `frontend/.env` (optional in dev)

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend URL — leave empty in dev (CRA proxy handles it) |