const StaticPage = require("../models/StaticPage");

const createStaticByAdmin = async (req, res) => {
  try {
    const { title, htmlContent } = req.body;
    const data = await StaticPage.create({
      title,
      htmlContent,
      slug:
        title
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "") +
        "_" +
        Math.random()
          .toString(36)
          .slice(2, 8),
    });

    return res.status(201).json({
      message: "Static Page saved successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error saving Static Page:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

const getStaticPagesByAdmin = async (req, res) => {
  try {
    let { limit, page = 1 } = req.query;

    const skip = parseInt(limit) || 8;
    let query = {};

    const totalStaticPages = await StaticPage.countDocuments(query);

    const staticPages = await StaticPage.find(query)
      .skip(skip * (parseInt(page) - 1 || 0))
      .limit(skip)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: staticPages,
      count: Math.ceil(totalStaticPages / skip),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getStaticBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const staticPage = await StaticPage.findOne({ slug });

    if (!staticPage) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the static you're looking for",
      });
    }

    return res.status(201).json({ success: true, data: staticPage });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateStaticPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const requestData = req.body;

    const updatedData = await StaticPage.findOneAndUpdate(
      { slug },
      {
        ...requestData,
      },
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      return res.status(400).json({
        success: false,
        message: "Your static page did not found to update",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Static Page details have been successfully updated.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStaticByAdmin,
  getStaticPagesByAdmin,
  getStaticBySlug,
  updateStaticPageBySlug,
};
