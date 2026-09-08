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
			ADD COLUMN IF NOT EXISTS hist_id INT DEFAULT NULL;

		ALTER TABLE category
			ADD COLUMN IF NOT EXISTS hist_id INT DEFAULT NULL;

		ALTER TABLE product
			ADD COLUMN IF NOT EXISTS hist_id INT DEFAULT NULL;

		ALTER TABLE supplier
			ADD COLUMN IF NOT EXISTS hist_id INT DEFAULT NULL;

		ALTER TABLE customer
			ADD COLUMN IF NOT EXISTS hist_id INT DEFAULT NULL;

		ALTER TABLE orders
			ADD COLUMN IF NOT EXISTS hist_id INT DEFAULT NULL;

		ALTER TABLE order_item
			ADD COLUMN IF NOT EXISTS hist_id INT DEFAULT NULL;

		ALTER TABLE product_supplier_map
			ADD COLUMN IF NOT EXISTS hist_id INT DEFAULT NULL;
	`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
		ALTER TABLE product_supplier_map DROP COLUMN IF EXISTS hist_id;
		ALTER TABLE order_item DROP COLUMN IF EXISTS hist_id;
		ALTER TABLE orders DROP COLUMN IF EXISTS hist_id;
		ALTER TABLE customer DROP COLUMN IF EXISTS hist_id;
		ALTER TABLE supplier DROP COLUMN IF EXISTS hist_id;
		ALTER TABLE product DROP COLUMN IF EXISTS hist_id;
		ALTER TABLE category DROP COLUMN IF EXISTS hist_id;
		ALTER TABLE users DROP COLUMN IF EXISTS hist_id;
	`);
};
