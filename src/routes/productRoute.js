const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const validatorMiddleware = require("../middlewares/validator");
const { createProductSchema, updateProductSchema } = require("../validators/productValidator");
const { authorizeApi } = require("../middlewares/authorize");
const { authenticateApi } = require("../middlewares/authenticate");

router.post("/", authorizeApi("ADMIN"), validatorMiddleware(createProductSchema), productController.handleCreateProduct);

router.get("/:id", authenticateApi, productController.handleGetProductById);

router.patch("/:id", authorizeApi("ADMIN"), validatorMiddleware(updateProductSchema), productController.handleUpdateProduct);

router.delete("/:id", authorizeApi("ADMIN"), productController.handleDeleteProduct);

//Product Listing
router.get("/", authenticateApi, productController.handleGetProducts);

module.exports = router;