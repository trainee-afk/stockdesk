const db = require("../config/db");

const createCategory = async ({ name, description }) => {
    const result = await db.query(
        `
            INSERT INTO category (name, description)
            VALUES ($1, $2)
            RETURNING *
        `,
        [name, description]
    );

    return result.rows[0];
};

const getCategoryByName = async (name) => {
    const result = await db.query(
        `SELECT * FROM category WHERE LOWER(name) = LOWER($1)`,
        [name]
    );

    return result.rows[0];
};

const getCategoryById = async (categoryId) => {
    const result = await db.query(
        `SELECT * FROM category WHERE id = $1`,
        [categoryId]
    );

    return result.rows[0];
}


module.exports = {
    createCategory,
    getCategoryByName,
    getCategoryById,
};
