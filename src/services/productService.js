const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const { createProductSchema } = require("../validators/productValidator");
const { Readable } = require("stream");
const csv = require("csv-parser");


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

const importProductsFromCSV = async (csvData) => {

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
            importedProducts = await productModel.createProductsBulk(validProducts);
        } catch (error) {
            if (error.code === "23505") {
                throw new Error("A duplicate SKU was detected while importing products");
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
