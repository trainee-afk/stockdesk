const db = require("../config/db");

const createProduct = async ({ name, sku, price, stock_quantity, fk_category_id }) => {
    const result = await db.query(
        `
            INSERT INTO product (name, sku, price, stock_quantity, fk_category_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `,
        [name, sku, price, stock_quantity, fk_category_id]
    );

    return result.rows[0];
};

const getProductBySku = async (sku, filters) => {
    const { excludedProductId } = filters || {};
    const params = [sku];
    if (excludedProductId) params.push(excludedProductId);

    const result = await db.query(
        `SELECT * FROM product WHERE LOWER(sku) = LOWER($1) ${excludedProductId ? 'AND id != $2' : ''}`,
        params
    );

    return result.rows[0];
};

const getProductById = async (productId) => {
    const result = await db.query(
        `SELECT * FROM product WHERE id = $1`,
        [productId]
    );

    return result.rows[0];
};

const updateProduct = async (productId, productData) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(productData)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;

    }

    if (fields.length === 0) {
        const error = new Error("No fields provided for update");
        error.statusCode = 400;
        throw error;
    }

    values.push(productId);

    const result = await db.query(
        `
            UPDATE product
            SET ${fields.join(", ")}
            WHERE id = $${paramIndex}
            RETURNING *
        `,
        values
    );

    return result.rows[0];
};

const deleteProduct = async (productId) => {
    const result = await db.query(
        `DELETE FROM product WHERE id = $1 RETURNING *`,
        [productId]
    );

    return result.rows[0];
};

module.exports = {
    createProduct,
    getProductBySku,
    getProductById,
    updateProduct,
    deleteProduct,
};
