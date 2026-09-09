const db = require("../config/db");
const Decimal = require("decimal.js");
const customerModel = require("../models/customerModel");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");
const productService = require("./productService");

const createOrder = async (orderData, createdBy = null) => {

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
        const productsQuery = productModel.getProductsQuery({
            productIds,
            includeDeleted: false,
        });
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

        await productService.decreaseStock(client, updatedLineItems, createdBy);

        const createOrderQuery = orderModel.createOrderQuery({
            customerId,
            totalAmount: totalAmount.toFixed(2),
            createdBy,
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
            orderItems,
            createdBy
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

const getOrders = async (filters) => {
    const orders = await orderModel.getOrders(filters);
    const total = await orderModel.getOrdersCount(filters);

    return {
        orders,
        pagination: {
            total,
            page: filters.page,
            totalPages: Math.ceil(total / filters.limit),
        },
    };
};

const getOrderById = async (orderId) => {
    const order = await orderModel.getOrderById(orderId);

    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    return order;
};

const updateOrderStatus = async (orderId, newStatus) => {
    const allowedTransitions = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["SHIPPED", "CANCELLED"],
        SHIPPED: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
    };
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const orderQuery = orderModel.getOrderStatusQuery(orderId);
        const orderResult = await client.query(
            orderQuery.query,
            orderQuery.values
        );

        if (orderResult.rowCount === 0) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }

        const currentStatus = orderResult.rows[0].status;
        if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
            const error = new Error(
                `Cannot change order status from ${currentStatus} to ${newStatus}`
            );
            error.statusCode = 400;
            throw error;
        }

        if (newStatus === "CANCELLED") {
            const restoreStockQuery = orderModel.restoreOrderStockQuery(orderId);
            await client.query(
                restoreStockQuery.query,
                restoreStockQuery.values
            );
        }

        const updateStatusQuery = orderModel.updateOrderStatusQuery(
            orderId,
            newStatus
        );
        const updatedOrderResult = await client.query(
            updateStatusQuery.query,
            updateStatusQuery.values
        );

        await client.query("COMMIT");

        return updatedOrderResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const getSalesSummary = async (filters) => {
    return orderModel.getSalesSummary(filters);
};


module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getSalesSummary,
};