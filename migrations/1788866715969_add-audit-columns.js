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
		ALTER TABLE users
			ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

		ALTER TABLE category
			ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

		ALTER TABLE product
			ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

		ALTER TABLE supplier
			ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

		ALTER TABLE customer
			ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

		ALTER TABLE orders
			ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

		ALTER TABLE order_item
			ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

		ALTER TABLE product_supplier_map
			ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
	`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
		ALTER TABLE product_supplier_map DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS is_deleted;
		ALTER TABLE order_item DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS is_deleted;
		ALTER TABLE orders DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS is_deleted;
		ALTER TABLE customer DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS is_deleted;
		ALTER TABLE supplier DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS is_deleted;
		ALTER TABLE product DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS is_deleted;
		ALTER TABLE category DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS is_deleted;
		ALTER TABLE users DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS is_deleted;
	`);
};
