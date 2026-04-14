/**
 * Script to create a default admin user
 * Run: node scripts/create_admin.js
 */
require("dotenv").config({ path: "./env/.env" });
const mongoose = require("mongoose");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI not found in .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    const adminData = {
      firstName: "Admin",
      lastName: "User",
      email: "admin@urbancompany.com",
      password: "admin123",
      phoneNumber: "1234567890",
      role: "admin",
      referralCode: "ADMIN123",
      isEmailVerified: true
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("! Admin user already exists:", adminData.email);
    } else {
      await User.create(adminData);
      console.log("✓ Admin user created successfully");
      console.log("----------------------------");
      console.log("Email:    " + adminData.email);
      console.log("Password: " + adminData.password);
      console.log("----------------------------");
    }
    process.exit(0);
  } catch (error) {
    console.error("✗ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
