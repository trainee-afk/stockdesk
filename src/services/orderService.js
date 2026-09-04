const db = require("../config/db");
const Decimal = require("decimal.js");
const customerModel = require("../models/customerModel");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");

const createOrder = async (orderData) => {

    const { customerId, lineItems } = orderData;

    const quantitiesByProduct = new Map();

    for (const { productId, quantity } of lineItems) {
        const currentQuantity = quantitiesByProduct.get(productId) || 0;
        quantitiesByProduct.set(productId, currentQuantity + quantity);
    }

    const updatedLineItems = [...quantitiesByProduct].map(
        ([productId, quantity]) => ({ productId, quantity })
    );

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const customerQuery = customerModel.getCustomerByIdQuery(customerId);
        const customerResult = await client.query(
            customerQuery.query,
            customerQuery.values
        );

        if (customerResult.rowCount === 0) {
            const error = new Error("Customer not found");
            error.statusCode = 404;
            throw error;
        }

        const productIds = updatedLineItems.map(({ productId }) => productId);
        const productsQuery = productModel.getProductsQuery({ productIds });
        const productsResult = await client.query(
            productsQuery.query,
            productsQuery.values
        );

        const productsById = new Map(
            productsResult.rows.map((product) => [product.id, product])
        );


        let totalAmount = new Decimal(0);

        for (const { productId, quantity } of updatedLineItems) {
            const product = productsById.get(productId);

            if (!product) {
                const error = new Error(`Product ${productId} not found`);
                error.statusCode = 404;
                throw error;
            }

            if (product.stock_quantity < quantity) {
                const error = new Error(
                    `Insufficient stock for product ${productId}`
                );
                error.statusCode = 409;
                throw error;
            }

            totalAmount = totalAmount.plus(
                new Decimal(product.price).times(quantity)
            );
        }

        const decreaseStockQuery = productModel.decreaseStockQuery(updatedLineItems);
        const stockResult = await client.query(
            decreaseStockQuery.query,
            decreaseStockQuery.values
        );
        if (stockResult.rowCount !== updatedLineItems.length) {
            const error = new Error("Insufficient stock");
            error.statusCode = 409;
            throw error;
        }

        const createOrderQuery = orderModel.createOrderQuery({
            customerId,
            totalAmount: totalAmount.toFixed(2),
        });
        const orderResult = await client.query(
            createOrderQuery.query,
            createOrderQuery.values
        );
        const order = orderResult.rows[0];

        const orderItems = updatedLineItems.map(({ productId, quantity }) => {
            const product = productsById.get(productId);
            const unitPrice = product.price;

            return {
                productId,
                quantity,
                unitPrice: new Decimal(unitPrice).toFixed(2),
                lineTotal: new Decimal(unitPrice).times(quantity).toFixed(2),
            };
        });

        const createOrderItemsQuery = orderModel.createOrderItemsQuery(
            order.id,
            orderItems
        );
        const orderItemsResult = await client.query(
            createOrderItemsQuery.query,
            createOrderItemsQuery.values
        );

        await client.query("COMMIT");

        return { ...order, items: orderItemsResult.rows };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

};


module.exports = {
    createOrder,
};