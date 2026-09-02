
create table "user" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    fk_category_id INT NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table supplier (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table customer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table "order" (
    id SERIAL PRIMARY KEY,
    fk_customer_id INT NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
    status VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table order_item (
    id SERIAL PRIMARY KEY,
    fk_order_id INT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    fk_product_id INT NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table product_supplier_map (
    fk_product_id INT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    fk_supplier_id INT NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (fk_product_id, fk_supplier_id)
);


-- unique
CREATE UNIQUE INDEX uq_user_email ON "user"(email);
CREATE UNIQUE INDEX uq_product_sku ON product(sku);
CREATE UNIQUE INDEX uq_supplier_email ON supplier(email);
CREATE UNIQUE INDEX uq_customer_email ON customer(email);


-- indexes
CREATE INDEX idx_product_price ON product(price);
CREATE INDEX idx_product_fk_category ON product(fk_category_id);

CREATE INDEX idx_order_fk_customer ON "order"(fk_customer_id);
CREATE INDEX idx_order_created_at ON "order"(created_at);

CREATE INDEX idx_order_item_fk_order ON order_item(fk_order_id);
CREATE INDEX idx_order_item_fk_product ON order_item(fk_product_id);