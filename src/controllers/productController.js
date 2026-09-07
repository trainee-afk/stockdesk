const asyncHandler = require("../middlewares/asyncHandler");
const productService = require("../services/productService");
const categoryService = require("../services/categoryService");
const { productListQuerySchema, createProductSchema } = require("../validators/productValidator");
const {
    getLowStockProductsSchema,
    getTopProductsSchema,
} = require("../validators/reportsValidator");


// Web Handlers
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

const showCreateProductPage = asyncHandler(async (req, res) => {

    const categories = await categoryService.getCategories();

    res.render("createProduct", {
        categories,
        formData: {},
        errors: {},
    });

});

const showLowStockProductsPage = asyncHandler(async (req, res) => {
    const threshold = req.query.threshold || "10";
    const validationResult = getLowStockProductsSchema.safeParse({ threshold });

    if (!validationResult.success) {
        return res.redirect("/products/low-stock");
    }


    const products = await productService.getLowStockProducts(
        validationResult.data.threshold
    );

    res.render("productReport", {
        reportType: "low-stock",
        title: "Low Stock Products",
        description: "Products at or below the selected stock level.",
        filterName: "threshold",
        filterLabel: "Stock level",
        filterValue: validationResult.data.threshold,
        filterAction: "/products/low-stock",
        products,
    });
});

const showTopProductsPage = asyncHandler(async (req, res) => {
    const limit = req.query.limit || "10";
    const validationResult = getTopProductsSchema.safeParse({ limit });

    if (!validationResult.success) {
        return res.redirect("/products/top-products");
    }

    const products = await productService.getTopProductsByQuantitySold(
        validationResult.data.limit
    );

    res.render("productReport", {
        reportType: "top-products",
        title: "Top Products",
        description: "Best-selling products by quantity sold.",
        filterName: "limit",
        filterLabel: "Number of products",
        filterValue: validationResult.data.limit,
        filterAction: "/products/top-products",
        products,
    });
});

const createProduct = asyncHandler(async (req, res) => {
    const formData = { ...req.body };

    for (const field of ["price", "stock_quantity", "fk_category_id"]) {
        if (formData[field].trim() === "") {
            formData[field] = undefined;
        }
    }

    const validationResult = createProductSchema.safeParse(formData);

    if (!validationResult.success) {
        const categories = await categoryService.getCategories();
        const errors = validationResult.error.issues.reduce((acc, issue) => {
            acc[issue.path[0]] = issue.message;
            return acc;
        }, {});

        return res.status(400).render("createProduct", {
            categories,
            formData: req.body,
            errors,
        });
    }

    try {
        await productService.createProduct(validationResult.data);
        return res.redirect("/products");
    } catch (error) {
        const categories = await categoryService.getCategories();

        return res.status(error.statusCode || 400).render("createProduct", {
            categories,
            formData: req.body,
            errors: {
                general: error.message || "Unable to create product",
            },
        });
    }
});


// API Handlers
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
    handleImportProducts,
    showCreateProductPage,
    createProduct,
    showLowStockProductsPage,
    showTopProductsPage
};
