const asyncHandler = require("../middlewares/asyncHandler");
const orderService = require("../services/orderService");
const { listOrdersSchema } = require("../validators/orderValidator");

const showOrdersPage = asyncHandler(async (req, res) => {
    const query = { ...req.query };

    if (query.status === "") {
        delete query.status;
    }

    const validationResult = listOrdersSchema.safeParse(query);

    if (!validationResult.success) {
        return res.redirect("/orders");
    }

    const filters = validationResult.data;
    const result = await orderService.getOrders(filters);

    res.render("orders", {
        orders: result.orders,
        filters,
        pagination: result.pagination,
    });
});

const showOrderDetailPage = asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id);

    res.render("orderDetail", {
        order,
    });
});

const handleCreateOrder = asyncHandler(async (req, res) => {
    const { customerId, lineItems } = req.body;

    const order = await orderService.createOrder(
        { customerId, lineItems },
        req.user.id
    );

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
    });
});

const handleGetOrders = asyncHandler(async (req, res) => {
    const result = await orderService.getOrders(req.query);

    res.status(200).json({
        success: true,
        message: "Orders retrieved successfully",
        data: result,
    });
});

const handleGetOrderById = asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id);

    res.status(200).json({
        success: true,
        message: "Order retrieved successfully",
        data: order,
    });
});

const handleUpdateOrderStatus = asyncHandler(async (req, res) => {
    const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status
    );

    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        data: order,
    });
});

const handleGetSalesSummary = asyncHandler(async (req, res) => {
    const summary = await orderService.getSalesSummary(req.query);

    res.status(200).json({
        success: true,
        message: "Sales summary retrieved successfully",
        data: summary,
    });
});

module.exports = {
    showOrdersPage,
    showOrderDetailPage,
    handleCreateOrder,
    handleGetOrders,
    handleGetOrderById,
    handleUpdateOrderStatus,
    handleGetSalesSummary,
};