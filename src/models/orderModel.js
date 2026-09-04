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

module.exports = {
    createOrderQuery,
    createOrderItemsQuery,
};
