const { z } = require("zod");

const productFields = {
    name: z
        .string({ required_error: "Product name is required" })
        .trim()
        .min(2, { message: "Product name must be at least 2 characters long" })
        .max(255, { message: "Product name must not exceed 255 characters" }),
    sku: z
        .string({ required_error: "Product SKU is required" })
        .trim()
        .min(1, { message: "Product SKU is required" })
        .max(100, { message: "Product SKU must not exceed 100 characters" }),
    price: z.coerce
        .number({ required_error: "Product price is required" })
        .nonnegative({ message: "Product price must not be negative" }),
    stock_quantity: z.coerce
        .number({ required_error: "Stock quantity is required" })
        .int({ message: "Stock quantity must be an integer" })
        .nonnegative({ message: "Stock quantity must not be negative" }),
    fk_category_id: z
        .number({ required_error: "Category is required" })
        .int({ message: "Category ID must be an integer" })
        .positive({ message: "Category ID must be positive" }),
};

const createProductSchema = z.object(productFields);
const updateProductSchema = z.object({
    name: productFields.name.optional(),
    sku: productFields.sku.optional(),
    price: productFields.price.optional(),
    stock_quantity: productFields.stock_quantity.optional(),
    fk_category_id: productFields.fk_category_id.optional(),
});

module.exports = {
    createProductSchema,
    updateProductSchema,
};
