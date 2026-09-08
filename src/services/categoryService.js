const categoryModel = require("../models/categoryModel");
const db = require("../config/db");

const createCategory = async (categoryData, createdBy = null) => {
    const { name } = categoryData;

    const existingCategory = await categoryModel.getCategoryByName(name);

    if (existingCategory) {
        const error = new Error("Category already exists");
        error.statusCode = 409;
        throw error;
    }

    const category = await categoryModel.createCategory(categoryData, createdBy);

    return category;
};

const getCategoryById = async (categoryId) => {
    const category = await categoryModel.getCategoryById(categoryId);

    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    return category;
};

const getCategories = async () => {
    return categoryModel.getCategories();
};

const updateCategory = async (categoryId, categoryData, updatedBy = null) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const currentQuery = categoryModel.getCategoryForUpdateQuery(categoryId);
        const currentResult = await client.query(currentQuery.query, currentQuery.values);

        if (currentResult.rowCount === 0) {
            const error = new Error("Category not found");
            error.statusCode = 404;
            throw error;
        }

        const historyQuery = categoryModel.createCategoryHistoryQuery(categoryId);
        await client.query(historyQuery.query, historyQuery.values);

        const updateQuery = categoryModel.updateCategoryQuery(categoryId, categoryData, updatedBy);
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

const deleteCategory = async (categoryId, deletedBy = null) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const currentQuery = categoryModel.getCategoryForUpdateQuery(categoryId);
        const currentResult = await client.query(currentQuery.query, currentQuery.values);

        if (currentResult.rowCount === 0) {
            const error = new Error("Category not found");
            error.statusCode = 404;
            throw error;
        }

        const productsQuery = categoryModel.getCategoryProductsQuery(categoryId);
        const productsResult = await client.query(productsQuery.query, productsQuery.values);

        if (productsResult.rowCount !== 0) {
            const error = new Error("Products of this category still exists");
            error.statusCode = 400;
            throw error;
        }

        const historyQuery = categoryModel.createCategoryHistoryQuery(categoryId);
        await client.query(historyQuery.query, historyQuery.values);

        const deleteQuery = categoryModel.deleteCategoryQuery(categoryId, deletedBy);
        const deletedResult = await client.query(deleteQuery.query, deleteQuery.values);

        await client.query("COMMIT");
        return deletedResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createCategory,
    getCategoryById,
    getCategories,
    updateCategory,
    deleteCategory
};
