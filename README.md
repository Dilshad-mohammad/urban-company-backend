# UrbanClap Backend

Node.js Express backend for Urban Company clone — Home Services Marketplace.

## Tech Stack
- **Runtime**: Node.js >= 20
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (Access + Refresh tokens)
- **Storage**: Cloudinary
- **Security**: Helmet, rate-limit, mongo-sanitize

## Setup

```bash
# Install dependencies
npm install

# Configure environment
# Edit env/.env with your MongoDB URI, JWT secret, and Cloudinary keys

# Seed database
npm run seed

# Start development server
npm run dev
```

## API Endpoints

### Auth (`/api/v1/auth`)
- `POST /register` — Register user
- `POST /login` — Login
- `POST /social-login` — Google/Facebook login
- `GET /me` — Current user (protected)
- `POST /refresh-token` — Refresh JWT

### Categories (`/api/v1/categories`)
- `GET /` — List active categories
- `GET /:id/subcategories` — Subcategories

### Services (`/api/v1/services`)
- `GET /` — List services (with search, filter, sort)
- `GET /featured` — Featured services
- `GET /category/:categoryId` — By category

### Bookings (`/api/v1/bookings`)
- `POST /` — Create booking from cart
- `GET /my-bookings` — User's bookings
- `POST /:id/cancel` — Cancel booking
- `POST /:id/rebook` — Rebook past booking

### Cart (`/api/v1/cart`)
- `GET /` — View cart
- `POST /` — Add to cart
- `PUT /:serviceId` — Update quantity
- `DELETE /:serviceId` — Remove item

### Admin (`/api/v1/admin/...`)
- `GET /bookings` — All bookings
- `PUT /bookings/:id` — Update status
- `PATCH /bookings/:id/assign` — Assign provider
- `CRUD /services` — Manage services
- `CRUD /coupons` — Manage coupons
- `GET /dashboard/stats` — Dashboard analytics
# urban-company-backend
