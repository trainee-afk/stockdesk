const asyncHandler = require("../middlewares/asyncHandler");
const productService = require("../services/productService");
const categoryService = require("../services/categoryService");
const { productListQuerySchema } = require("../validators/productValidator");

const showProductsPage = asyncHandler(async (req, res) => {
    const query = { ...req.query };

    if (query.categoryId === "") {
        delete query.categoryId;  // remove for validation
    }

    const validationResult = productListQuerySchema.safeParse(query);

    if (!validationResult.success) {
        return res.redirect("/products"); // if validation fails, redirect to default products page
    }

    const filters = validationResult.data;
    const [result, categories] = await Promise.all([
        productService.getProducts(filters),
        categoryService.getCategories(),
    ]);

    res.render("products", {
        products: result.products,
        categories,
        filters,
        pagination: result.pagination,
    });
});

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

const handleGetProducts = asyncHandler(async (req, res) => {

    const filters = req.query;

    const result = await productService.getProducts(filters);

    res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: result,
    });

});

const handleGetLowStockProducts = asyncHandler(async (req, res) => {
    const { threshold } = req.query;
    const lowStockProducts = await productService.getLowStockProducts(threshold);

    res.status(200).json({
        success: true,
        message: "Low stock products retrieved successfully",
        data: lowStockProducts,
    });
});

const handleGetTopProducts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const topProducts = await productService.getTopProductsByQuantitySold(limit);

    res.status(200).json({
        success: true,
        message: "Top products retrieved successfully",
        data: topProducts,
    });
});


const handleImportProducts = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "CSV file is required. Use the form-data field named 'file'.",
        });
    }

    const result = await productService.importProductsFromCSV(req.file.buffer);


    return res.status(200).json({
        success: true,
        message: "Products imported successfully",
        data: result,
    });
});

module.exports = {
    showProductsPage,
    handleCreateProduct,
    handleGetProductById,
    handleUpdateProduct,
    handleDeleteProduct,
    handleGetProducts,
    handleGetTopProducts,
    handleGetLowStockProducts,
    handleImportProducts
};
