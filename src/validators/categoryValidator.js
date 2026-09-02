const { z } = require('zod');

const createCategorySchema = z.object({
    name: z
        .string({ required_error: 'Category name is required' })
        .trim()
        .min(2, { message: 'Category name must be at least 2 characters long' })
        .max(255, { message: 'Category name must not exceed 255 characters' }),

    description: z
        .string()
        .trim()
        .max(1000, { message: 'Description must not exceed 1000 characters' })
        .optional()
        .nullable(),
});


const updateCategorySchema = z.object({
    name: z
        .string({ required_error: 'Category name is required' })
        .trim()
        .min(2, { message: 'Category name must be at least 2 characters long' })
        .max(255, { message: 'Category name must not exceed 255 characters' })
        .optional()
        .nullable(),

    description: z
        .string()
        .trim()
        .max(1000, { message: 'Description must not exceed 1000 characters' })
        .optional()
        .nullable(),
});

module.exports = {
    createCategorySchema,
    updateCategorySchema,
};