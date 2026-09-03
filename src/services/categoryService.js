const categoryModel = require("../models/categoryModel");

const createCategory = async (categoryData) => {
    const { name } = categoryData;

    const existingCategory = await categoryModel.getCategoryByName(name);

    if (existingCategory) {
        const error = new Error("Category already exists");
        error.statusCode = 409;
        throw error;
    }

    const category = await categoryModel.createCategory(categoryData);

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

const updateCategory = async (categoryId, categoryData) => {
    const category = await categoryModel.getCategoryById(categoryId);

    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }
    const updatedCategory = await categoryModel.updateCategory(categoryId, categoryData);

    return updatedCategory;
};

const deleteCategory = async (categoryId) => {
    const category = await categoryModel.getCategoryById(categoryId);

    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    const deletedCategory = await categoryModel.deleteCategory(categoryId);

    return deletedCategory;
}

module.exports = {
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory
};
