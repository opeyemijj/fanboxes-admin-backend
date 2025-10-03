const mongoose = require("mongoose");

const privacyPolicySchema = new mongoose.Schema(
  {
    // Settings fields
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },
    version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    contactEmail: {
      type: String,
      required: true,
      default: "privacy@fanboxes.com",
    },
    supportEmail: {
      type: String,
      required: true,
      default: "support@fanboxes.com",
    },
    companyName: {
      type: String,
      required: true,
      default: "FanBoxes",
    },

    // Sections array
    sections: [
      {
        sectionId: {
          type: String,
          required: true,
          trim: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        content: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
          required: true,
          default: 0,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
privacyPolicySchema.index({ "sections.order": 1, "sections.isActive": 1 });

const PrivacyPolicy = mongoose.model("PrivacyPolicy", privacyPolicySchema);

module.exports = PrivacyPolicy;
