const asyncHandler = require("../middlewares/asyncHandler");
const orderService = require("../services/orderService");

const handleCreateOrder = asyncHandler(async (req, res) => {
    const { customerId, lineItems } = req.body;

    const order = await orderService.createOrder({ customerId, lineItems });

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

module.exports = { handleCreateOrder, handleGetOrders };