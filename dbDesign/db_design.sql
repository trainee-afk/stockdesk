
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hist_id INT DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hist_id INT DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    fk_category_id INT NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hist_id INT DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE supplier (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hist_id INT DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE customer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hist_id INT DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    fk_customer_id INT NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
    status VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hist_id INT DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE order_item (
    id SERIAL PRIMARY KEY,
    fk_order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    fk_product_id INT NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hist_id INT DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE product_supplier_map (
    fk_product_id INT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    fk_supplier_id INT NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hist_id INT DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (fk_product_id, fk_supplier_id)
);

-- Only one active business row may use each natural key. History and deleted
-- rows remain available for audit without blocking a replacement row.
CREATE UNIQUE INDEX uq_user_email_active
    ON users (LOWER(email))
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE UNIQUE INDEX uq_product_sku_active
    ON product (LOWER(sku))
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE UNIQUE INDEX uq_supplier_email_active
    ON supplier (LOWER(email))
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE UNIQUE INDEX uq_customer_email_active
    ON customer (LOWER(email))
    WHERE hist_id IS NULL AND is_deleted = FALSE;

-- Live-row indexes match the predicates used by application queries.
CREATE INDEX idx_category_active_name
    ON category (LOWER(name))
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_product_active_price
    ON product(price)
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_product_active_category
    ON product(fk_category_id)
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_order_active_customer
    ON orders(fk_customer_id)
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_order_active_created_at
    ON orders(created_at)
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_order_item_active_order
    ON order_item(fk_order_id)
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_order_item_active_product
    ON order_item(fk_product_id)
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_supplier_active_name
    ON supplier(LOWER(name))
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_product_supplier_map_active_product
    ON product_supplier_map(fk_product_id)
    WHERE hist_id IS NULL AND is_deleted = FALSE;

CREATE INDEX idx_product_supplier_map_active_supplier
    ON product_supplier_map(fk_supplier_id)
    WHERE hist_id IS NULL AND is_deleted = FALSE;