
const checkRole = (user, allowedRoles) => {
    if (!allowedRoles.length) return true;
    return allowedRoles.includes(user?.role);
};

// Authorization for static routes
const authorizeWeb = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect('/login');
        }

        if (!checkRole(req.user, allowedRoles)) {
            return res.status(403).render('errors/403', { // TODO: will see whether to implement error page or redirect to normal page
                title: 'Access Denied',
                message: 'You do not have permission to view this page.'
            });
        }

        next();
    };
};


// Authorization for apis
const authorizeApi = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!checkRole(req.user, allowedRoles)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: insufficient permissions.'
            });
        }

        next();
    };
};

module.exports = { authorizeWeb, authorizeApi };