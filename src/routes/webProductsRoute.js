
const express = require("express");
const router = express.Router();
const { authenticateWeb } = require("../middlewares/authenticate");
const productController = require("../controllers/productController");
const { authorizeWeb } = require("../middlewares/authorize");

router.get("/", authenticateWeb, productController.showProductsPage);
router.get("/new", authenticateWeb, productController.showCreateProductPage);
router.post("/new", authenticateWeb, productController.createProduct);
router.get("/low-stock", authorizeWeb("ADMIN"), productController.showLowStockProductsPage);
router.get("/top-products", authorizeWeb("ADMIN"), productController.showTopProductsPage);

module.exports = router;