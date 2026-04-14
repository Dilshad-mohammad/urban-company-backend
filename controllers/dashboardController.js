const Booking = require("../models/Booking");
const User = require("../models/User");
const Service = require("../models/Service");
const ServiceProvider = require("../models/ServiceProvider");

// @desc    Get dashboard stats (admin only)
// @route   GET /api/v1/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const getStartOf = (period, date = new Date()) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      if (period === 'week') { d.setDate(d.getDate() - d.getDay()); }
      else if (period === 'month') { d.setDate(1); }
      else if (period === 'year') { d.setMonth(0, 1); }
      return d;
    };

    const thisWeekStart = getStartOf('week');
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const thisMonthStart = getStartOf('month');
    const lastMonthStart = new Date(thisMonthStart); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const thisYearStart = getStartOf('year');
    const lastYearStart = new Date(thisYearStart); lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat(((current - previous) / previous * 100).toFixed(2));
    };

    const getStats = async (start, end) => {
      const match = { createdAt: { $gte: start }, status: { $ne: 'cancelled' } };
      if (end) match.createdAt.$lt = end;
      const stats = await Booking.aggregate([
        { $match: match },
        { $group: { _id: null, revenue: { $sum: "$total" }, bookings: { $sum: 1 } } }
      ]);
      const userMatch = { role: "user", createdAt: { $gte: start } };
      if (end) userMatch.createdAt.$lt = end;
      const users = await User.countDocuments(userMatch);
      const s = stats[0] || { revenue: 0, bookings: 0 };
      return { revenue: s.revenue, bookings: s.bookings, users, aov: s.bookings > 0 ? s.revenue / s.bookings : 0 };
    };

    const [allTime, thisYear, lastYear, thisMonth, lastMonth, thisWeek, lastWeek] = await Promise.all([
      getStats(new Date(0)), getStats(thisYearStart), getStats(lastYearStart, thisYearStart),
      getStats(thisMonthStart), getStats(lastMonthStart, thisMonthStart),
      getStats(thisWeekStart), getStats(lastWeekStart, thisWeekStart)
    ]);

    const statusResult = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const bookingsByStatus = {};
    statusResult.forEach(item => { bookingsByStatus[item._id] = item.count; });

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 }).limit(10)
      .populate("userId", "firstName lastName email profilePicture")
      .populate("serviceProviderId", "name profilePicture");

    const monthlyHistory = await Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().setFullYear(now.getFullYear() - 1)) }, status: { $ne: "cancelled" } } },
      { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, revenue: { $sum: "$total" }, bookings: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const dailyHistory = await Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().setDate(now.getDate() - 30)) }, status: { $ne: "cancelled" } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, bookings: { $sum: 1 } } },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          allTime,
          yearly: { ...thisYear, revenueChange: calculateChange(thisYear.revenue, lastYear.revenue), bookingChange: calculateChange(thisYear.bookings, lastYear.bookings) },
          monthly: { ...thisMonth, revenueChange: calculateChange(thisMonth.revenue, lastMonth.revenue), bookingChange: calculateChange(thisMonth.bookings, lastMonth.bookings) },
          weekly: { ...thisWeek, revenueChange: calculateChange(thisWeek.revenue, lastWeek.revenue), bookingChange: calculateChange(thisWeek.bookings, lastWeek.bookings) }
        },
        bookingsByStatus,
        history: { monthly: monthlyHistory, daily: dailyHistory },
        recentBookings,
        totalServices: await Service.countDocuments(),
        totalProviders: await ServiceProvider.countDocuments({ status: "active" })
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
