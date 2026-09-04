const express = require("express");
const router = express.Router();
const { authorizeApi } = require("../middlewares/authorize");
const validatorMiddleware = require("../middlewares/validator");
const { getLowStockProductsSchema, getTopProductsSchema, getSalesSummarySchema } = require("../validators/reportsValidator");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");

router.get("/low-stock", authorizeApi("ADMIN"), validatorMiddleware(getLowStockProductsSchema, "query"), productController.handleGetLowStockProducts);
router.get("/top-products", authorizeApi("ADMIN"), validatorMiddleware(getTopProductsSchema, "query"), productController.handleGetTopProducts);
router.get("/sales-summary", authorizeApi("ADMIN"), validatorMiddleware(getSalesSummarySchema, "query"), orderController.handleGetSalesSummary);

module.exports = router;