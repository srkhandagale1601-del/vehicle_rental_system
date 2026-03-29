# DriveX 🚗

A full-stack vehicle rental platform built with Node.js, Express, and PostgreSQL. Users can browse a live fleet, check availability by date, book vehicles, and pay — all from a single-page frontend with no frameworks required.

---

## What it does

DriveX lets users sign up, log in, browse available cars and bikes, filter by type/seats/rating, pick dates, and complete a booking with a simulated payment flow. Everything is tied to a real PostgreSQL database with proper session-based auth, overlap detection, and transactional booking logic.

The frontend is pure HTML/CSS/JS — no React, no build step — and talks to the Express backend via a REST API.

---

## Tech stack

- **Backend** — Node.js + Express (ESM)
- **Database** — PostgreSQL via `pg` (connection pool)
- **Auth** — `cookie-session` with bcrypt password hashing
- **Frontend** — Vanilla HTML, CSS, JS + GSAP for animations
- **Other** — `uuid` for transaction IDs, `dotenv` for config, `cors` for cross-origin dev setup

---

## Project structure

```
drivex/
├── public/
│   ├── drivex.html         # Single-page frontend
│   ├── drivex.css          # All styles
│   ├── drivex.js           # Frontend logic
│   └── images/vehicles/    # Vehicle images served statically
├── src/
│   ├── config/
│   │   └── db.js           # PostgreSQL pool setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   └── vehicleController.js
│   ├── middlewares/
│   │   ├── authmiddleware.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoute.js
│   │   └── vehicleRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── bookingService.js
│   │   └── vehicleService.js
│   ├── utils/
│   │   ├── hash.js
│   │   └── priceCalculator.js
│   └── app.js
├── server.js
├── .env
└── package.json
```

---

## Getting started

### Prerequisites

- Node.js v18+
- PostgreSQL (local or hosted)

### 1. Clone and install

```bash
git clone https://github.com/your-username/drivex.git
cd drivex
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root:

```env
DB_USER=your_postgres_user
DB_HOST=localhost
DB_NAME=drivex
DB_PASSWORD=your_password
DB_PORT=5432
PORT=5000
```

### 3. Set up the database

Connect to PostgreSQL and run:

```sql
CREATE DATABASE drivex;

\c drivex

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  seats INTEGER,
  rating NUMERIC(3,1),
  price_per_day NUMERIC(10,2),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  total_price NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  user_id INTEGER REFERENCES users(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  amount NUMERIC(10,2),
  payment_method VARCHAR(20),
  transaction_id TEXT UNIQUE,
  status VARCHAR(20) DEFAULT 'PAID',
  created_at TIMESTAMP DEFAULT NOW()
);
```

Then seed some vehicles if you want something to show up immediately:

```sql
INSERT INTO vehicles (name, type, seats, rating, price_per_day, image_url) VALUES
  ('Toyota Fortuner', 'SUV', 7, 4.9, 5200, '/images/vehicles/toyota_fortuner.jpg'),
  ('Honda City', 'Sedan', 5, 4.7, 3600, '/images/vehicles/hondacity.jpg'),
  ('Tata Nexon', 'SUV', 5, 4.6, 4100, '/images/vehicles/nexon.jpg'),
  ('Maruti Swift', 'Hatchback', 5, 4.5, 2400, '/images/vehicles/swift.jpg'),
  ('Bajaj Pulsar', 'Bike', 2, 4.8, 1400, '/images/vehicles/pulsar.jpg'),
  ('KTM Duke', 'Bike', 2, 4.4, 1700, '/images/vehicles/duke.jpg');
```

### 4. Start the server

```bash
node server.js
```

Open `http://localhost:5000` in your browser.

---

## API reference

All endpoints are prefixed from the root. Auth routes are public; booking and payment routes require a valid session cookie.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Login and get session |
| POST | `/auth/logout` | Clear session |

**Signup body:**
```json
{
  "name": "Aarav Shah",
  "email": "aarav@example.com",
  "phone": "9876543210",
  "password": "securepass123"
}
```

### Vehicles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehicles` | Get all vehicles (supports `?type=`, `?seats=`, `?rating=`) |
| POST | `/vehicles/available` | Get vehicles available for a date range |

**Available body:**
```json
{
  "start_date": "2026-04-10",
  "end_date": "2026-04-15"
}
```

### Bookings — requires auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create a booking |
| GET | `/bookings` | Get logged-in user's bookings |
| DELETE | `/bookings/:id` | Cancel a booking |

**Booking body:**
```json
{
  "vehicle_id": 1,
  "start_date": "2026-04-10",
  "end_date": "2026-04-15"
}
```

### Payments — requires auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments` | Pay for a booking |
| GET | `/payments` | Get logged-in user's payment history |

**Payment body:**
```json
{
  "booking_id": 3,
  "payment_method": "UPI",
  "amount": 22464
}
```

Valid payment methods: `CARD`, `UPI`, `NETBANKING`

---

## How bookings work

The booking service uses PostgreSQL transactions with row-level locks (`SELECT ... FOR UPDATE`) to handle concurrent requests safely. Before creating a booking, it checks:

1. The vehicle isn't already booked for the requested dates
2. The user doesn't have another booking that overlaps

If either check fails, the transaction rolls back and the user gets a clear error. This prevents double-bookings even if two users try to book the same vehicle at the exact same time.

The overlap check uses this condition:
```sql
start_date <= requested_end AND end_date >= requested_start
```

---

## Pricing

Pricing is calculated on the frontend:

```
subtotal = days × price_per_day
service_fee = subtotal × 8%
total = subtotal + service_fee
```

The `total_price` column in bookings is currently not populated by the backend — the frontend calculates and passes the amount at payment time. If you want to store it on booking creation, you can update `createBookings` in `bookingService.js` to include it.

---

## Frontend notes

The frontend is a single HTML file with no bundler. It connects to the backend using `fetch` with `credentials: 'include'` so session cookies work across the dev origin. The `API_BASE` is set dynamically:

```js
const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;
```

This means the backend always runs on port 5000 regardless of where the frontend is served from. If you change the port, update this line.

If the backend is unreachable, the UI falls back to a hardcoded demo fleet so the page isn't completely empty.

---

## Things worth knowing

- **Session secret** — The session key in `app.js` is hardcoded as `'secretKeys123'`. Change this before deploying anywhere.
- **CORS** — Currently set to `origin: true` (reflects any origin). Fine for dev, lock it down for production.
- **Images** — Vehicle images are served from `public/images/vehicles/`. If a vehicle's image isn't found, the frontend shows an emoji fallback.
- **No JWT** — Auth is cookie-session based. Sessions live for 24 hours and are stored client-side (signed, not encrypted).

---

## License

MIT
