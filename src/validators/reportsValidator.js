const { z } = require("zod");

const getLowStockProductsSchema = z.object({
    threshold: z.coerce
        .number({ required_error: "Threshold is required" })
        .int({ message: "Threshold must be an integer" })
        .nonnegative({ message: "Threshold must be non-negative" }),
});

const getTopProductsSchema = z.object({
    limit: z.coerce
        .number({ required_error: "Limit is required" })
        .int({ message: "Limit must be an integer" })
        .positive({ message: "Limit must be positive" })
        .default(10),
});

module.exports = {
    getLowStockProductsSchema,
    getTopProductsSchema,
};