const db = require("../config/db");


const createCustomer = async (customerData) => {
    const { name, email, phone, address } = customerData;
    const query = `
        INSERT INTO customer (name, email, phone, address)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `;

    const result = await db.query(query, [name, email, phone, address]);
    return result.rows[0];
};

const deleteCustomer = async (customerId) => {
    const query = `
        DELETE FROM customer
        WHERE id = $1
        RETURNING *;
    `;
    const result = await db.query(query, [customerId]);
    return result.rows[0];
};

const getCustomerByIdQuery = (customerId) => {
    const query = `
        SELECT * FROM customer
        WHERE id = $1;
    `;
    const values = [customerId];

    return { query, values };
};

const getCustomerById = async (customerId) => {
    const { query, values } = getCustomerByIdQuery(customerId);
    const result = await db.query(query, values);
    return result.rows[0];
}

module.exports = {
    createCustomer,
    deleteCustomer,
    getCustomerByIdQuery,
    getCustomerById
};