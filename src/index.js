const express = require("express");
const cors = require("cors");
const db = require('./config/db');
const asyncHandler = require("./middlewares/asyncHandler");
const errorHandler = require("./middlewares/errorHandler");

var corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    optionsSuccessStatus: 200
}

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get("/health", asyncHandler(async (req, res) => {
    res.json({ message: "Hello, World!" });
}));

app.use(errorHandler);


async function testConnection() {
    try {
        const res = await db.query('SELECT NOW()');
        console.log('Connected to PostgreSQL successfully at:', res.rows[0].now);
    } catch (err) {
        console.error('Database connection failed:', err.stack);
    }
}

testConnection();


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});