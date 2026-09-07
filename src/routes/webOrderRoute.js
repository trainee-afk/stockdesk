const express = require("express");
const { authenticateWeb } = require("../middlewares/authenticate");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.get("/", authenticateWeb, orderController.showOrdersPage);
router.get("/:id", authenticateWeb, orderController.showOrderDetailPage);

module.exports = router;