# 🧠 Discount Advisory Dashboard

An **ML-powered full-stack web application** that recommends **optimal discount strategies** for products using historical sales data.

Users can:

- 📦 Upload their own **product CSV**
- 🛍 Browse **live products** from DummyJSON
- 📊 Run **discount simulations**
- 🤖 Receive **data-driven pricing recommendations**

---

## ✨ Features

- 🔐 **JWT Authentication** (Admin / Analyst / Viewer roles)
- 📊 **Analytics Dashboard** with charts
- 🛍 **Live product catalog** (DummyJSON API)
- 🤖 **Machine Learning recommendations**
- 🎯 **Discount simulation engine**
- 📂 **CSV upload + bulk ML predictions**
- 📈 **Revenue optimization analysis**
- 📥 **Export advisory reports**

---

# 🧰 Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| **Frontend**     | React 18, Chart.js, React Router v6 |
| **Backend**      | Node.js 18+, Express                |
| **ML Service**   | Python 3.11, FastAPI, scikit-learn  |
| **Database**     | MongoDB (Local / Atlas)             |
| **Auth**         | JWT                                 |
| **External API** | DummyJSON                           |

---

# 🗂 Project Structure

```
discount-advisory
│
├── frontend/                 # React app (port 3000)
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── Signup.js
│   │   ├── ProductList.js
│   │   ├── ProductDetail.js
│   │   ├── Simulator.js
│   │   └── DataUpload.js
│   │
│   ├── components/
│   │   ├── Navbar.js
│   │   └── ProtectedRoute.js
│   │
│   └── utils/
│       ├── api.js
│       └── AuthContext.js
│
├── backend/                  # Node.js API (port 5000)
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Sale.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── discount.js
│   │   ├── products.js
│   │   └── sales.js
│   │
│   ├── server.js
│   └── seed.js
│
├── ml-service/               # Python FastAPI service (port 5002)
│   ├── model.py
│   ├── api.py
│   └── requirements.txt
│
└── dataset/
    ├── products.csv
    ├── sales_data.csv
    └── sample_upload.csv
```

---

# ⚙️ Prerequisites

Install the following before running the project.

| Tool    | Version                    |
| ------- | -------------------------- |
| Node.js | v18+                       |
| Python  | 3.11+                      |
| MongoDB | Community Edition or Atlas |
| Git     | Latest                     |

Check installation:

```bash
node -v
python --version
mongod --version
```

---

# 🚀 Running the Project Locally

The app requires **3 running services**:

1️⃣ ML Service
2️⃣ Backend API
3️⃣ Frontend React App

---

# 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/discount-advisory.git

cd discount-advisory
```

---

# 2️⃣ ML Service Setup

```bash
cd ml-service

pip install -r requirements.txt
```

Train the model (only once):

```bash
python model.py
```

> **Note**: Model files (`trained_model.pkl`, `category_encoder.pkl`) are gitignored and trained locally.

Start the ML service:

```bash
python api.py
```

Service runs on:

```
http://localhost:5002
```

---

# 3️⃣ Backend Setup

Open **a new terminal**

```bash
cd backend

npm install
```

Create environment file:

```bash
cp .env.example .env
```

Edit `.env`

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/discount_advisory
JWT_SECRET=any_long_random_string_at_least_32_chars
ML_SERVICE_URL=http://localhost:5002
CORS_ORIGIN=http://localhost:3000
```

Seed the database:

```bash
node seed.js
```

Start backend server:

```bash
npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

# 4️⃣ Frontend Setup

Open **third terminal**

```bash
cd frontend

npm install

npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

# 👤 First Time Setup

1. Open

```
http://localhost:3000/signup
```

2. Create account

3. Choose role

```
Admin
Analyst
Viewer
```

You will be redirected to the **dashboard**.

---

# 📄 Pages & Features

| Page           | Route          | Description                     |
| -------------- | -------------- | ------------------------------- |
| Dashboard      | `/`            | Analytics dashboard with charts |
| Products       | `/products`    | Live product catalog            |
| Product Detail | `/product/:id` | ML advisory for product         |
| Simulator      | `/simulator`   | Test discount scenarios         |
| Upload CSV     | `/upload`      | Bulk ML predictions             |
| Login          | `/login`       | User authentication             |
| Signup         | `/signup`      | Account creation                |

---

# 📂 CSV Upload Feature

Sample file included:

```
dataset/sample_upload.csv
```

Example format:

```csv
name,price,category,brand,current_discount,stock
Wireless Headphones,2999,Electronics,Sony,10,50
Running Shoes,3499,Footwear,Nike,5,120
Cotton T-Shirt,799,Clothing,H&M,0,200
```

### Required Columns

```
name
price
category
```

### Optional

```
brand
current_discount
stock
```

Supported categories:

```
Electronics
Clothing
Footwear
Books
Sports
Home
Beauty
```

---

# 🔌 API Reference

## Auth

`/api/auth`

| Method | Endpoint    | Description     |
| ------ | ----------- | --------------- |
| POST   | `/register` | Create account  |
| POST   | `/login`    | Login           |
| GET    | `/me`       | Get logged user |

---

## Discount Engine

`/api`

| Method | Endpoint                  | Description       |
| ------ | ------------------------- | ----------------- |
| GET    | `/discount-advice-direct` | ML recommendation |
| POST   | `/simulate-discount`      | Simulate revenue  |

---

## ML Service

```
http://localhost:5001
```

| Method | Endpoint   | Description        |
| ------ | ---------- | ------------------ |
| POST   | `/predict` | Predict units sold |
| POST   | `/advise`  | Best discount      |
| GET    | `/health`  | Service health     |
| POST   | `/retrain` | Retrain model      |

---

# 🤖 ML Model

| Property   | Value                   |
| ---------- | ----------------------- |
| Algorithm  | Random Forest Regressor |
| Trees      | 100                     |
| Dataset    | 3600 sales records      |
| Products   | 75                      |
| Categories | 7                       |

### Features

```
price
discount
category
```

### Target

```
units_sold
```

### Advisory Logic

Simulates discounts:

```
0%
5%
10%
15%
20%
25%
30%
```

Chooses the **discount with highest predicted revenue**.

---

# ⚠️ Common Errors

### ECONNREFUSED

Backend not running.

```bash
npm run dev
```

---

### ML Service Unavailable

Run:

```bash
python api.py
```

---

### MONGO_URI Not Set

Create `.env` file.

---

### Python Module Error

Install dependencies:

```bash
pip install -r requirements.txt
```

---

### Model Not Found

Run:

```bash
python model.py
```

---

### Charts Not Loading

DummyJSON API may be temporarily down.

---

# 🔐 Environment Variables

## Backend `.env`

| Variable       | Description              |
| -------------- | ------------------------ |
| NODE_ENV       | development / production |
| PORT           | backend port             |
| MONGO_URI      | MongoDB connection       |
| JWT_SECRET     | JWT secret               |
| ML_SERVICE_URL | ML service URL           |
| CORS_ORIGIN    | frontend URL             |

---

## Frontend `.env`

(optional)

```
REACT_APP_API_URL
```

---

# 📊 System Architecture

```
React Frontend
      │
      ▼
Node.js Backend API
      │
      ▼
Python ML Service
      │
      ▼
MongoDB Database
```

---

# 📜 License

MIT License
