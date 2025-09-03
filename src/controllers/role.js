const Role = require("../models/role");

const createRole = async (req, res) => {
  console.log("Coming to create role", req.body);
  try {
    const { role, permittedItems } = req.body;

    if (!role || !permittedItems) {
      return res
        .status(400)
        .json({ message: "role and permittedItems are required" });
    }

    const newPermission = new Role({
      role,
      permittedItems,
    });

    await newPermission.save();

    res.status(201).json({
      message: "Role permissions saved successfully",
      data: newPermission,
    });
  } catch (error) {
    console.error("Error saving permissions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createRole };
