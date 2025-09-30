const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs").promises;
const path = require("path");

exports.sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let htmlContent;

    if (options.template) {
      // Read the Handlebars template file
      const templatePath = path.join(
        __dirname,
        "../../views",
        `${options.template}.hbs`
      );

      try {
        const templateFile = await fs.readFile(templatePath, "utf8");

        // Register Handlebars helpers
        handlebars.registerHelper("formatDate", function(date) {
          return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        });

        handlebars.registerHelper("calculateItemsTotal", function(items) {
          const total = items.reduce((sum, item) => sum + item.value, 0);
          return total.toFixed(2);
        });

        // Compile the template
        const template = handlebars.compile(templateFile);

        // Render with context data
        htmlContent = template({
          ...options.context,
          verificationUrl: options.verificationUrl,
          resetURL: options.resetURL,
          email: options.to,
          name: options.name,
        });
      } catch (error) {
        console.error(`Error reading template file: ${templatePath}`, error);
        throw new Error(`Template file not found: ${options.template}`);
      }
    }

    const mailOptions = {
      from: options?.from || process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: htmlContent || options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};
