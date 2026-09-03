const asyncHandler = require("../middlewares/asyncHandler");
const productService = require("../services/productService");

const handleCreateProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
    });
});

const handleGetProductById = asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);

    res.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data: product,
    });
});

const handleUpdateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
    });
});

const handleDeleteProduct = asyncHandler(async (req, res) => {
    const product = await productService.deleteProduct(req.params.id);

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: product,
    });
});

module.exports = {
    handleCreateProduct,
    handleGetProductById,
    handleUpdateProduct,
    handleDeleteProduct,
};
