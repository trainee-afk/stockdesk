const customerModel = require("../models/customerModel");

const createCustomer = async (customerData) => {
    return await customerModel.createCustomer(customerData);
};

module.exports = {
    createCustomer,
};