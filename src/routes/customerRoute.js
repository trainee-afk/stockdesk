const express = require("express");
const router = express.Router();
const validatorMiddleware = require("../middlewares/validator");
const { createCustomerSchema } = require("../validators/customerValidator");
const { authenticateApi } = require("../middlewares/authenticate");
const customerController = require("../controllers/customerController");

router.post("/", authenticateApi, validatorMiddleware(createCustomerSchema), customerController.handleCreateCustomer);

module.exports = router;