const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");

const createProduct = async (productData) => {
    const existingProduct = await productModel.getProductBySku(productData.sku);

    if (existingProduct) {
        const error = new Error("Product SKU already exists");
        error.statusCode = 409;
        throw error;
    }

    const category = await categoryModel.getCategoryById(productData.fk_category_id);
    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    return productModel.createProduct(productData);
};

const getProductById = async (productId) => {
    const product = await productModel.getProductById(productId);

    if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    return product;
};

const _checkSKUConflict = async (productId, sku) => {

    const existingProduct = await productModel.getProductBySku(sku, { excludedProductId: productId });

    if (existingProduct) {
        const error = new Error("Product SKU already exists");
        error.statusCode = 409;
        throw error;
    }

    return true;

}

const updateProduct = async (productId, productData) => {
    await getProductById(productId);

    if (productData.sku !== undefined) {
        await _checkSKUConflict(productId, productData.sku);
    }

    if (productData.fk_category_id) {
        const category = await categoryModel.getCategoryById(productData.fk_category_id);
        if (!category) {
            const error = new Error("Category not found");
            error.statusCode = 404;
            throw error;
        }
    }

    return productModel.updateProduct(productId, productData);
};

const deleteProduct = async (productId) => {
    await getProductById(productId);
    return productModel.deleteProduct(productId);
};


const getProducts = async (filters) => {

    const { sortBy, order, page, limit } = filters || {};

    let paginationFields = {};

    if (sortBy && order) {
        if (!["price", "stock_quantity"].includes(sortBy)) {
            const error = new Error("Invalid sortBy field");
            error.statusCode = 400;
            throw error;
        }

        if (!["asc", "desc"].includes(order.toLowerCase())) {
            const error = new Error("Invalid order value");
            error.statusCode = 400;
            throw error;
        }
    }

    if (page <= 0 || limit < 0) {
        const error = new Error("Page and limit must be positive integers");
        error.statusCode = 400;
        throw error;
    }


    const products = await productModel.getProducts(filters);


    if (page !== undefined && limit !== undefined) {

        paginationFields.page = page;

        const total = await productModel.getProductsCount({}); // total products count (no filters)

        paginationFields.total = total;
        paginationFields.totalPages = Math.ceil(total / limit);
    }


    return { products, pagination: paginationFields };
}

module.exports = {
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    getProducts
};
