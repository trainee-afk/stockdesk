
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

const listOrdersSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum([
        "PENDING",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
    ]).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
}).refine(
    ({ from, to }) => !from || !to || from <= to,
    { message: "from must be before or equal to to", path: ["from"] }
);

const updateOrderStatusSchema = z.object({
    status: z.enum([
        "PENDING",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
    ]),
});

module.exports = {
    createOrderSchema,
    listOrdersSchema,
    updateOrderStatusSchema,
};