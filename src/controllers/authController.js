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

const handleLoginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    res.cookie("token", result.token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 86400000, // 24 hours
    });

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: result.user,
    });
});

module.exports = { handleRegisterUser, handleLoginUser };