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

const handleDeleteCustomer = asyncHandler(async (req, res) => {
    const customerId = req.params.id;
    await customerService.deleteCustomer(customerId);

    res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
    });
});

const handleGetCustomerById = asyncHandler(async (req, res) => {
    const customerId = req.params.id;
    const customer = await customerService.getCustomerById(customerId);

    res.status(200).json({
        success: true,
        message: "Customer fetched successfully",
        data: customer,
    });
});

module.exports = {
    handleCreateCustomer,
    handleDeleteCustomer,
    handleGetCustomerById
};