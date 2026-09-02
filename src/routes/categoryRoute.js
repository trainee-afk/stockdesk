const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const validatorMiddleware = require("../middlewares/validator");
const { createCategorySchema } = require("../validators/categoryValidator");
const { authorizeApi } = require("../middlewares/authorize");

router.post("/", authorizeApi("ADMIN"), validatorMiddleware(createCategorySchema), categoryController.handleCreateCategory);

module.exports = router;
