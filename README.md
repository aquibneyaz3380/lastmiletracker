# LastMile Delivery Tracker

A full-stack last-mile delivery management platform with role-based access (Customer / Agent / Admin), auto-calculated shipping charges, intelligent agent auto-assignment, real-time order tracking, and email + SMS notifications.

---

## Hosted Application

> After deploying (see Deployment section below), replace these with your live URLs:

| Service  | URL |
|----------|-----|
| Frontend | `https://lastmile-frontend.vercel.app` *(replace with your Vercel URL)* |
| Backend  | `https://lastmile-backend.onrender.com` *(replace with your Render URL)* |
| API Health | `https://lastmile-backend.onrender.com/api/health` |

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Node.js, Express.js                     |
| Database | PostgreSQL + Prisma ORM                 |
| Frontend | React 18, Vite, Tailwind CSS            |
| Auth     | JWT (role-based: CUSTOMER/AGENT/ADMIN)  |
| Email    | Nodemailer (Gmail SMTP / any SMTP)      |
| SMS      | Fast2SMS (free tier) or Twilio          |

---

## Project Structure

```
lastmile/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── agent.controller.js
│   │   │   ├── zone.controller.js
│   │   │   ├── rateCard.controller.js
│   │   │   └── tracking.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── agent.routes.js
│   │   │   ├── zone.routes.js
│   │   │   ├── rateCard.routes.js
│   │   │   └── tracking.routes.js
│   │   ├── services/
│   │   │   ├── rateCalculation.service.js
│   │   │   ├── assignment.service.js
│   │   │   ├── email.service.js
│   │   │   └── sms.service.js
│   │   ├── utils/
│   │   │   ├── prisma.js
│   │   │   └── seed.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/shared/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── TrackOrder.jsx
│   │   │   ├── customer/
│   │   │   │   ├── CustomerDashboard.jsx
│   │   │   │   ├── CreateOrder.jsx
│   │   │   │   └── OrderDetail.jsx
│   │   │   ├── agent/
│   │   │   │   └── AgentDashboard.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminOrderDetail.jsx
│   │   │       ├── AdminCreateOrder.jsx
│   │   │       ├── AdminZones.jsx
│   │   │       ├── AdminRateCards.jsx
│   │   │       └── AdminAgents.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── SYSTEM_DESIGN.md
├── .gitignore
└── README.md
```

---

## Setup Guide

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local or cloud — Supabase / Railway / Neon all work)

---

### 1. Clone / Extract

```bash
git clone https://github.com/yourusername/lastmile-delivery-tracker.git
cd lastmile-delivery-tracker
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values (see `.env.example` section below), then:

```bash
# Generate Prisma client and push schema to DB
npx prisma generate
npx prisma db push

# Seed demo data (zones, areas, rate cards, admin/agent/customer accounts)
node src/utils/seed.js

# Start development server
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api in .env

npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## .env.example

### backend/.env.example
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lastmile_db"

# Auth
JWT_SECRET="your_super_secret_jwt_key_change_this"

# Server
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Email (Nodemailer - Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_gmail_app_password"
SMTP_FROM="LastMile Delivery <your_email@gmail.com>"

# SMS (optional - leave SMS_API_KEY blank to disable)
SMS_PROVIDER="fast2sms"
SMS_API_KEY=""

# Twilio alternative:
# SMS_PROVIDER="twilio"
# TWILIO_ACCOUNT_SID=""
# TWILIO_AUTH_TOKEN=""
# TWILIO_FROM="+1234567890"
```

> **Gmail tip:** Enable 2FA → generate App Password at myaccount.google.com/apppasswords

### frontend/.env.example
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Demo Accounts (after seeding)

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | admin@lastmile.com       | Admin@123     |
| Agent    | agent1@lastmile.com      | Agent@123     |
| Customer | customer1@lastmile.com   | Customer@123  |

---

## Database Schema

### User
| Column   | Type     | Notes                         |
|----------|----------|-------------------------------|
| id       | String   | CUID primary key              |
| name     | String   |                               |
| email    | String   | Unique                        |
| password | String   | bcrypt hashed                 |
| phone    | String?  | Optional, used for SMS        |
| role     | Enum     | CUSTOMER / AGENT / ADMIN      |

### Zone
| Column | Type   | Notes        |
|--------|--------|--------------|
| id     | String | CUID         |
| name   | String | Unique       |

### Area
| Column  | Type   | Notes               |
|---------|--------|---------------------|
| id      | String | CUID                |
| name    | String |                     |
| pincode | String | Unique              |
| zoneId  | String | FK → Zone           |

### RateCard
| Column       | Type      | Notes                                        |
|--------------|-----------|----------------------------------------------|
| id           | String    | CUID                                         |
| orderType    | Enum      | B2B / B2C                                    |
| fromZoneId   | String    | FK → Zone                                    |
| toZoneId     | String    | FK → Zone                                    |
| ratePerKg    | Float     | Charge per chargeable kg                     |
| codSurcharge | Float     | Added when paymentType = COD                 |
| Unique       |           | (orderType, fromZoneId, toZoneId)            |

### DeliveryAgent
| Column      | Type    | Notes                   |
|-------------|---------|-------------------------|
| id          | String  | CUID                    |
| userId      | String  | FK → User (unique 1:1)  |
| zoneId      | String  | FK → Zone               |
| latitude    | Float?  | GPS for auto-assignment |
| longitude   | Float?  | GPS for auto-assignment |
| isAvailable | Boolean | Toggled on assignment   |

### Order
| Column           | Type       | Notes                            |
|------------------|------------|----------------------------------|
| id               | String     | CUID                             |
| trackingId       | String     | Public tracking reference        |
| customerId       | String     | FK → User                        |
| createdById      | String?    | FK → User (admin who created)    |
| agentId          | String?    | FK → DeliveryAgent               |
| pickupAddress    | String     |                                  |
| pickupPincode    | String     |                                  |
| pickupZoneId     | String     | FK → Zone (auto-detected)        |
| dropAddress      | String     |                                  |
| dropPincode      | String     |                                  |
| dropZoneId       | String     | FK → Zone (auto-detected)        |
| length           | Float      | cm                               |
| breadth          | Float      | cm                               |
| height           | Float      | cm                               |
| actualWeight     | Float      | kg                               |
| volumetricWeight | Float      | L×B×H ÷ 5000                    |
| chargeableWeight | Float      | max(actual, volumetric)          |
| orderType        | Enum       | B2B / B2C                        |
| paymentType      | Enum       | PREPAID / COD                    |
| status           | Enum       | See lifecycle below              |
| baseCharge       | Float      | chargeableWeight × ratePerKg     |
| codSurcharge     | Float      | 0 if PREPAID                     |
| totalCharge      | Float      | baseCharge + codSurcharge        |
| scheduledDate    | DateTime?  |                                  |

### TrackingEvent (immutable append-only)
| Column    | Type       | Notes                          |
|-----------|------------|--------------------------------|
| id        | String     | CUID                           |
| orderId   | String     | FK → Order                     |
| status    | Enum       | Status at time of event        |
| note      | String?    | Optional description           |
| actorId   | String?    | User who triggered the change  |
| actorRole | Enum?      | CUSTOMER / AGENT / ADMIN       |
| createdAt | DateTime   | Set once, never updated        |

### Order Status Lifecycle
```
PENDING ──► ASSIGNED ──► PICKED_UP ──► IN_TRANSIT ──► OUT_FOR_DELIVERY ──► DELIVERED
                                                              │
                                                              └──► FAILED ──► RESCHEDULED ──► ASSIGNED (retry)
```

---

## Rate Calculation Logic

```
Step 1: Zone Detection
  pickupZone = Area.findByPincode(pickupPincode).zone
  dropZone   = Area.findByPincode(dropPincode).zone

Step 2: Volumetric Weight
  volumetricWeight = (length × breadth × height) ÷ 5000

Step 3: Chargeable Weight
  chargeableWeight = max(actualWeight, volumetricWeight)

Step 4: Rate Card Lookup
  rateCard = RateCard.find(orderType, pickupZone.id, dropZone.id)
  // Separate cards for B2B and B2C, intra-zone and inter-zone

Step 5: Charge Calculation
  baseCharge   = chargeableWeight × rateCard.ratePerKg
  codSurcharge = (paymentType === 'COD') ? rateCard.codSurcharge : 0
  totalCharge  = baseCharge + codSurcharge
```

All rates are fully admin-configurable — nothing is hardcoded. The quote is shown to the customer before they confirm the order.

---

## API Documentation

### Auth
| Method | Endpoint            | Auth | Description           |
|--------|---------------------|------|-----------------------|
| POST   | /api/auth/register  | No   | Customer registration |
| POST   | /api/auth/login     | No   | Login (all roles)     |
| GET    | /api/auth/me        | Yes  | Current user info     |

### Orders
| Method | Endpoint                   | Auth            | Description                  |
|--------|----------------------------|-----------------|------------------------------|
| GET    | /api/orders/quote          | Yes             | Charge estimate before order |
| POST   | /api/orders                | CUSTOMER, ADMIN | Create order                 |
| GET    | /api/orders                | Yes             | List orders (role-filtered)  |
| GET    | /api/orders/:id            | Yes             | Order detail + history       |
| POST   | /api/orders/:id/reschedule | CUSTOMER, ADMIN | Reschedule a failed order    |

### Tracking (Public — no auth required)
| Method | Endpoint                    | Auth | Description          |
|--------|-----------------------------|------|----------------------|
| GET    | /api/tracking/:trackingId   | No   | Live order tracking  |

### Agent
| Method | Endpoint                     | Auth  | Description            |
|--------|------------------------------|-------|------------------------|
| GET    | /api/agent/orders            | AGENT | My assigned orders     |
| PATCH  | /api/agent/orders/:id/status | AGENT | Update delivery status |
| PATCH  | /api/agent/location          | AGENT | Update GPS location    |

### Admin
| Method | Endpoint                           | Auth  | Description              |
|--------|------------------------------------|-------|--------------------------|
| POST   | /api/admin/agents                  | ADMIN | Create delivery agent    |
| GET    | /api/admin/agents                  | ADMIN | List all agents          |
| GET    | /api/admin/customers               | ADMIN | List all customers       |
| POST   | /api/admin/orders/:id/assign       | ADMIN | Manual agent assignment  |
| POST   | /api/admin/orders/:id/auto-assign  | ADMIN | Auto-assign nearest agent|
| PATCH  | /api/admin/orders/:id/status       | ADMIN | Override order status    |

### Zones (Admin-managed)
| Method | Endpoint                  | Auth  | Description         |
|--------|---------------------------|-------|---------------------|
| GET    | /api/zones                | Yes   | List all zones      |
| POST   | /api/zones                | ADMIN | Create zone         |
| POST   | /api/zones/:zoneId/areas  | ADMIN | Add pincode to zone |
| DELETE | /api/zones/:id            | ADMIN | Delete zone         |

### Rate Cards (Admin-managed)
| Method | Endpoint            | Auth  | Description              |
|--------|---------------------|-------|--------------------------|
| GET    | /api/rate-cards     | Yes   | List all rate cards      |
| POST   | /api/rate-cards     | ADMIN | Create or update card    |
| DELETE | /api/rate-cards/:id | ADMIN | Delete rate card         |

---

## Deployment

### Backend — Render / Railway

1. Push to GitHub (public repo, `main` branch)
2. Create new **Web Service**, set root to `backend/`
3. Build command: `npm install && npx prisma generate && npx prisma db push`
4. Start command: `node src/index.js`
5. Add all env vars from `.env.example`
6. After first deploy, open Shell and run: `node src/utils/seed.js`

### Frontend — Vercel

1. Import GitHub repo in Vercel
2. Set **Root Directory** to `frontend/`
3. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy

---

## Features Checklist

- [x] Customer registration & login
- [x] Admin & agent accounts created by admin
- [x] Zone management with pincode-to-zone mapping
- [x] Rate card configuration (B2B/B2C, intra/inter-zone, COD surcharge) — fully admin-managed
- [x] Order creation with live charge quote before confirmation
- [x] Volumetric weight calculation (L×B×H ÷ 5000)
- [x] Chargeable weight = max(actual, volumetric)
- [x] Admin can create orders on behalf of customers
- [x] Auto zone detection by pincode
- [x] Auto-assign nearest available agent (Haversine distance + zone preference)
- [x] Manual agent assignment by admin
- [x] Full order status lifecycle (8 states)
- [x] Immutable tracking history with actor (CUSTOMER/AGENT/ADMIN) and timestamp
- [x] Failed delivery → customer reschedule → agent freed → re-assignment
- [x] Email notifications on every status change (Nodemailer)
- [x] SMS notifications on every status change (Fast2SMS / Twilio)
- [x] Public order tracking by tracking ID (no login required)
- [x] Admin order filters (by status, zone, agent)
- [x] Admin status override for any order
- [x] Role-based access control (JWT middleware)
- [x] Agent GPS location updates for improved auto-assignment
