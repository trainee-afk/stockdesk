const asyncHandler = require("../middlewares/asyncHandler");
const customerService = require("../services/customerService");

const handleCreateCustomer = asyncHandler(async (req, res) => {

    const customer = await customerService.createCustomer(req.body);

    res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
    });

});

module.exports = {
    handleCreateCustomer,
};