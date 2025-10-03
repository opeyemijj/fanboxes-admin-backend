const PrivacyPolicy = require("../models/PrivacyPolicy");

// Get complete privacy policy data
const getPrivacyPolicy = async (req, res) => {
  try {
    let privacyPolicy = await PrivacyPolicy.findOne()
      .select("-__v")
      .lean();

    // If no privacy policy exists, create default one
    if (!privacyPolicy) {
      privacyPolicy = await createDefaultPrivacyPolicy();
    }

    // Filter active sections and sort by order
    const activeSections = privacyPolicy.sections
      .filter((section) => section.isActive)
      .sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: {
        ...privacyPolicy,
        sections: activeSections,
      },
      message: "Privacy policy retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to retrieve privacy policy",
    });
  }
};

// Update privacy policy settings
const updatePrivacyPolicySettings = async (req, res) => {
  try {
    const updateData = req.body;

    const privacyPolicy = await PrivacyPolicy.findOneAndUpdate(
      {},
      {
        ...updateData,
        lastUpdated: new Date(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).select("-__v");

    res.json({
      success: true,
      data: privacyPolicy,
      message: "Privacy policy settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating privacy policy settings:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to update privacy policy settings",
    });
  }
};

// Update specific section
const updatePrivacyPolicySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const updateData = req.body;

    const privacyPolicy = await PrivacyPolicy.findOneAndUpdate(
      { "sections.sectionId": sectionId },
      {
        $set: {
          "sections.$": {
            ...updateData,
            sectionId, // Ensure sectionId doesn't change
            lastUpdated: new Date(),
          },
          lastUpdated: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");

    if (!privacyPolicy) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Privacy policy section not found",
      });
    }

    res.json({
      success: true,
      data: privacyPolicy,
      message: "Privacy policy section updated successfully",
    });
  } catch (error) {
    console.error("Error updating privacy policy section:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to update privacy policy section",
    });
  }
};

// Add new section
const addPrivacyPolicySection = async (req, res) => {
  try {
    const sectionData = req.body;

    const privacyPolicy = await PrivacyPolicy.findOneAndUpdate(
      {},
      {
        $push: {
          sections: {
            ...sectionData,
            lastUpdated: new Date(),
          },
        },
        lastUpdated: new Date(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).select("-__v");

    res.status(201).json({
      success: true,
      data: privacyPolicy,
      message: "Privacy policy section added successfully",
    });
  } catch (error) {
    console.error("Error adding privacy policy section:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to add privacy policy section",
    });
  }
};

// Helper function to create default privacy policy
const createDefaultPrivacyPolicy = async () => {
  const defaultSections = [
    {
      sectionId: "information-collection",
      title: "1. Information We Collect",
      content: `We collect information to provide and improve our services, including:

• Personal Information: Name, email address, shipping address, phone number when you create an account or make a purchase
• Payment Information: Credit card details, billing address (processed securely through our payment partners)
• Spin & Game Data: Spin history, winning items, resell decisions, credit balances
• Device Information: IP address, browser type, device type for security and analytics
• Usage Data: Pages visited, features used, time spent on our platform`,
      order: 1,
      isActive: true,
    },
    {
      sectionId: "how-we-use",
      title: "2. How We Use Your Information",
      content: `We use your information for:

• Service Delivery: Process spins, manage wins, handle shipping, and credit resells
• Account Management: Create and maintain your user account
• Payment Processing: Process purchases and credit transactions
• Customer Support: Respond to inquiries and provide assistance
• Security: Prevent fraud and unauthorized access
• Personalization: Enhance your gaming and shopping experience
• Legal Compliance: Meet regulatory requirements`,
      order: 2,
      isActive: true,
    },
    {
      sectionId: "spin-feature-data",
      title: "3. Spin Feature & Game Data",
      content: `For our spin-to-win feature, we collect and process:

• Spin History: Record of all spins, outcomes, and timestamps
• Win Verification: Cryptographic proof of spin fairness and results
• Item Management: Tracking of won items, shipping status, and resell decisions
• Credit System: Management of credit balances from resold items
• Game Analytics: Anonymous data to improve game mechanics and user experience

All spins are cryptographically verified to ensure fairness and transparency.`,
      order: 3,
      isActive: true,
    },
    {
      sectionId: "data-sharing",
      title: "4. Data Sharing & Disclosure",
      content: `We may share your information with:

• Shipping Partners: To deliver won items to your address
• Payment Processors: To handle transactions securely
• Legal Authorities: When required by law or to protect our rights
• Service Providers: Companies that help us operate our platform

We do not sell your personal information to third parties.`,
      order: 4,
      isActive: true,
    },
    {
      sectionId: "data-security",
      title: "5. Data Security",
      content: `We implement robust security measures:

• Encryption: All data is encrypted in transit and at rest
• Access Controls: Limited access to personal information
• Regular Audits: Security assessments and vulnerability testing
• Secure Payments: PCI-compliant payment processing
• Spin Integrity: Cryptographic verification of all game outcomes`,
      order: 5,
      isActive: true,
    },
    {
      sectionId: "user-rights",
      title: "6. Your Rights & Choices",
      content: `You have the right to:

• Access your personal information
• Correct inaccurate data
• Delete your account and data
• Export your data
• Opt-out of marketing communications
• Object to certain processing

Contact us at privacy@fanboxes.com to exercise these rights.`,
      order: 6,
      isActive: true,
    },
    {
      sectionId: "cookies",
      title: "7. Cookies & Tracking",
      content: `We use cookies and similar technologies:

• Essential Cookies: Required for site functionality and spin features
• Preference Cookies: Remember your settings and preferences
• Analytics Cookies: Understand how users interact with our platform
• Security Cookies: Protect against fraudulent activity

You can control cookie settings through your browser.`,
      order: 7,
      isActive: true,
    },
    {
      sectionId: "age-restrictions",
      title: "8. Age Restrictions & Compliance",
      content: `Our services are intended for users 18 years and older:

• Age Verification: We implement age verification measures
• Parental Controls: We do not knowingly collect data from minors
• Gambling Compliance: We operate in compliance with applicable gaming laws
• Responsible Gaming: Tools and resources for responsible participation`,
      order: 8,
      isActive: true,
    },
    {
      sectionId: "international",
      title: "9. International Data Transfers",
      content: `Your data may be transferred and processed:

• Global Operations: We operate internationally
• Adequate Protection: We ensure appropriate safeguards for data transfers
• Legal Compliance: We adhere to international data protection standards`,
      order: 9,
      isActive: true,
    },
    {
      sectionId: "changes",
      title: "10. Changes to This Policy",
      content: `We may update this policy:

• Notification: We will notify you of significant changes
• Continued Use: Using our services after changes constitutes acceptance
• Review: We encourage periodic review of this policy`,
      order: 10,
      isActive: true,
    },
  ];

  const defaultPrivacyPolicy = new PrivacyPolicy({
    sections: defaultSections,
  });

  await defaultPrivacyPolicy.save();
  return defaultPrivacyPolicy.toObject();
};

module.exports = {
  getPrivacyPolicy,
  updatePrivacyPolicySettings,
  updatePrivacyPolicySection,
  addPrivacyPolicySection,
};
