const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path"); // Import the path module

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/userAuth")
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB:", err));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Root Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve the index.html file
});

// Sign Up Endpoint
app.post("/signup", async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });

        await newUser.save();
        res.status(201).json({ success: true, message: "User registered successfully!" });
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate email
            res.status(400).json({ success: false, message: "Email already exists!" });
        } else {
            res.status(500).json({ success: false, message: "Server error." });
        }
    }
});

// Sign In Endpoint
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        res.status(200).json({ success: true, message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
