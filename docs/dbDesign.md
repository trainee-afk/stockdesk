# Database Design & Architecture Documentation

## Overview
This document outlines the database schema, entity relationships, indexing strategy, and technical reasoning behind key architectural decisions for the StockDesk assignment.

---


## Schema & Table Structures

### 1. `user` Table
Stores internal system users authorized to access administrative or operational panels.
- **`id`**: `SERIAL PRIMARY KEY` — Unique auto-incrementing identifier.
- **`email`**: `VARCHAR(255) NOT NULL UNIQUE` — Unique identifier for login. Explicitly indexed via a Unique B-Tree Index for fast authentication lookup.
- **`password`**: `VARCHAR(255) NOT NULL` — Hashed password credential.
- **`role`**: `ENUM ('ADMIN', 'STAFF') NOT NULL` — Restricts access levels via PostgreSQL custom ENUM type.
- **`created_at`**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` — Record creation timestamp.

---

### 2. `category` Table
Logical grouping for products.
- **`id`**: `SERIAL PRIMARY KEY`
- **`name`**: `VARCHAR(255) NOT NULL`
- **`description`**: `TEXT`
- **`created_at`**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---

### 3. `product` Table
Core catalog table holding item detail, stock levels, pricing, and category mapping.
- **`id`**: `SERIAL PRIMARY KEY`
- **`name`**: `VARCHAR(255) NOT NULL`
- **`sku`**: `VARCHAR(100) NOT NULL UNIQUE` — Stock Keeping Unit. Unique B-Tree Index applied to ensure strict global uniqueness and facilitate instant SKU lookups.
- **`price`**: `NUMERIC(10,2) NOT NULL` — B-Tree Indexed to accelerate range filters and queries like `WHERE price BETWEEN x AND y`.
- **`stock_quantity`**: `INT NOT NULL DEFAULT 0` — Inventory quantity.
- **`fk_category_id`**: `INT NOT NULL` — Foreign Key pointing to `category(id)`. B-Tree Indexed for fast joins and category-based filtering.
- **`created_at`**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---

### 4. `supplier` Table
Entities providing goods/inventory.
- **`id`**: `SERIAL PRIMARY KEY`
- **`name`**: `VARCHAR(255) NOT NULL`
- **`email`**: `VARCHAR(255) NOT NULL UNIQUE` — Explicit Unique B-Tree Index.
- **`phone`**: `VARCHAR(50)`
- **`created_at`**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---

### 5. `customer` Table
Registered purchasing end-users.
- **`id`**: `SERIAL PRIMARY KEY`
- **`name`**: `VARCHAR(255) NOT NULL`
- **`email`**: `VARCHAR(255) NOT NULL UNIQUE` — Explicit Unique B-Tree Index for user identification and fast lookups.
- **`phone`**: `VARCHAR(50)`
- **`address`**: `TEXT`
- **`created_at`**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---

### 6. `order` Table
Header table tracking individual customer purchasing transactions.
- **`id`**: `SERIAL PRIMARY KEY`
- **`fk_customer_id`**: `INT NOT NULL` — Foreign Key to `customer(id)`. B-Tree Indexed to optimize customer order history lookups.
- **`status`**: `ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL` — Strictly typed status workflow.
- **`total_amount`**: `NUMERIC(10,2) NOT NULL DEFAULT 0.00`
- **`created_at`**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` — B-Tree Indexed to enable high-performance time-based filtering and analytics queries (e.g., daily sales, date range reporting).

---

### 7. `order_item` Table
Line-item detail breakdown for each order.
- **`id`**: `SERIAL PRIMARY KEY`
- **`fk_order_id`**: `INT NOT NULL` — Foreign Key to `"order"(id)`. Indexed for instant retrieval of items belonging to a given order.
- **`fk_product_id`**: `INT NOT NULL` — Foreign Key to `product(id)`. Indexed for tracking product sales across orders.
- **`quantity`**: `INT NOT NULL CHECK (quantity > 0)`
- **`unit_price`**: `NUMERIC(10,2) NOT NULL` — Captured at time of purchase to preserve historical pricing integrity.
- **`line_total`**: `NUMERIC(10,2) NOT NULL` — Precomputed item total (`quantity * unit_price`).
- **`created_at`**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---

### 8. `product_supplier_map` Table
Junction/Bridge table establishing a Many-to-Many relationship between `product` and `supplier`.
- **`fk_product_id`**: `INT NOT NULL` — Foreign Key referencing `product(id)`.
- **`fk_supplier_id`**: `INT NOT NULL` — Foreign Key referencing `supplier(id)`.
- **`Primary Key`**: Composite primary key `(fk_product_id, fk_supplier_id)` which inherently enforces uniqueness and creates a compound index for fast junction queries.
- **`created_at`**: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---

## Detailed Design & Indexing Rationale

### 1. `product.name` — Why No Index?
- **Decision**: No standard B-Tree index is added to `product.name`.
- **Reasoning**: Search queries for products typically rely on partial substring matching or wildcards (e.g., `WHERE name ILIKE '%lap%'`). Standard B-Tree indexes cannot be utilized by PostgreSQL for leading-wildcard pattern matching (`%pattern%`) and will result in a Full Table Scan regardless. Adding a standard B-Tree index here would incur write overhead without providing read performance gains. *(Note: Full-Text Search / Trigram GIN indexes can be considered if substring search needs to be optimized in the future).*

### 2. `product.sku` — Unique Index
- **Decision**: Explicit Unique B-Tree Index (`uq_product_sku`).
- **Reasoning**: Ensures strict database-level data integrity, preventing duplicate SKUs from ever entering the inventory. Also optimizes direct SKU lookup queries to $O(\log N)$ time.

### 3. `product.price` — B-Tree Index
- **Decision**: Explicit B-Tree Index (`idx_product_price`).
- **Reasoning**: Frequently targeted in user-facing catalog queries with range filters (e.g., `WHERE price >= 100 AND price <= 500` or `ORDER BY price ASC`). The B-Tree index directly supports fast range scans and sorting.

### 4. `product.stock_quantity` — Why No Index?
- **Decision**: No index created on `stock_quantity`.
- **Reasoning**: The primary use case requires fetching products that are currently in stock (`stock_quantity > 0`). In a typical active inventory, the vast majority of catalog records will have `stock_quantity > 0`. Because a high percentage of rows match this predicate (low selectivity), the query planner will prefer a Sequential Scan over an Index Scan. Adding an index would only add write/update overhead without improving read speeds.

### 5. Foreign Key Indexing (`fk_*`)
- **Decision**: Created explicit B-Tree indexes on foreign keys:
  - `product.fk_category_id`
  - `order.fk_customer_id`
  - `order_item.fk_order_id`
  - `order_item.fk_product_id`
- **Reasoning**: PostgreSQL does **not** automatically index foreign key columns. Explicitly indexing them prevents full table scans during `JOIN` operations, cascading deletes, and relational lookup queries.

### 6. `order.created_at` — Date Filtering Index
- **Decision**: Explicit B-Tree Index (`idx_order_created_at`).
- **Reasoning**: Orders are heavily queried by time ranges for reporting, dashboards, and historical analysis (e.g., filtering orders created today, this week, or within a specific date window).

### 7. Unique Indexes for Identity Columns (`user.email`, `supplier.email`, `customer.email`)
- **Decision**: Explicit Unique Indexes on all email fields.
- **Reasoning**: Prevents duplicate account creation and provides $O(\log N)$ point lookups during authentication and customer profiling.