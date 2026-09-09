const db = require("../config/db");

const createOrderQuery = ({ customerId, totalAmount, createdBy = null }) => {
    const query = `
        INSERT INTO orders (fk_customer_id, status, total_amount, created_by, hist_id, is_deleted)
        VALUES ($1, $2, $3, $4, NULL, FALSE)
		RETURNING *;
	`;
    const values = [customerId, "PENDING", totalAmount, createdBy];

    return { query, values };
};

const createOrderItemsQuery = (orderId, lineItems, createdBy = null) => {
    const values = [];
    const itemValues = lineItems.map(({ productId, quantity, unitPrice, lineTotal }) => {
        const orderIdParam = values.length + 1;
        const productIdParam = values.length + 2;
        const quantityParam = values.length + 3;
        const unitPriceParam = values.length + 4;
        const lineTotalParam = values.length + 5;
        const createdByParam = values.length + 6;

        values.push(orderId, productId, quantity, unitPrice, lineTotal, createdBy);

        return `($${orderIdParam}, $${productIdParam}, $${quantityParam}, $${unitPriceParam}, $${lineTotalParam}, $${createdByParam}, NULL, FALSE)`;
    });

    const query = `
		INSERT INTO order_item
            (fk_order_id, fk_product_id, quantity, unit_price, line_total, created_by, hist_id, is_deleted)
		VALUES ${itemValues.join(", ")}
		RETURNING *;
	`;

    return { query, values };
};

const _getOrderFilters = ({ status, from, to } = {}) => {
    const values = [];
    const conditions = ["o.hist_id IS NULL", "o.is_deleted = FALSE"];

    if (status) {
        values.push(status);
        conditions.push(`o.status = $${values.length}`);
    }

    if (from) {
        values.push(from);
        conditions.push(`o.created_at >= $${values.length}`);
    }

    if (to) {
        values.push(to);
        conditions.push(`o.created_at <= $${values.length}`);
    }

    return {
        values,
        whereClause: conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "",
    };
};

const getOrders = async ({ page, limit, status, from, to }) => {
    const filters = _getOrderFilters({ status, from, to });
    const limitParam = filters.values.length + 1;
    const offsetParam = filters.values.length + 2;
    const offset = (page - 1) * limit;

    const query = `
        SELECT
            o.id,
            o.fk_customer_id AS customer_id,
            c.name AS customer_name,
            o.created_at AS order_date,
            o.status,
            o.total_amount,
            COUNT(oi.id)::INT AS item_count
        FROM orders AS o
        JOIN customer AS c ON c.id = o.fk_customer_id
            AND c.hist_id IS NULL
        LEFT JOIN order_item AS oi ON oi.fk_order_id = o.id
            AND oi.hist_id IS NULL
            AND oi.is_deleted = FALSE
        ${filters.whereClause}
        GROUP BY o.id, c.name
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT $${limitParam} OFFSET $${offsetParam};
    `;
    const values = [...filters.values, limit, offset];
    const result = await db.query(query, values);

    return result.rows;
};

const getOrdersCount = async ({ status, from, to }) => {
    const filters = _getOrderFilters({ status, from, to });
    const query = `
        SELECT COUNT(*)::INT AS total
        FROM orders AS o
        ${filters.whereClause};
    `;
    const result = await db.query(query, filters.values);

    return result.rows[0].total;
};

const getOrderById = async (orderId) => {
    const query = `
        SELECT
            o.id,
            o.status,
            o.total_amount,
            o.created_at AS order_date,
            json_build_object(
                'id', c.id,
                'name', c.name,
                'email', c.email,
                'phone', c.phone,
                'address', c.address
            ) AS customer,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', oi.id,
                            'productId', oi.fk_product_id,
                            'productName', p.name,
                            'sku', p.sku,
                            'quantity', oi.quantity,
                            'unitPrice', oi.unit_price,
                            'lineTotal', oi.line_total
                        )
                        ORDER BY oi.id
                    )
                    FROM order_item AS oi
                    JOIN product AS p ON p.id = oi.fk_product_id
                            AND p.hist_id IS NULL
                    WHERE oi.fk_order_id = o.id
                        AND oi.hist_id IS NULL
                        AND oi.is_deleted = FALSE
                ),
                '[]'::json
            ) AS items
        FROM orders AS o
            JOIN customer AS c ON c.id = o.fk_customer_id
                    AND c.hist_id IS NULL
            WHERE o.id = $1
                AND o.hist_id IS NULL
                AND o.is_deleted = FALSE;
    `;
    const values = [orderId];
    const result = await db.query(query, values);

    return result.rows[0];
};

const getOrderStatusQuery = (orderId) => {
    const query = `
        SELECT id, status
        FROM orders
                WHERE id = $1
                    AND hist_id IS NULL
                    AND is_deleted = FALSE
        FOR UPDATE;
    `;
    const values = [orderId];

    return { query, values };
};

const createOrderHistoryQuery = (orderId) => ({
    query: `
        INSERT INTO orders (
            fk_customer_id, status, total_amount, created_by, created_at, hist_id, is_deleted
        )
        SELECT
            fk_customer_id, status, total_amount, created_by, created_at, id, is_deleted
        FROM orders
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        RETURNING *
    `,
    values: [orderId],
});

const getOrderProductQuantitiesQuery = (orderId) => ({
    query: `
        SELECT fk_product_id AS "productId", quantity
        FROM order_item
        WHERE fk_order_id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
    `,
    values: [orderId],
});

const updateOrderStatusQuery = (orderId, status, updatedBy = null) => {
    const query = `
        UPDATE orders
        SET status = $1,
            created_by = $2,
            created_at = NOW()
        WHERE id = $3
          AND hist_id IS NULL
          AND is_deleted = FALSE
        RETURNING *;
    `;
    const values = [status, updatedBy, orderId];

    return { query, values };
};

const getSalesSummary = async ({ from, to } = {}) => {
    const values = [];
    const conditions = ["o.status in ('SHIPPED', 'DELIVERED')"];

    if (from) {
        values.push(from);
        conditions.push(`o.created_at >= $${values.length}::date`);
    }

    if (to) {
        values.push(to);
        conditions.push(`o.created_at < ($${values.length}::date + INTERVAL '1 day')`);
    }

    const query = `
        SELECT
            COUNT(*)::INT AS total_orders,
            COALESCE(SUM(o.total_amount), 0)::DECIMAL(10, 2) AS total_revenue,
            COALESCE(AVG(o.total_amount), 0)::DECIMAL(10, 2) AS average_order_value
        FROM orders AS o
        WHERE ${conditions.join(" AND ")};
    `;
    const result = await db.query(query, values);

    return result.rows[0];
};

module.exports = {
    createOrderQuery,
    createOrderItemsQuery,
    getOrders,
    getOrdersCount,
    getOrderById,
    getOrderStatusQuery,
    createOrderHistoryQuery,
    getOrderProductQuantitiesQuery,
    updateOrderStatusQuery,
    getSalesSummary,
};
