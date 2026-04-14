const CommerceSettings = require("../models/CommerceSettings");

async function getSettings() {
  let settings = await CommerceSettings.findOne({ key: "default" });
  if (!settings) {
    settings = await CommerceSettings.create({ key: "default" });
  }
  return settings;
}

async function updateSettings(updates) {
  return CommerceSettings.findOneAndUpdate(
    { key: "default" },
    updates,
    { new: true, upsert: true }
  );
}

module.exports = {
  getSettings,
  updateSettings
};
