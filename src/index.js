const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const db = require('./config/db');
const path = require("path");
const asyncHandler = require("./middlewares/asyncHandler");
const errorHandler = require("./middlewares/errorHandler");
const { authenticate } = require("./middlewares/authenticate");
// const { authorizeWeb, authorizeApi } = require("./middlewares/authorize");

const authRoute = require("./routes/authRoute");
const categoryRoute = require("./routes/categoryRoute");
const productRoute = require("./routes/productRoute");
const customerRoute = require("./routes/customerRoute");
const orderRoute = require("./routes/orderRoute");
const reportsRoute = require("./routes/reportsRoute");
const webAuthRoute = require("./routes/webAuthRoute");
const webProductsRoute = require("./routes/webProductsRoute");

var corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    optionsSuccessStatus: 200
}

const PORT = process.env.PORT || 5000;
const app = express();

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

app.use(helmet());
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); //For req.cookies


app.use(authenticate); // Attach user info to req.user and res.locals.user else null

app.get("/health", asyncHandler(async (req, res) => {
    res.json({ message: "Hello, World!" });
}));


app.use("/api/auth", authRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/customers", customerRoute);
app.use("/api/orders", orderRoute);
app.use("/api/reports", reportsRoute);
app.use("/", webAuthRoute);
app.use("/products", webProductsRoute);



app.use(errorHandler);


async function testConnection() {
    try {
        const res = await db.query("SELECT NOW()");

        console.log(
            "Connected to PostgreSQL successfully at:",
            res.rows[0].now
        );
    } catch (err) {
        throw new Error("Failed to connect to the database: " + err.message);
    }
}


async function startServer() {
    try {
        await testConnection();

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not found");
        }

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error("ERROR -", err.message);
        process.exit(1);
    }
}

startServer();

