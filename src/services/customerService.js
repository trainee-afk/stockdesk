const customerModel = require("../models/customerModel");

const createCustomer = async (customerData) => {
    return await customerModel.createCustomer(customerData);
};

const deleteCustomer = async (customerId) => {

    const deletedCustomer = await customerModel.deleteCustomer(customerId);
    if (!deletedCustomer) {
        const error = new Error("Customer not found");
        error.statusCode = 404;
        throw error;
    }

    return deletedCustomer;

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