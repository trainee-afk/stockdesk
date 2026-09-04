
const { z } = require("zod");

const createOrderSchema = z.object({
    customerId: z.coerce
        .number({ required_error: "Customer ID is required" })
        .int({ message: "Customer ID must be an integer" })
        .positive({ message: "Customer ID must be positive" }),
    lineItems: z.array(
        z.object({
            productId: z.coerce
                .number({ required_error: "Product ID is required" })
                .int({ message: "Product ID must be an integer" })
                .positive({ message: "Product ID must be positive" }),
            quantity: z.coerce
                .number({ required_error: "Quantity is required" })
                .int({ message: "Quantity must be an integer" })
                .positive({ message: "Quantity must be positive" }),
        })
    )
        .min(1, { message: "At least one line item is required" }),
});

module.exports = {
    createOrderSchema,
};