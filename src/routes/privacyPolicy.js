const express = require("express");
const router = express.Router();
const {
  getPrivacyPolicy,
  updatePrivacyPolicySettings,
  updatePrivacyPolicySection,
  addPrivacyPolicySection,
} = require("../controllers/PrivacyPolicyController");

// Public routes
router.get("/privacy-policy", getPrivacyPolicy);

// Admin routes (protected - add authentication middleware as needed)
router.put("/privacy-policy/settings", updatePrivacyPolicySettings);
router.put("/privacy-policy/sections/:sectionId", updatePrivacyPolicySection);
router.post("/privacy-policy/sections", addPrivacyPolicySection);

module.exports = router;
