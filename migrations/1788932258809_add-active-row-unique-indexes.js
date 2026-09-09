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
		DROP INDEX IF EXISTS uq_user_email;
		DROP INDEX IF EXISTS uq_product_sku;
		DROP INDEX IF EXISTS uq_supplier_email;
		DROP INDEX IF EXISTS uq_customer_email;

		CREATE UNIQUE INDEX IF NOT EXISTS uq_user_email_active
			ON users (LOWER(email))
			WHERE hist_id IS NULL AND is_deleted = FALSE;
		CREATE UNIQUE INDEX IF NOT EXISTS uq_product_sku_active
			ON product (LOWER(sku))
			WHERE hist_id IS NULL AND is_deleted = FALSE;
		CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_email_active
			ON supplier (LOWER(email))
			WHERE hist_id IS NULL AND is_deleted = FALSE;
		CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_email_active
			ON customer (LOWER(email))
			WHERE hist_id IS NULL AND is_deleted = FALSE;
	`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
		DROP INDEX IF EXISTS uq_user_email_active;
		DROP INDEX IF EXISTS uq_product_sku_active;
		DROP INDEX IF EXISTS uq_supplier_email_active;
		DROP INDEX IF EXISTS uq_customer_email_active;

		CREATE UNIQUE INDEX IF NOT EXISTS uq_user_email ON users(email);
		CREATE UNIQUE INDEX IF NOT EXISTS uq_product_sku ON product(sku);
		CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_email ON supplier(email);
		CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_email ON customer(email);
	`);
};
