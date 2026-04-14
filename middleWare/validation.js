const { body, validationResult } = require("express-validator");

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Validation rules for auth
exports.validateRegister = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
];

exports.validateLogin = [
  body("emailOrPhone")
    .notEmpty()
    .withMessage("Email or phone number is required")
    .custom((value) => {
      const isEmail = value.includes("@");
      const isPhone = /^\+?[0-9]{10,}$/.test(value);
      if (!isEmail && !isPhone) {
        throw new Error("Please provide a valid email or phone number");
      }
      return true;
    }),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

exports.validateUpdateProfile = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters"),
  body("email")
    .optional()
    .toLowerCase()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("phoneNumber")
    .optional()
    .matches(/^\+?[0-9]{10,}$/)
    .withMessage("Please provide a valid phone number"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),
];

exports.validateAddress = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),
  body("phoneNumber")
    .matches(/^\+?[0-9]{10,}$/)
    .withMessage("Please provide a valid phone number"),
  body("flatNo")
    .trim()
    .notEmpty()
    .withMessage("Flat/House number is required"),
  body("street")
    .trim()
    .notEmpty()
    .withMessage("Street is required"),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),
  body("zipCode")
    .trim()
    .notEmpty()
    .withMessage("Zip code is required"),
  body("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required")
];

exports.validateService = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Service title is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a valid number"),
  body("duration")
    .isInt({ min: 1 })
    .withMessage("Duration must be a valid number in minutes"),
  body("categoryId")
    .notEmpty()
    .withMessage("Category is required"),
];

exports.validateReview = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Review title is required"),
  body("comment")
    .optional()
    .trim()
];

exports.validateBooking = [
  body("scheduledDate")
    .notEmpty()
    .withMessage("Scheduled date is required"),
  body("scheduledSlot")
    .notEmpty()
    .withMessage("Time slot is required"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["credit_card", "debit_card", "upi", "google_pay", "apple_pay", "cash_on_delivery", "wallet"])
    .withMessage("Invalid payment method"),
];
