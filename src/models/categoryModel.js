const db = require("../config/db");

const createCategory = async ({ name, description }, createdBy = null) => {
    const result = await db.query(
        `
            INSERT INTO category (name, description, created_by, hist_id, is_deleted)
            VALUES ($1, $2, $3, NULL, FALSE)
            RETURNING *
        `,
        [name, description, createdBy]
    );

    return result.rows[0];
};

const getCategoryByName = async (name) => {
    const result = await db.query(
        `SELECT * FROM category WHERE LOWER(name) = LOWER($1) AND hist_id IS NULL AND is_deleted = FALSE`,
        [name]
    );

    return result.rows[0];
};

const getCategoryById = async (categoryId) => {
    const categoryQuery = getCategoryByIdQuery(categoryId);
    const result = await db.query(categoryQuery.query, categoryQuery.values);

    return result.rows[0];
};

const getCategoryByIdQuery = (categoryId) => ({
    query: `
        SELECT *
        FROM category
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
    `,
    values: [categoryId],
});

const getCategoryForUpdateQuery = (categoryId) => ({
    query: `
        SELECT *
        FROM category
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        FOR UPDATE
    `,
    values: [categoryId],
});

const getCategoryProductsQuery = (categoryId) => ({
    query: `
        SELECT 1
        FROM product
        WHERE fk_category_id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        LIMIT 1
    `,
    values: [categoryId],
});

const createCategoryHistoryQuery = (categoryId) => ({
    query: `
        INSERT INTO category (
            name,
            description,
            created_by,
            created_at,
            hist_id,
            is_deleted
        )
        SELECT
            name,
            description,
            created_by,
            created_at,
            id,
            is_deleted
        FROM category
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        RETURNING *
    `,
    values: [categoryId],
});

const getCategoryIds = async () => {
    const result = await db.query(
        `SELECT id
         FROM category
         WHERE hist_id IS NULL
           AND is_deleted = FALSE`
    );
    return result.rows.map(({ id }) => id);
};

const getCategories = async () => {
    const result = await db.query(
        `SELECT id, name
        FROM category
        WHERE hist_id IS NULL
            AND is_deleted = FALSE
        ORDER BY name ASC`
    );

    return result.rows;
};


const updateCategoryQuery = (categoryId, categoryData, updatedBy = null) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

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

    fields.push(`created_by = $${paramIndex}`);
    values.push(updatedBy);
    paramIndex++;
    fields.push("created_at = NOW()");

    values.push(categoryId);

    return {
        query: `
            UPDATE category
            SET ${fields.join(", ")}
            WHERE id = $${paramIndex}
              AND hist_id IS NULL
              AND is_deleted = FALSE
            RETURNING *
        `,
        values,
    };
};

const deleteCategoryQuery = (categoryId, deletedBy = null) => ({
    query: `
        UPDATE category
        SET is_deleted = TRUE,
            created_by = $2,
            created_at = NOW()
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        RETURNING *
    `,
    values: [categoryId, deletedBy],
});

module.exports = {
    createCategory,
    getCategoryByName,
    getCategoryById,
    getCategoryByIdQuery,
    getCategoryForUpdateQuery,
    getCategoryProductsQuery,
    createCategoryHistoryQuery,
    getCategoryIds,
    getCategories,
    updateCategoryQuery,
    deleteCategoryQuery,
};
