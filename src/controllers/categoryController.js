const asyncHandler = require("../middlewares/asyncHandler");
const categoryService = require("../services/categoryService");

const handleCreateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body, req.user.id);
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
    const updatedCategory = await categoryService.updateCategory(categoryId, req.body, req.user.id);

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory,
    });
});

const handleDeleteCategory = asyncHandler(async (req, res) => {
    const categoryId = req.params.id;
    const deletedCategory = await categoryService.deleteCategory(categoryId, req.user.id);

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
        data: deletedCategory,
    });
});

module.exports = {
    handleCreateCategory,
    handleGetCategoryById,
    handleUpdateCategory,
    handleDeleteCategory
};