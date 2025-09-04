const Role = require("../models/role");

const createRoleByAdmin = async (req, res) => {
  try {
    const { role, permissions } = req.body; // ✅ use 'permissions', not 'permittedItems'

    if (!role || !permissions) {
      return res
        .status(400)
        .json({ message: "role and permissions are required" });
    }

    const data = await Role.create({
      role,
      slug:
        role
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "") +
        "_" +
        Math.random()
          .toString(36)
          .slice(2, 8),
      permissions, // ✅ save permissions
    });

    res.status(201).json({
      message: "Role permissions saved successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error saving permissions:", error);
    res.status(400).json({
      message: error.message,
    });
  }
};

const getRolesByAdmin = async (req, res) => {
  try {
    const roles = await Role.find();

    return res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getRoleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const role = await Role.findOne({ slug });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the role you're looking for",
      });
    }

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { createRoleByAdmin, getRoleBySlug, getRolesByAdmin };
