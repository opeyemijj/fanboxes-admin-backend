const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const adminController = require("../controllers/admin");

const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");
router.get("/users/profile", verifyToken, userController.getOneUser);

router.put("/users/profile", verifyToken, userController.updateUser);

router.get("/users/invoice", verifyToken, userController.getInvoice);

router.put(
  "/users/change-password",
  verifyToken,
  userController.changePassword
);
// router.post("/admin/users/:uid", verifyToken, userController.getUserByAdmin);
// router.post("/admin/users/role/:uid", verifyToken, userController.updateRole)
router.get(
  "/admin/users",
  verifyToken,
  withSlug(adminController.getUsersByAdmin, "view_user_listing")
);

router.post(
  "/admin/users/add-admin",
  verifyToken,
  withSlug(adminController.createAdminUserByAdmin, "add_new_admin")
);

router.get(
  "/admin/admin-vendor",
  verifyToken,
  adminController.getAdminVendorByAdmin
);

router.get(
  "/admin/users/:id",
  verifyToken,
  withSlug(adminController.getOrdersByUid, "view_user_details")
);

router.post(
  "/admin/users/role/:id",
  verifyToken,
  adminController.UpdateRoleByAdmin
);

module.exports = router;
