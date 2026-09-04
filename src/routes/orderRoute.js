const express = require("express");
const router = express.Router();
const validatorMiddleware = require("../middlewares/validator");
const orderController = require("../controllers/orderController");
const { createOrderSchema, listOrdersSchema } = require("../validators/orderValidator");
const { authenticateApi } = require("../middlewares/authenticate");



router.post("/", authenticateApi, validatorMiddleware(createOrderSchema), orderController.handleCreateOrder);
router.get("/", authenticateApi, validatorMiddleware(listOrdersSchema, "query"), orderController.handleGetOrders);
router.get("/:id", authenticateApi, orderController.handleGetOrderById);


module.exports = router;