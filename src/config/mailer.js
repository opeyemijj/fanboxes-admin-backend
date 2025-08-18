const Nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");

// Looking to send emails in production? Check out our Email API/SMTP product!

const TOKEN = "c73ed7d4841db2542e3ee2cd686b02d6";
const transport = Nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
  })
);

const sender = {
  address: "hello@demomailtrap.co",
  name: "Mailtrap Test",
};

const sendEmail = async ({ to, subject, html }) => {
  transport
    .sendMail({
      from: sender,
      to: to,
      subject: subject,
      html: html,
    })
    .then(console.log, console.error);
};

module.exports = sendEmail;
