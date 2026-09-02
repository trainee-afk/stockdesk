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


const updateCategory = async (categoryId, categoryData) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    console.log(categoryData);


    if (categoryData.name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(categoryData.name);
        paramIndex++;
    }

    if (categoryData.description !== undefined) {
        fields.push(`description = $${paramIndex}`);
        values.push(categoryData.description);
        paramIndex++;
    }

    if (fields.length === 0) {
        return null;
    }

    values.push(categoryId);

    const result = await db.query(
        `
            UPDATE category
            SET ${fields.join(", ")}
            WHERE id = $${paramIndex}
            RETURNING *
        `,
        values
    );

    return result.rows[0];
};

module.exports = {
    createCategory,
    getCategoryByName,
    getCategoryById,
    updateCategory,
};
