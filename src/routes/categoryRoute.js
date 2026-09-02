const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const validatorMiddleware = require("../middlewares/validator");
const { createCategorySchema, updateCategorySchema } = require("../validators/categoryValidator");
const { authorizeApi } = require("../middlewares/authorize");
const { authenticateApi } = require("../middlewares/authenticate");

router.post("/", authorizeApi("ADMIN"), validatorMiddleware(createCategorySchema), categoryController.handleCreateCategory);

router.get("/:id", authenticateApi, categoryController.handleGetCategoryById);

router.patch("/:id", authorizeApi("ADMIN"), validatorMiddleware(updateCategorySchema), categoryController.handleUpdateCategory);

module.exports = router;
