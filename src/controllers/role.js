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
    console.log(req.query);
    const { page: pageQuery, limit: limitQuery } = req.query;

    const limit = parseInt(limitQuery) || 10;
    const page = parseInt(pageQuery) || 1;

    // Calculate skip correctly
    const skip = limit * (page - 1);

    const totalRoles = await Role.countDocuments();
    const roles = await Role.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },

      {
        $project: {
          role: 1,
          slug: 1,
          permissions: 1,
          createdAt: 1,
        },
      },
    ]);

    // console.log(roles, "check the roles");

    return res.status(200).json({
      success: true,
      data: roles,
      total: totalRoles,
      count: Math.ceil(totalRoles / limit),
      currentPage: page,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getRoleByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const role = await Role.findOne({ slug });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the role you're looking for",
      });
    }

    return res.status(201).json({ success: true, data: role });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateRoleByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const role = await Role.findOne({ slug });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the role you're looking for",
      });
    }

    const updated = await Role.findOneAndUpdate(
      { slug: slug },
      {
        ...req.body,
      },
      { new: true, runValidators: true }
    );

    return res.status(201).json({
      success: true,
      data: role,
      message: "Role has been updated successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteRoleByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const role = await Role.findOneAndDelete({ slug });
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the role you're looking for",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Role has been deleted successfully.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRoleByAdmin,
  getRoleByAdmin,
  getRolesByAdmin,
  updateRoleByAdmin,
  deleteRoleByAdmin,
  getAllRoles,
};
