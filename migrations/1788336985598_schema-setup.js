/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {

    pgm.sql(`
    
        -- 1. Tables
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(100) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS category (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS product (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            sku VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            stock_quantity INT NOT NULL DEFAULT 0,
            fk_category_id INT NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS supplier (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customer (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            address TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            fk_customer_id INT NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
            status VARCHAR(100) NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_item (
            id SERIAL PRIMARY KEY,
            fk_order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            fk_product_id INT NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
            quantity INT NOT NULL CHECK (quantity > 0),
            unit_price DECIMAL(10, 2) NOT NULL,
            line_total DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS product_supplier_map (
            fk_product_id INT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
            fk_supplier_id INT NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (fk_product_id, fk_supplier_id)
        );

        -- 2. Unique Indexes
        CREATE UNIQUE INDEX IF NOT EXISTS uq_user_email ON users(email);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_product_sku ON product(sku);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_email ON supplier(email);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_email ON customer(email);

        -- 3. Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_product_price ON product(price);
        CREATE INDEX IF NOT EXISTS idx_product_fk_category ON product(fk_category_id);
        CREATE INDEX IF NOT EXISTS idx_order_fk_customer ON orders(fk_customer_id);
        CREATE INDEX IF NOT EXISTS idx_order_created_at ON orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_order_item_fk_order ON order_item(fk_order_id);
        CREATE INDEX IF NOT EXISTS idx_order_item_fk_product ON order_item(fk_product_id);
  
    `);

};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS product_supplier_map CASCADE;
        DROP TABLE IF EXISTS order_item CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS customer CASCADE;
        DROP TABLE IF EXISTS supplier CASCADE;
        DROP TABLE IF EXISTS product CASCADE;
        DROP TABLE IF EXISTS category CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
  `);
};
