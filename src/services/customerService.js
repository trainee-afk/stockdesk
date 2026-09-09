const customerModel = require("../models/customerModel");
const db = require("../config/db");

const createCustomer = async (customerData, createdBy = null) => {
    return customerModel.createCustomer(customerData, createdBy);
};

const deleteCustomer = async (customerId, deletedBy = null) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const currentQuery = customerModel.getCustomerForUpdateQuery(customerId);
        const currentResult = await client.query(currentQuery.query, currentQuery.values);

        if (currentResult.rowCount === 0) {
            const error = new Error("Customer not found");
            error.statusCode = 404;
            throw error;
        }

        const historyQuery = customerModel.createCustomerHistoryQuery(customerId);
        await client.query(historyQuery.query, historyQuery.values);

        const deleteQuery = customerModel.deleteCustomerQuery(customerId, deletedBy);
        const deletedResult = await client.query(deleteQuery.query, deleteQuery.values);

        await client.query("COMMIT");
        return deletedResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }


};

const getCustomerById = async (customerId) => {
    const customer = await customerModel.getCustomerById(customerId);
    if (!customer) {
        const error = new Error("Customer not found");
        error.statusCode = 404;
        throw error;
    }
    return customer;
};

module.exports = {
    createCustomer,
    deleteCustomer,
    getCustomerById
};