const { z } = require("zod");

const getLowStockProductsSchema = z.object({
    threshold: z.coerce
        .number({ required_error: "Threshold is required" })
        .int({ message: "Threshold must be an integer" })
        .nonnegative({ message: "Threshold must be non-negative" }),
});

module.exports = {
    getLowStockProductsSchema,
};