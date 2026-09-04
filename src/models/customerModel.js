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

module.exports = {
    createCustomer,
};