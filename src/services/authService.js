const bcrypt = require("bcryptjs");
const authModel = require("../models/authModel");

const registerUser = async (userData) => {

    const { password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    userData.password = hashedPassword;

    const result = await authModel.registerUser(userData);
    return result;

};

module.exports = { registerUser };