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

const getCreditsByAdmin = async (req, res) => {
  try {
    const { page: pageQuery, limit: limitQuery } = req.query;

    const limit = parseInt(limitQuery) || 10;
    const page = parseInt(pageQuery) || 1;

    // Calculate skip correctly
    const skip = limit * (page - 1);

    const totalCredit = await Credit.countDocuments();
    const credits = await Credit.aggregate([
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
          name: 1,
          type: 1,
          value: 1,
          valueType: 1,
          slug: 1,
          createdAt: 1,
        },
      },
    ]);

    // console.log(roles, "check the roles");

    return res.status(200).json({
      success: true,
      data: credits,
      total: totalCredit,
      count: Math.ceil(totalCredit / limit),
      currentPage: page,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getCreditBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const credit = await Credit.findOne({ slug });

    if (!credit) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the credit you're looking for",
      });
    }

    res.status(201).json({ success: true, data: credit });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCreditBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const requestData = req.body;

    await Credit.findOneAndUpdate(
      { slug },
      {
        ...requestData,
      },
      { new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: "Credit details have been successfully updated.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCreditBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const credit = await Credit.findOneAndDelete({ slug });
    if (!credit) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the credit you're looking for",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Credit has been successfully deleted.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getResellPercentage = async (req, res) => {
  try {
    const data = await Credit.findOne({ type: "refund" }).lean();
    res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getCashToCreditConversionRate = async (req, res) => {
  try {
    const data = await Credit.findOne({ type: "credit rate" }).lean();
    res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCreditByAdmin,
  getCreditsByAdmin,
  getCreditBySlug,
  updateCreditBySlug,
  deleteCreditBySlug,
  getResellPercentage,
  getCashToCreditConversionRate,
};
