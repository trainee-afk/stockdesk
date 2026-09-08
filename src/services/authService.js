const bcrypt = require("bcryptjs");
const authModel = require("../models/authModel");
const jwt = require("jsonwebtoken");

const registerUser = async (userData) => {

    const { email, password } = userData;
    const user = await authModel.getUserByEmail(email);
    if (user) {
        const error = new Error("User already exists");
        error.statusCode = 409;
        throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    userData.password = hashedPassword;

    const result = await authModel.registerUser(userData);
    return result;

};

const loginUser = async (email, password) => {
    const user = await authModel.getUserByEmail(email);
    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "24h",
    });

    return { ...user, token };
};

module.exports = { registerUser, loginUser };