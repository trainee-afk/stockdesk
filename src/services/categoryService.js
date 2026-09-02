const categoryModel = require("../models/categoryModel");

const createCategory = async (categoryData) => {
    const { name } = categoryData;

    const existingCategory = await categoryModel.getCategoryByName(name);

    if (existingCategory) {
        throw new Error("Category already exists");
    }

    const category = await categoryModel.createCategory(categoryData);

    return category;
};

const getCategoryById = async (categoryId) => {
    const category = await categoryModel.getCategoryById(categoryId);
    return category;
};

module.exports = {
    createCategory,
    getCategoryById,
};
