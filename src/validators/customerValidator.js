const { z } = require("zod");

const createCustomerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().max(20).optional(),
    address: z.string().max(255).optional(),
});

module.exports = {
    createCustomerSchema,
};