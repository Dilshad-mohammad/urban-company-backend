const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const mongoSanitize = require("express-mongo-sanitize");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ path: "./env/.env" });

const app = express();

// ================= FIREBASE ADMIN =================
try {
  let serviceAccount;
  
  // Use environment variable if available (for production/Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (parseError) {
      // If it's not a JSON string, it might be the base64 encoded version
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }
  } else {
    // Fallback to local file (for development)
    serviceAccount = require("./env/serviceAccountKey.json");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✓ Firebase Admin Initialized");
} catch (error) {
  console.log("✗ Firebase Admin Error:", error.message);
}

// ================= MIDDLEWARE =================

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// Body parser
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps) or any origin in development
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✓ MongoDB Connected"))
  .catch(err => {
    console.log("✗ MongoDB Error:", err.message);
    process.exit(1);
  });

// ================= ROUTES =================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const cartRoutes = require("./routes/cartRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const couponRoutes = require("./routes/couponRoutes");
const walletRoutes = require("./routes/walletRoutes");
const faqRoutes = require("./routes/faqRoutes");
const adminBookingRoutes = require("./routes/adminBookingRoutes");
const adminCouponRoutes = require("./routes/adminCouponRoutes");
const adminServiceRoutes = require("./routes/adminServiceRoutes");
const mediaRoutes = require("./routes/mediaRoutes");

// Mount routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/faqs", faqRoutes);
app.use("/api/v1/admin/bookings", adminBookingRoutes);
app.use("/api/v1/admin/coupons", adminCouponRoutes);
app.use("/api/v1/admin/services", adminServiceRoutes);
app.use("/api/v1/media", mediaRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= HEALTH CHECK =================
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404
  });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((error, req, res, next) => {
  const status = error.statusCode || error.status || 500;
  const message = error.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    console.error(`\n❌ Error [${status}]:`, {
      message,
      stack: error.stack
    });
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  UrbanClap Backend Server             ║
╠════════════════════════════════════════╣
║  🚀 Port:        ${PORT.toString().padEnd(24)} │
║  📦 Environment: ${(process.env.NODE_ENV || "development").padEnd(21)} │
║  🗄️  Database:    Connected             │
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

module.exports = app;
