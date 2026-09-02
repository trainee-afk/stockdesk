const asyncHandler = require("../middlewares/asyncHandler");
const authService = require("../services/authService");

const handleRegisterUser = asyncHandler(async (req, res) => {

    const result = await authService.registerUser(req.body);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
    });


});


module.exports = { handleRegisterUser };