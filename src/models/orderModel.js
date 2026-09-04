const db = require("../config/db");

const createOrderQuery = ({ customerId, totalAmount }) => {
    const query = `
		INSERT INTO orders (fk_customer_id, status, total_amount)
		VALUES ($1, $2, $3)
		RETURNING *;
	`;
    const values = [customerId, "PENDING", totalAmount];

    return { query, values };
};

const createOrderItemsQuery = (orderId, lineItems) => {
    const values = [];
    const itemValues = lineItems.map(({ productId, quantity, unitPrice, lineTotal }) => {
        const orderIdParam = values.length + 1;
        const productIdParam = values.length + 2;
        const quantityParam = values.length + 3;
        const unitPriceParam = values.length + 4;
        const lineTotalParam = values.length + 5;

        values.push(orderId, productId, quantity, unitPrice, lineTotal);

        return `($${orderIdParam}, $${productIdParam}, $${quantityParam}, $${unitPriceParam}, $${lineTotalParam})`;
    });

    const query = `
		INSERT INTO order_item
			(fk_order_id, fk_product_id, quantity, unit_price, line_total)
		VALUES ${itemValues.join(", ")}
		RETURNING *;
	`;

    return { query, values };
};

const _getOrderFilters = ({ status, from, to } = {}) => {
    const values = [];
    const conditions = [];

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
        LEFT JOIN order_item AS oi ON oi.fk_order_id = o.id
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
                    WHERE oi.fk_order_id = o.id
                ),
                '[]'::json
            ) AS items
        FROM orders AS o
        JOIN customer AS c ON c.id = o.fk_customer_id
        WHERE o.id = $1;
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
        FOR UPDATE;
    `;
    const values = [orderId];

    return { query, values };
};

const restoreOrderStockQuery = (orderId) => {
    const query = `
        UPDATE product AS p
        SET stock_quantity = p.stock_quantity + oi.quantity
        FROM order_item AS oi
        WHERE oi.fk_order_id = $1
          AND p.id = oi.fk_product_id
        RETURNING p.id, p.stock_quantity;
    `;
    const values = [orderId];

    return { query, values };
};

const updateOrderStatusQuery = (orderId, status) => {
    const query = `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING *;
    `;
    const values = [status, orderId];

    return { query, values };
};

module.exports = {
    createOrderQuery,
    createOrderItemsQuery,
    getOrders,
    getOrdersCount,
    getOrderById,
    getOrderStatusQuery,
    restoreOrderStockQuery,
    updateOrderStatusQuery,
};
