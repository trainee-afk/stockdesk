const express = require("express");
const router = express.Router();
const validatorMiddleware = require("../middlewares/validator");
const orderController = require("../controllers/orderController");
const { createOrderSchema } = require("../validators/orderValidator");
const { authenticateApi } = require("../middlewares/authenticate");



router.post("/", authenticateApi, validatorMiddleware(createOrderSchema), orderController.handleCreateOrder);


module.exports = router;