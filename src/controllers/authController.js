const asyncHandler = require("../middlewares/asyncHandler");
const authService = require("../services/authService");
const authValidator = require("../validators/authValidator");

// Web Handlers
const renderLogin = (res, options = {}) => {
    res.render("login", {
        error: null,
        email: "",
        ...options,
    });
};

const showLoginPage = (_, res) => {
    renderLogin(res);
};

const handleWebLogin = async (req, res) => {
    const validationResult = authValidator.loginSchema.safeParse(req.body);

    if (!validationResult.success) {
        return renderLogin(res.status(400), {
            error: validationResult.error.issues[0]?.message || "Enter your email and password",
            email: req.body.email || "",
        });
    }

    const { email, password } = validationResult.data;

    try {
        const result = await authService.loginUser(email, password);

        res.cookie("token", result.token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 86400000,
        });

        return res.redirect("/products");
    } catch (error) {
        return renderLogin(res.status(401), {
            error: "Invalid email or password",
            email,
        });
    }
};


// API Handlers
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
        sameSite: "strict",
        maxAge: 86400000, // 24 hours
    });

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: result.user,
    });
});

const handleGetMe = asyncHandler(async (req, res) => {
    const user = { email: req.user.email, role: req.user.role };

    res.status(200).json({
        success: true,
        message: "User Profile fetched successfully",
        data: user,
    });
});

module.exports = {
    showLoginPage,
    handleWebLogin,
    handleRegisterUser,
    handleLoginUser,
    handleGetMe,
};