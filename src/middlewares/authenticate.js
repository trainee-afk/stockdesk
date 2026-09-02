// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    let token = null;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        req.user = null;
        res.locals.user = null;
        return next();
    }

    try {
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decodedUser;
        res.locals.user = decodedUser;

        next();
    } catch (err) {
        res.clearCookie('token');
        req.user = null;
        res.locals.user = null;
        next();
    }
};


// Authentication for static routes
const authenticateWeb = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login'); // Redirect to login if unauthenticated
    }
    next();
};

// Authentication for static apis
const authenticateApi = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    next();
};

module.exports = { authenticate, authenticateWeb, authenticateApi };