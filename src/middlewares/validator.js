
const validator = (schema) => (req, res, next) => {

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
        const issues = validationResult.error?.issues || validationResult.error?.errors || [];
        const formattedErrors = issues.map((err) => ({
            field: err.path?.[0],
            message: err.message,
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors,
        });
    }

    req.body = validationResult.data;
    next();
};

module.exports = validator;