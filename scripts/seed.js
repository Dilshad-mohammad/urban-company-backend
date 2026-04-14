/**
 * Seed script for UrbanClap Backend
 * Run: node scripts/seed.js
 */
require("dotenv").config({ path: "./env/.env" });
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Service = require("../models/Service");
const Faq = require("../models/Faq");
const Banner = require("../models/Banner");
const CommerceSettings = require("../models/CommerceSettings");

const categories = [
  { name: "Salon for Women", icon: "💇‍♀️", description: "Haircut, facial, waxing, and more", displayOrder: 1, isFeatured: true },
  { name: "Salon for Men", icon: "💈", description: "Haircut, beard grooming, facial, and more", displayOrder: 2, isFeatured: true },
  { name: "Spa for Women", icon: "🧖‍♀️", description: "Full body massage, head massage, and more", displayOrder: 3, isFeatured: true },
  { name: "Home Cleaning", icon: "🧹", description: "Full home deep cleaning, bathroom, kitchen", displayOrder: 4, isFeatured: true },
  { name: "Appliance Repair", icon: "🔧", description: "AC, washing machine, refrigerator repair", displayOrder: 5, isFeatured: true },
  { name: "Electrician", icon: "⚡", description: "Wiring, fan, switchboard, inverter", displayOrder: 6, isFeatured: false },
  { name: "Plumber", icon: "🚿", description: "Tap, pipe, toilet, water tank", displayOrder: 7, isFeatured: false },
  { name: "Carpenter", icon: "🪚", description: "Furniture repair, bed, wardrobe, door", displayOrder: 8, isFeatured: false },
  { name: "Pest Control", icon: "🪳", description: "Cockroach, ant, termite, bed bugs", displayOrder: 9, isFeatured: false },
  { name: "Painting", icon: "🎨", description: "Interior & exterior wall painting", displayOrder: 10, isFeatured: false },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB for seeding");

    // Seed Commerce Settings
    await CommerceSettings.findOneAndUpdate(
      { key: "default" },
      { key: "default", taxPercentage: 18, minBookingAmount: 99, walletMaxUsagePercentOfSubtotal: 50, firstOrderCashbackPercent: 10, firstOrderCashbackMaxAmount: 200, cashbackExpiryDays: 90, defaultServiceProviderCommission: 20 },
      { upsert: true, new: true }
    );
    console.log("✓ Commerce settings seeded");

    // Seed Categories
    const createdCategories = [];
    for (const cat of categories) {
      const created = await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
      createdCategories.push(created);
    }
    console.log(`✓ ${createdCategories.length} categories seeded`);

    // Seed Services
    const salonWomenId = createdCategories[0]._id;
    const salonMenId = createdCategories[1]._id;
    const cleaningId = createdCategories[3]._id;
    const applianceId = createdCategories[4]._id;

    const services = [
      { title: "Haircut & Styling", categoryId: salonWomenId, price: 499, discountPrice: 399, duration: 45, description: "Professional haircut & blow-dry at home", inclusions: ["Haircut", "Blow-dry", "Styling"], isFeatured: true, isBestSeller: true },
      { title: "Full Body Waxing", categoryId: salonWomenId, price: 1299, discountPrice: 999, duration: 90, description: "Complete waxing package including arms, legs, underarms", inclusions: ["Full Arms", "Full Legs", "Underarms"], isFeatured: true },
      { title: "Classic Facial", categoryId: salonWomenId, price: 799, discountPrice: 649, duration: 60, description: "Deep cleansing facial with massage", inclusions: ["Cleansing", "Scrub", "Massage", "Pack"], isFeatured: false },
      { title: "Men's Haircut", categoryId: salonMenId, price: 299, discountPrice: 249, duration: 30, description: "Professional men's haircut at home", inclusions: ["Haircut", "Styling"], isFeatured: true, isBestSeller: true },
      { title: "Beard Grooming", categoryId: salonMenId, price: 199, discountPrice: null, duration: 20, description: "Beard shaping, trimming, and styling", inclusions: ["Trim", "Shape", "Oil Massage"], isFeatured: false },
      { title: "Full Home Deep Cleaning", categoryId: cleaningId, price: 2999, discountPrice: 2499, duration: 240, description: "Complete deep cleaning of your entire home", inclusions: ["All Rooms", "Kitchen", "Bathrooms", "Balcony"], isFeatured: true, isBestSeller: true },
      { title: "Bathroom Cleaning", categoryId: cleaningId, price: 499, discountPrice: 399, duration: 60, description: "Thorough bathroom deep cleaning", inclusions: ["Tiles", "Fixtures", "Mirror", "Floor"], isFeatured: false },
      { title: "AC Service & Repair", categoryId: applianceId, price: 599, discountPrice: 449, duration: 60, description: "AC gas refill, cleaning, and repair", inclusions: ["Filter Clean", "Gas Check", "Performance Check"], isFeatured: true, isBestSeller: true },
      { title: "Washing Machine Repair", categoryId: applianceId, price: 399, discountPrice: null, duration: 60, description: "Diagnosis and repair of washing machine issues", inclusions: ["Diagnosis", "Minor Repair"], isFeatured: false },
    ];

    for (const svc of services) {
      await Service.findOneAndUpdate({ title: svc.title }, svc, { upsert: true, new: true });
    }
    console.log(`✓ ${services.length} services seeded`);

    // Seed FAQs
    const faqs = [
      { question: "How do I book a service?", answer: "Open the app, select a category, choose your service, pick a time slot, and confirm your booking.", displayOrder: 1 },
      { question: "Can I cancel a booking?", answer: "Yes, you can cancel a booking before the service provider arrives. Cancellation charges may apply.", displayOrder: 2 },
      { question: "How are service providers verified?", answer: "All service providers undergo background verification, skill testing, and document verification before onboarding.", displayOrder: 3 },
      { question: "What payment methods are accepted?", answer: "We accept UPI, credit/debit cards, Google Pay, Apple Pay, and cash on delivery.", displayOrder: 4 },
      { question: "What if I'm not satisfied with the service?", answer: "We offer a satisfaction guarantee. If not satisfied, contact support for a resolution.", displayOrder: 5 },
    ];

    for (const faq of faqs) {
      await Faq.findOneAndUpdate({ question: faq.question }, faq, { upsert: true, new: true });
    }
    console.log(`✓ ${faqs.length} FAQs seeded`);

    // Seed Banners
    const banners = [
      { imageUrl: "https://via.placeholder.com/800x300?text=Salon+at+Home+50%25+Off", altText: "Salon at Home", displayOrder: 1 },
      { imageUrl: "https://via.placeholder.com/800x300?text=Deep+Cleaning+Starting+%E2%82%B9499", altText: "Deep Cleaning", displayOrder: 2 },
      { imageUrl: "https://via.placeholder.com/800x300?text=AC+Service+%E2%82%B9449+Only", altText: "AC Service", displayOrder: 3 },
    ];

    for (const banner of banners) {
      await Banner.findOneAndUpdate({ altText: banner.altText }, banner, { upsert: true, new: true });
    }
    console.log(`✓ ${banners.length} banners seeded`);

    console.log("\n🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDB();
