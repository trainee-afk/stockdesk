const express = require("express");
const router = express.Router();
const { authorizeApi } = require("../middlewares/authorize");
const validatorMiddleware = require("../middlewares/validator");
const { getLowStockProductsSchema, getTopProductsSchema } = require("../validators/reportsValidator");
const productController = require("../controllers/productController");

router.get("/low-stock", authorizeApi("ADMIN"), validatorMiddleware(getLowStockProductsSchema, "query"), productController.handleGetLowStockProducts);
router.get("/top-products", authorizeApi("ADMIN"), validatorMiddleware(getTopProductsSchema, "query"), productController.handleGetTopProducts);

module.exports = router;