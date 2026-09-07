const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/login", authController.showLoginPage);
router.post("/login", authController.handleWebLogin);

module.exports = router;