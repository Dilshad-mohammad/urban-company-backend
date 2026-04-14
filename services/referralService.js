const User = require("../models/User");

async function generateUniqueReferralCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  let exists = true;

  while (exists) {
    code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    exists = await User.findOne({ referralCode: code });
  }

  return code;
}

module.exports = { generateUniqueReferralCode };
