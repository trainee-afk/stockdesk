
const express = require("express");
const router = express.Router();
const { authenticateWeb } = require("../middlewares/authenticate");
const productController = require("../controllers/productController");

router.get("/", authenticateWeb, productController.showProductsPage);
router.get("/new", authenticateWeb, productController.showCreateProductPage);
router.post("/new", authenticateWeb, productController.createProduct);

module.exports = router;