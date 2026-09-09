const db = require("../config/db");


const createCustomer = async (customerData, createdBy = null) => {
    const { name, email, phone, address } = customerData;
    const query = `
        INSERT INTO customer (
            name, email, phone, address, created_by, hist_id, is_deleted
        )
        VALUES ($1, $2, $3, $4, $5, NULL, FALSE)
        RETURNING *;
        `;

    const result = await db.query(query, [name, email, phone, address, createdBy]);
    return result.rows[0];
};

const getCustomerByIdQuery = (customerId) => {
    const query = `
        SELECT * FROM customer
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE;
    `;
    const values = [customerId];

    return { query, values };
};

const getCustomerForUpdateQuery = (customerId) => ({
    query: `
        SELECT *
        FROM customer
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        FOR UPDATE
    `,
    values: [customerId],
});

const createCustomerHistoryQuery = (customerId) => ({
    query: `
        INSERT INTO customer (
            name,
            email,
            phone,
            address,
            created_by,
            created_at,
            hist_id,
            is_deleted
        )
        SELECT
            name,
            email,
            phone,
            address,
            created_by,
            created_at,
            id,
            is_deleted
        FROM customer
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        RETURNING *
    `,
    values: [customerId],
});

const deleteCustomerQuery = (customerId, deletedBy = null) => ({
    query: `
        UPDATE customer
        SET is_deleted = TRUE,
            created_by = $2,
            created_at = NOW()
        WHERE id = $1
          AND hist_id IS NULL
          AND is_deleted = FALSE
        RETURNING *
    `,
    values: [customerId, deletedBy],
});

const getCustomerById = async (customerId) => {
    const { query, values } = getCustomerByIdQuery(customerId);
    const result = await db.query(query, values);
    return result.rows[0];
}

module.exports = {
    createCustomer,
    getCustomerByIdQuery,
    getCustomerForUpdateQuery,
    createCustomerHistoryQuery,
    deleteCustomerQuery,
    getCustomerById
};