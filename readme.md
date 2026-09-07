# StockDesk

StockDesk is an inventory and order management application built with Node.js, Express, PostgreSQL, and EJS server-side rendering.

The project provides a JSON API for application integrations and browser-based server-rendered pages for the inventory workflow.

## Features

- JWT authentication stored in an HTTP-only cookie
- Role-based access for `ADMIN` and `STAFF` users
- Product listing with search, category filtering, and pagination
- Server-rendered product creation form with validation and service errors
- Low-stock report with a configurable stock threshold
- Top-products report with a configurable result limit
- Orders list with status filtering and pagination
- Order detail page with customer information and line items
- Product CSV import API
- PostgreSQL schema and migration
- Request logging, security headers, CORS, and centralized API error handling

## Technology

- Node.js
- Express
- PostgreSQL
- EJS
- `pg`
- Zod
- JWT and `bcryptjs`
- `node-pg-migrate`

## Requirements

- Node.js 18 or newer
- PostgreSQL 14 or newer recommended
- npm

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
copy .env.example .env
```

On macOS or Linux, use:

```bash
cp .env.example .env
```

Update `.env` with the PostgreSQL connection details and a strong JWT secret.

Required environment variables:

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | HTTP server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/stockdesk` |
| `JWT_SECRET` | Secret used to sign JWTs | `replace-with-a-long-secret` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

Create the database, then run the migration:

```bash
npm run migrate:up
```

Start the application:

```bash
npm start
```

For development with automatic restart:

```bash
npm run dev
```

The server runs at:

```text
http://localhost:5000
```

## Server-rendered pages

The browser pages use EJS templates and authenticate with the JWT stored in the `token` cookie.

| Page | URL | Access |
| --- | --- | --- |
| Login | `GET /login` | Public |
| Products | `GET /products` | Authenticated users |
| Add product | `GET /products/new` | Authenticated page; intended for admins |
| Create product | `POST /products/new` | Authenticated page; intended for admins |
| Low-stock report | `GET /products/low-stock?threshold=10` | Admin |
| Top-products report | `GET /products/top-products?limit=10` | Admin |
| Orders | `GET /orders?status=PENDING` | Authenticated users |
| Order detail | `GET /orders/:id` | Authenticated users |

The products page supports these query parameters:

```text
/products?search=laptop&categoryId=2&page=1&limit=10
```

The orders page supports:

```text
/orders?status=SHIPPED&page=1&limit=20
```

## API endpoints

All API endpoints except registration and login require the JWT cookie or a Bearer token.

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Authenticate and set the token cookie |
| `GET` | `/api/auth/me` | Return the authenticated user |

### Products

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Authenticated | List products with filters and pagination |
| `GET` | `/api/products/:id` | Authenticated | Get one product |
| `POST` | `/api/products` | Admin | Create a product |
| `PATCH` | `/api/products/:id` | Admin | Update a product |
| `DELETE` | `/api/products/:id` | Admin | Delete a product |
| `POST` | `/api/products/import` | Admin | Import products from CSV |

Product listing filters include `search`, `categoryId`, `page`, `limit`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, and `order`.

### Categories

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/categories/:id` | Authenticated | Get one category |
| `POST` | `/api/categories` | Admin | Create a category |
| `PATCH` | `/api/categories/:id` | Admin | Update a category |
| `DELETE` | `/api/categories/:id` | Admin | Delete a category |

### Customers

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/customers/:id` | Get one customer |
| `POST` | `/api/customers` | Create a customer |
| `DELETE` | `/api/customers/:id` | Delete a customer |

### Orders

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/orders` | List orders with pagination and status/date filters |
| `GET` | `/api/orders/:id` | Get an order with line items |
| `POST` | `/api/orders` | Create an order and reduce stock |
| `PATCH` | `/api/orders/:id/status` | Update order status |

Order statuses are:

```text
PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
```

### Reports

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/reports/low-stock?threshold=10` | Admin | Products at or below the stock threshold |
| `GET` | `/api/reports/top-products?limit=10` | Admin | Best-selling products by quantity sold |
| `GET` | `/api/reports/sales-summary` | Admin | Sales totals and averages with optional date filters |

## Authentication

The login API and web login both issue a JWT in an HTTP-only cookie named `token`.

For API clients, a Bearer token is also supported:

```http
Authorization: Bearer <token>
```

Users have one of two roles:

- `ADMIN`: product writes, report access, category management, and other administrative operations
- `STAFF`: authenticated operational access without admin-only API operations

## Project structure

```text
src/
	config/          Database and upload configuration
	controllers/     API and server-rendered request handlers
	middlewares/     Authentication, authorization, validation, and errors
	models/          PostgreSQL queries
	routes/          API and web route definitions
	services/        Business logic
	validators/      Zod request schemas
	views/           EJS server-rendered pages
	public/          CSS and static assets
migrations/        PostgreSQL schema migration
docs/              Database design documentation
```

## Database

The migration creates tables for:

- Users
- Categories
- Products
- Suppliers
- Customers
- Orders
- Order items
- Product-supplier relationships

The detailed schema and indexing decisions are documented in [docs/dbDesign.md](docs/dbDesign.md).

To roll back the latest migration:

```bash
npm run migrate:down
```

## Assignment coverage

Implemented:

- Login page and backend authentication integration
- Product table with search, category filter, and pagination
- Add-product page with server-side validation feedback
- Low-stock and top-products report pages with filters
- Orders list with status filter and pagination
- Order detail page with line items

Potential follow-up work:

- Edit-product server-rendered page and update form handling
- Logout route/button
- A dedicated web error page instead of JSON for unexpected web errors
- Automated tests and seed data

## Health check

```text
GET /health
```

Expected response:

```json
{
	"message": "Hello, World!"
}
```
