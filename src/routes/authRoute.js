const express = require("express");
const router = express.Router();
const authValidator = require("../validators/authValidator");
const validatorMiddleware = require("../middlewares/validator");

const authController = require("../controllers/authController");

router.post("/register", validatorMiddleware(authValidator.registerSchema), authController.handleRegisterUser);
router.post("/login", validatorMiddleware(authValidator.loginSchema), authController.handleLoginUser);


module.exports = router;
