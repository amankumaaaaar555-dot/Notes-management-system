
const express = require("express");
const cors = require("cors");

const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./midddlewere/auth.middlewere");

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

// Public routes
app.use("/user", userRouter);

app.get("/home", (req, res) => {
    res.send({ msg: "Welcome to Note Application" });
});

// Protected routes
app.use(auth);

app.use("/notes", noteRouter);

app.get("/dashboard", (req, res) => {
    res.send({ msg: "Welcome to Note Application" });
});

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
    try {
        await connection;
        console.log("DB Connected");
        console.log(`Server started on port ${PORT}`);
    } catch (error) {
        console.error("Database connection error:", error);
    }
});
