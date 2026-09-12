const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

dotenv.config();

async function fixAdmin() {
    try {
        const mongoUri =
            process.env.MONGO_URI ||
            "mongodb://localhost:27017/EVENTORA";

        await mongoose.connect(mongoUri);

        const hashedPassword = await bcrypt.hash("password123", 10);

        await User.findOneAndUpdate(
            { email: "admin@eventora.com" },
            {
                name: "Admin User",
                email: "admin@eventora.com",
                password: hashedPassword,
                role: "admin",
                isVerified: true
            },
            {
                upsert: true,
                new: true
            }
        );

        console.log("Admin account ready!");
        console.log("Email: admin@eventora.com");
        console.log("Password: password123");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error.message);
    }
}

fixAdmin();