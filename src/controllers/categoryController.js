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

module.exports = {
    handleCreateCategory,
};