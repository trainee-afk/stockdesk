const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const db = require("../config/db");
const { createProductSchema } = require("../validators/productValidator");
const { Readable } = require("stream");
const csv = require("csv-parser");


const createProduct = async (productData, createdBy) => {
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

    return productModel.createProduct(productData, createdBy);
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

const updateProduct = async (productId, productData, updatedBy = null) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const currentQuery = productModel.getProductForUpdateQuery(productId);
        const currentResult = await client.query(currentQuery.query, currentQuery.values);

        if (currentResult.rowCount === 0) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        if (productData.sku !== undefined) {
            const skuQuery = productModel.getProductBySkuQuery(
                productData.sku, { excludedProductId: productId }
            );
            const existingProduct = await client.query(skuQuery.query, skuQuery.values);

            if (existingProduct.rowCount > 0) {
                const error = new Error("Product SKU already exists");
                error.statusCode = 409;
                throw error;
            }
        }

        if (productData.fk_category_id !== undefined) {
            const categoryQuery = categoryModel.getCategoryByIdQuery(productData.fk_category_id);
            const categoryResult = await client.query(categoryQuery.query, categoryQuery.values);

            if (categoryResult.rowCount === 0) {
                const error = new Error("Category not found");
                error.statusCode = 404;
                throw error;
            }
        }

        const historyQuery = productModel.createProductHistoryQuery(productId);
        await client.query(historyQuery.query, historyQuery.values);

        const updateQuery = productModel.updateProductQuery(productId, productData, updatedBy);
        if (!updateQuery) {
            const error = new Error("No fields provided for update");
            error.statusCode = 400;
            throw error;
        }

        const updatedResult = await client.query(updateQuery.query, updateQuery.values);

        await client.query("COMMIT");
        return updatedResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const deleteProduct = async (productId, deletedBy = null) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const currentQuery = productModel.getProductForUpdateQuery(productId);
        const currentResult = await client.query(currentQuery.query, currentQuery.values);

        if (currentResult.rowCount === 0) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        const historyQuery = productModel.createProductHistoryQuery(productId);
        await client.query(historyQuery.query, historyQuery.values);

        const deleteQuery = productModel.deleteProductQuery(productId, deletedBy);
        const deletedResult = await client.query(deleteQuery.query, deleteQuery.values);

        await client.query("COMMIT");
        return deletedResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};


const getProducts = async (filters) => {

    const { page, limit } = filters || {};

    const products = await productModel.getProducts(filters);
    const total = await productModel.getProductsCount(filters);

    return {
        products,
        pagination: {
            total,
            page,
            totalPages: Math.ceil(total / limit),
        },
    };
}


const getLowStockProducts = async (threshold) => {
    const lowStockProducts = await productModel.getProducts({ stock_threshold: threshold, limit: undefined, page: undefined });
    return lowStockProducts;
}

const getTopProductsByQuantitySold = async (limit) => {
    const topProducts = await productModel.getTopProductsByQuantitySold({ limit });
    return topProducts;
}

const _parseCSVData = (csvData) => {
    return new Promise((resolve, reject) => {
        const products = [];

        Readable.from([csvData])
            .pipe(csv())
            .on("data", (row) => {
                products.push(row);
            })
            .on("end", () => {
                resolve(products);
            })
            .on("error", (error) => {
                reject(error);
            });
    });
};

const importProductsFromCSV = async (csvData, createdBy = null) => {

    const products = await _parseCSVData(csvData);
    const errors = [];
    const validProducts = [];
    const seenSkus = new Set(); // to check duplicate skus in csv fle
    const categoryIds = new Set(await categoryModel.getCategoryIds()); // to check valid category IDs

    for (const [index, productData] of products.entries()) {
        const hasContent = Object.values(productData).some(
            (value) => String(value).trim() !== ""
        );

        if (!hasContent) {
            continue;
        }

        const rowNumber = index + 2;
        const validationResult = createProductSchema.safeParse(productData);

        if (!validationResult.success) {
            const reason = validationResult.error.issues
                .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`)
                .join("; ");

            errors.push({ row: rowNumber, reason });
            continue;
        }

        const product = validationResult.data;
        const normalizedSku = product.sku.toLowerCase();

        if (seenSkus.has(normalizedSku)) {
            errors.push({ row: rowNumber, reason: "duplicate SKU" });
            continue;
        }

        seenSkus.add(normalizedSku);

        const existingProduct = await productModel.getProductBySku(product.sku);
        if (existingProduct) {
            errors.push({ row: rowNumber, reason: "duplicate SKU" });
            continue;
        }

        if (!categoryIds.has(product.fk_category_id)) {
            errors.push({ row: rowNumber, reason: "category not found" });
            continue;
        }

        validProducts.push(product);
    }

    let importedProducts = [];
    if (validProducts.length > 0) {
        try {
            importedProducts = await productModel.createProductsBulk(validProducts, createdBy);
        } catch (error) {
            if (error.code === "23505") {
                const duplicateError = new Error("A duplicate SKU was detected while importing products");
                duplicateError.statusCode = 409;
                throw duplicateError;
            }

            throw error;
        }
    }

    return {
        imported: importedProducts.length,
        failed: errors.length,
        errors,
    };
};

module.exports = {
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    getProducts,
    getTopProductsByQuantitySold,
    getLowStockProducts,
    importProductsFromCSV
};
