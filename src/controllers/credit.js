const Credit = require("../models/Credit");

const createCreditByAdmin = async (req, res) => {
  try {
    const requestData = req.body; // ✅ use 'permissions', not 'permittedItems'

    const data = await Credit.create({
      name: requestData?.name,
      type: requestData.type,
      value: requestData.value,
      valueType: requestData.valueType,
      slug:
        requestData?.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "") +
        "_" +
        Math.random()
          .toString(36)
          .slice(2, 8),
    });

    res.status(201).json({
      message: "Credit conversion saved successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error saving credit conversion:", error);
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  createCreditByAdmin,
};
