const { z } = require('zod');

const registerSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .email({ message: 'Invalid email address format' }),

    password: z
        .string({ required_error: 'Password is required' })
        .min(6, { message: 'Password must be at least 6 characters long' })
        .max(100, { message: 'Password must not exceed 100 characters' }),

    role: z
        .enum(["ADMIN", "STAFF"], {
            errorMap: () => ({ message: 'Role must be admin or staff' }),
        }),
});

module.exports = {
    registerSchema,
};