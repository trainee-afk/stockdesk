const db = require("../config/db");

const createProduct = async ({ name, sku, price, stock_quantity, fk_category_id }, createdBy) => {
    const result = await db.query(
        `
            INSERT INTO product (name, sku, price, stock_quantity, fk_category_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `,
        [name, sku, price, stock_quantity, fk_category_id, createdBy]
    );

    return result.rows[0];
};

const createProductsBulk = async (products, createdBy = null) => {
    if (products.length === 0) {
        return [];
    }

    const values = [];
    const productValues = products.map(
        ({ name, sku, price, stock_quantity, fk_category_id }) => {
            const params = [
                values.length + 1,
                values.length + 2,
                values.length + 3,
                values.length + 4,
                values.length + 5,
                values.length + 6,
            ];

            values.push(name, sku, price, stock_quantity, fk_category_id, createdBy);

            return `(${params[0]}, ${params[1]}, ${params[2]}, ${params[3]}, ${params[4]}, ${params[5]}, NULL, FALSE)`;
        }
    );

    const query = `
        INSERT INTO product
            (name, sku, price, stock_quantity, fk_category_id, created_by, hist_id, is_deleted)
        VALUES ${productValues.join(", ")}
        RETURNING *;
    `;

    const result = await db.query(query, values);
    return result.rows;
};

const getProductBySku = async (sku, filters) => {
    const skuQuery = getProductBySkuQuery(sku, filters);
    const result = await db.query(skuQuery.query, skuQuery.values);

    return result.rows[0];
};

const getProductBySkuQuery = (sku, filters) => {
    const { excludedProductId } = filters || {};
    const values = [sku];
    let excludedProductClause = "";

    if (excludedProductId !== undefined) {
        values.push(excludedProductId);
        excludedProductClause = "AND id != $2";
    }

    return {
        query: `
            SELECT *
            FROM product
            WHERE LOWER(sku) = LOWER($1)
              ${excludedProductClause}
              AND hist_id IS NULL
              AND is_deleted = FALSE
        `,
        values,
    };
};

const getProductById = async (productId) => {
    const result = await db.query(
        `SELECT * FROM product WHERE id = $1 and hist_id is null and is_deleted = false`,
        [productId]
    );

    return result.rows[0];
};

const getProductForUpdateQuery = (productId) => ({
    query: `
        SELECT *
        FROM product
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        FOR UPDATE
    `,
    values: [productId],
});

const createProductHistoryQuery = (productId) => ({
    query: `
        INSERT INTO product (
            name,
            sku,
            price,
            stock_quantity,
            fk_category_id,
            created_by,
            created_at,
            hist_id,
            is_deleted
        )
        SELECT
            name,
            sku,
            price,
            stock_quantity,
            fk_category_id,
            created_by,
            created_at,
            id,
            is_deleted
        FROM product
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        RETURNING *
    `,
    values: [productId],
});

const updateProductQuery = (productId, productData, updatedBy = null) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const key of ["name", "sku", "price", "stock_quantity", "fk_category_id"]) {
        if (productData[key] === undefined) {
            continue;
        }

        fields.push(`${key} = $${paramIndex}`);
        values.push(productData[key]);
        paramIndex++;
    }

    if (fields.length === 0) {
        return null;
    }

    fields.push(`created_by = $${paramIndex}`);
    values.push(updatedBy);
    paramIndex++;
    fields.push("created_at = NOW()");

    values.push(productId);

    return {
        query: `
            UPDATE product
            SET ${fields.join(", ")}
            WHERE id = $${paramIndex}
              AND hist_id IS NULL
              AND is_deleted = FALSE
            RETURNING *
        `,
        values,
    };
};

const deleteProductQuery = (productId, deletedBy = null) => ({
    query: `
        UPDATE product
        SET is_deleted = TRUE,
            created_by = $2,
            created_at = NOW()
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        RETURNING *
    `,
    values: [productId, deletedBy],
});


const getProductsQuery = (filters) => {

    let paramIndex = 1;
    const fields = ["hist_id IS NULL", "is_deleted = FALSE"];
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

    const whereClause = `WHERE ${fields.join(" AND ")}`;

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


const getTopProductsByQuantitySold = async (filters) => {
    const { limit } = filters || {};

    const query = `
        SELECT p.*, SUM(oi.quantity) AS sold_quantity
        FROM order_item AS oi
        JOIN orders AS o ON oi.fk_order_id = o.id and o.status IN ('DELIVERED', 'SHIPPED')
        JOIN product AS p ON oi.fk_product_id = p.id
            AND p.hist_id IS NULL
            AND p.is_deleted = FALSE
        GROUP BY p.id
        ORDER BY sold_quantity DESC
        LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
};


module.exports = {
    createProduct,
    createProductsBulk,
    getProductBySku,
    getProductBySkuQuery,
    getProductById,
    getProductForUpdateQuery,
    createProductHistoryQuery,
    updateProductQuery,
    deleteProductQuery,
    getProductsQuery,
    getProducts,
    getProductsCount,
    decreaseStockQuery,
    getTopProductsByQuantitySold
};
