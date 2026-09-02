const asyncHandler = require("../middlewares/asyncHandler");
const categoryService = require("../services/categoryService");

const handleCreateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
    });
});

const handleGetCategoryById = asyncHandler(async (req, res) => {
    const categoryId = req.params.id;
    const category = await categoryService.getCategoryById(categoryId);

    res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: category,
    });
});

const handleUpdateCategory = asyncHandler(async (req, res) => {
    const categoryId = req.params.id;
    const updatedCategory = await categoryService.updateCategory(categoryId, req.body);

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory,
    });
});

module.exports = {
    handleCreateCategory,
    handleGetCategoryById,
    handleUpdateCategory,
};