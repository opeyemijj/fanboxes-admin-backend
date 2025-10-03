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

module.exports = {
  createStaticByAdmin,
};
