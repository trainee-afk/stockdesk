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


const getProductsQuery = (filters) => {

    let paramIndex = 1;
    const fields = [];
    const values = [];

    const { page, limit, search, categoryId, minPrice, maxPrice, inStock, sortBy, order, productIds, stock_threshold } = filters || {};

    if (search && search.trim() !== "") {
        fields.push(`(name ilike $${paramIndex} or sku ilike $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
    }

    if (categoryId) {
        fields.push(`fk_category_id = $${paramIndex}`);
        values.push(categoryId);
        paramIndex++;
    }

    if (productIds !== undefined) {
        fields.push(`id = ANY($${paramIndex}::int[])`);
        values.push(productIds);
        paramIndex++;
    }

    if (minPrice !== undefined) {
        fields.push(`price >= $${paramIndex}`);
        values.push(minPrice);
        paramIndex++;
    }

    if (maxPrice !== undefined) {
        fields.push(`price <= $${paramIndex}`);
        values.push(maxPrice);
        paramIndex++;
    }

    if (inStock !== undefined) {
        if (inStock === "true") fields.push(`stock_quantity > 0`);
        else fields.push(`stock_quantity = 0`);
    }

    if (stock_threshold !== undefined) {
        fields.push(`stock_quantity <= $${paramIndex}`);
        values.push(stock_threshold);
        paramIndex++;
    }

    const whereClause = fields.length > 0 ? `WHERE ${fields.join(" AND ")}` : "";

    let orderByClause = "";
    if (sortBy) {
        orderByClause = `ORDER BY ${sortBy} ${(order || "asc").toUpperCase()}`;
    }

    let paginationClause = "";
    if (page !== undefined && limit !== undefined) {
        const offset = (page - 1) * limit;
        paginationClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        values.push(limit, offset);
    }

    const query = `
        SELECT * FROM product
        ${whereClause}
        ${orderByClause}
        ${paginationClause}
    `;

    return { query, values };

};

const getProducts = async (filters) => {
    const { query, values } = getProductsQuery(filters);

    const result = await db.query(query, values);

    return result.rows;
}


const getProductsCount = async (filters) => {
    const { query, values } = getProductsQuery({
        ...filters,
        page: undefined,
        limit: undefined,
    });

    const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
    const result = await db.query(countQuery, values);
    return parseInt(result.rows[0].count);
}

const decreaseStockQuery = (lineItems) => {
    const values = [];
    const requestedProducts = lineItems.map(({ productId, quantity }) => {
        const productIdParam = values.length + 1;
        const quantityParam = values.length + 2;

        values.push(productId, quantity);

        return `($${productIdParam}::int, $${quantityParam}::int)`;
    });

    const query = `
        UPDATE product AS p
        SET stock_quantity = p.stock_quantity - requested.quantity
        FROM (VALUES ${requestedProducts.join(", ")})
            AS requested(id, quantity)
        WHERE p.id = requested.id
          AND p.stock_quantity >= requested.quantity
        RETURNING p.id, p.stock_quantity;
    `;

    return { query, values };
};

module.exports = {
    createProduct,
    getProductBySku,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsQuery,
    getProducts,
    getProductsCount,
    decreaseStockQuery,
};
