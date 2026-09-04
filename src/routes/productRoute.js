const express = require("express");
const router = express.Router();
const multerUpload = require("../config/multerUpload");
const productController = require("../controllers/productController");
const validatorMiddleware = require("../middlewares/validator");
const { createProductSchema, updateProductSchema, productListQuerySchema } = require("../validators/productValidator");
const { authorizeApi } = require("../middlewares/authorize");
const { authenticateApi } = require("../middlewares/authenticate");

router.post("/", authorizeApi("ADMIN"), validatorMiddleware(createProductSchema), productController.handleCreateProduct);

router.get("/:id", authenticateApi, productController.handleGetProductById);

router.patch("/:id", authorizeApi("ADMIN"), validatorMiddleware(updateProductSchema), productController.handleUpdateProduct);

router.delete("/:id", authorizeApi("ADMIN"), productController.handleDeleteProduct);

//Product Listing
router.get("/", authenticateApi, validatorMiddleware(productListQuerySchema, "query"), productController.handleGetProducts);

// CSV upload route
router.post("/import", authorizeApi("ADMIN"), multerUpload.single("file"), productController.handleImportProducts);

module.exports = router;