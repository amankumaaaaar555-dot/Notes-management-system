
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel } = require("../model/user.model");

const userRouter = express.Router();

// REGISTER
userRouter.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).send({
                msg: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).send({
                msg: "Password must contain at least 6 characters"
            });
        }

        // Check whether user already exists
        const existingUser = await userModel.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(409).send({
                msg: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new userModel({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        });

        await user.save();

        return res.status(201).send({
            msg: "User registered successfully"
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).send({
            msg: "Something went wrong during registration"
        });
    }
});


// LOGIN
userRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({
                msg: "Email and password are required"
            });
        }

        // Find user
        const user = await userModel.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).send({
                msg: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).send({
                msg: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).send({
            msg: "User login successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).send({
            msg: "Something went wrong during login"
        });
    }
});

module.exports = { userRouter };
