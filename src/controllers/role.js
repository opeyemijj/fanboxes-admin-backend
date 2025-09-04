const Role = require("../models/role");

const createRole = async (req, res) => {
  try {
    const { role, permittedItems } = req.body;

    if (!role || !permittedItems) {
      return res
        .status(400)
        .json({ message: "role and permittedItems are required" });
    }

    // prettier-ignore
    const newPermission = new Role({
      role,
      slug: role.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Math.random().toString(36).slice(2, 8),
      permittedItems,
    });

    await newPermission.save();

    res.status(201).json({
      message: "Role permissions saved successfully",
      data: newPermission,
    });
  } catch (error) {
    console.error("Error saving permissions:", error);
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = { createRole };
