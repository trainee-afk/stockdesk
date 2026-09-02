const db = require("../config/db");

const registerUser = async (userData) => {
    const { email, password, role } = userData;

    const result = await db.query(
        "insert into users (email, password, role) values ($1, $2, $3) returning *",
        [email, password, role]
    );

    return result.rows[0];
};

const getUserByEmail = async (email) => {

    const result = await db.query(
        "select email, password, role from users where email = $1",
        [email]
    );

    return result.rows[0];
};

module.exports = { registerUser, getUserByEmail };