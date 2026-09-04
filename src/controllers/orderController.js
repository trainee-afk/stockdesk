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

module.exports = { handleCreateOrder };