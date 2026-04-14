/**
 * Enhanced Full Seed script for UrbanClap Backend
 * Creates a rich history of Categories, Services, Users, and 100+ Bookings
 * Run: node scripts/full_seed.js
 */
require("dotenv").config({ path: "./env/.env" });
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Service = require("../models/Service");
const Faq = require("../models/Faq");
const Banner = require("../models/Banner");
const CommerceSettings = require("../models/CommerceSettings");
const User = require("../models/User");
const Booking = require("../models/Booking");

const categories = [
  { name: "Salon for Women", icon: "💇‍♀️", description: "Haircut, facial, waxing, and more", displayOrder: 1, isFeatured: true },
  { name: "Salon for Men", icon: "💈", description: "Haircut, beard grooming, facial, and more", displayOrder: 2, isFeatured: true },
  { name: "Home Cleaning", icon: "🧹", description: "Full home deep cleaning, bathroom, kitchen", displayOrder: 4, isFeatured: true },
  { name: "Appliance Repair", icon: "🔧", description: "AC, washing machine, refrigerator repair", displayOrder: 5, isFeatured: true },
];

const mockUsers = [
  { firstName: "John", lastName: "Doe", email: "john@example.com", password: "password123", phoneNumber: "9876543210", role: "user" },
  { firstName: "Jane", lastName: "Smith", email: "jane@example.com", password: "password123", phoneNumber: "9876543211", role: "user" },
  { firstName: "Michael", lastName: "Brown", email: "michael@example.com", password: "password123", phoneNumber: "9876543212", role: "user" },
  { firstName: "Emily", lastName: "Davis", email: "emily@example.com", password: "password123", phoneNumber: "9876543213", role: "user" },
];

const fullSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // 0. Clear Existing Data
    await Booking.deleteMany({});
    console.log("✓ Cleared existing bookings");

    // 1. Seed Commerce Settings
    await CommerceSettings.findOneAndUpdate(
      { key: "default" },
      { key: "default", taxPercentage: 18, minBookingAmount: 99, walletMaxUsagePercentOfSubtotal: 50, firstOrderCashbackPercent: 10, firstOrderCashbackMaxAmount: 200, cashbackExpiryDays: 90, defaultServiceProviderCommission: 20 },
      { upsert: true, new: true }
    );

    // 2. Seed Categories
    const createdCategories = [];
    for (const cat of categories) {
      const slug = cat.name.toLowerCase().replace(/\s+/g, "-");
      const created = await Category.findOneAndUpdate({ name: cat.name }, { ...cat, slug }, { upsert: true, new: true });
      createdCategories.push(created);
    }
    console.log(`✓ ${createdCategories.length} categories seeded`);

    // 3. Seed Services
    const salonWomenId = createdCategories[0]._id;
    const cleaningId = createdCategories[2]._id;

    const servicesList = [
      { title: "Haircut & Styling", categoryId: salonWomenId, price: 499, discountPrice: 399, duration: 45, description: "Professional haircut at home", inclusions: ["Haircut", "Styling"], isFeatured: true },
      { title: "Full Home Deep Cleaning", categoryId: cleaningId, price: 2999, discountPrice: 2499, duration: 240, description: "Complete deep cleaning", inclusions: ["All Rooms"], isFeatured: true },
      { title: "Facial & Cleanup", categoryId: salonWomenId, price: 899, discountPrice: 799, duration: 60, description: "Glowing skin treatment", inclusions: ["Facial", "Massage"], isFeatured: true },
    ];

    const createdServices = [];
    for (const svc of servicesList) {
      const slug = svc.title.toLowerCase().replace(/\s+/g, "-");
      const created = await Service.findOneAndUpdate({ title: svc.title }, { ...svc, slug }, { upsert: true, new: true });
      createdServices.push(created);
    }
    console.log(`✓ ${createdServices.length} services seeded`);

    // 4. Seed Users
    const users = [];
    for (const u of mockUsers) {
      const created = await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
      users.push(created);
    }
    console.log(`✓ ${users.length} users seeded`);

    // 5. Generate Historical Bookings (Last 6 Months)
    console.log("... Generating historical bookings (this may take a few seconds)");
    const historicalBookings = [];
    const statuses = ["completed", "completed", "completed", "pending", "pending", "cancelled"];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomService = createdServices[Math.floor(Math.random() * createdServices.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Random date within last 180 days
        const daysAgo = Math.floor(Math.random() * 180);
        const date = new Date();
        date.setDate(now.getDate() - daysAgo);

        historicalBookings.push({
            userId: randomUser._id,
            bookingNumber: `BK-${2024000 + i}`,
            items: [{ serviceId: randomService._id, serviceName: randomService.title, quantity: 1, price: randomService.price }],
            serviceAddress: { name: "Home", flatNo: "A-1", street: "Main Rd", city: "Mumbai", state: "Maharashtra" },
            scheduledDate: date,
            scheduledSlot: "10:00 AM - 11:00 AM",
            paymentMethod: i % 2 === 0 ? "cash_on_delivery" : "wallet",
            subtotal: randomService.price,
            total: randomService.price,
            status: status,
            createdAt: date,
            updatedAt: date
        });
    }

    await Booking.insertMany(historicalBookings);
    console.log(`✓ 100 historical bookings seeded`);

    console.log("\n🚀 Full seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

fullSeed();
