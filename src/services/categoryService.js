const categoryModel = require("../models/categoryModel");
const productService = require("./productService");

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

const getCategories = async () => {
    return categoryModel.getCategories();
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

    const categoryProducts = await productService.getProducts({ categoryId });

    if (categoryProducts.products.length !== 0) {
        const error = new Error("Products of this category still exists");
        error.statusCode = 400;
        throw error;
    }

    const deletedCategory = await categoryModel.deleteCategory(categoryId);

    return deletedCategory;
}

module.exports = {
    createCategory,
    getCategoryById,
    getCategories,
    updateCategory,
    deleteCategory
};
