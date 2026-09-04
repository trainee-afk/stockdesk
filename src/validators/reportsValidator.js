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

const _dateOnly = (field) => z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} must use YYYY-MM-DD format`)
        .refine((value) => {
            const date = new Date(`${value}T00:00:00.000Z`);
            return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
        }, `${field} must be a valid date`)
        .optional()
);

const getSalesSummarySchema = z.object({
    from: _dateOnly("from"),
    to: _dateOnly("to"),
}).refine(
    ({ from, to }) => !from || !to || from <= to,
    { message: "from must be before or equal to to", path: ["from"] }
);

module.exports = {
    getLowStockProductsSchema,
    getTopProductsSchema,
    getSalesSummarySchema,
};