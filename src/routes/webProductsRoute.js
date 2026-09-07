
const express = require("express");
const router = express.Router();
const { authenticateWeb } = require("../middlewares/authenticate");
const { showProductsPage } = require("../controllers/productController");

router.get("/", authenticateWeb, showProductsPage);

module.exports = router;